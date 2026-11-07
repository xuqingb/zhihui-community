const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const SESSION_KEY = 'zhiguang.session.v1'
let refreshing = null

export function readLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

export function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) } catch { return null }
}

export function saveSession(value) {
  if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value))
  else sessionStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('zhiguang-session'))
}

export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.status = status }
}

async function raw(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    return await fetch(`${API_BASE}/api/v1${path}`, { ...options, signal: controller.signal })
  } catch (error) {
    throw new ApiError(error.name === 'AbortError' ? '请求超时，请稍后重试。' : '暂时无法连接服务，请检查后端是否已启动。')
  } finally { clearTimeout(timeout) }
}

async function refreshToken() {
  const session = getSession()
  if (!session?.token?.refreshToken) return false
  try {
    const response = await raw('/auth/token/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.token.refreshToken }),
    })
    if (!response.ok) { saveSession(null); return false }
    saveSession({ ...session, token: await response.json() })
    return true
  } catch { return false }
}

export async function request(path, { method = 'GET', body, retry = true } = {}) {
  const headers = { Accept: 'application/json' }
  const token = getSession()?.token?.accessToken
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const response = await raw(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    refreshing ||= refreshToken().finally(() => { refreshing = null })
    if (await refreshing) return request(path, { method, body, retry: false })
    saveSession(null)
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    throw new ApiError(detail.message || (response.status === 401 ? '请先登录，再继续操作。' : `请求失败（${response.status}），请稍后重试。`), response.status)
  }
  if (response.status === 204) return null
  return response.json()
}

export function normalizePost(item) {
  const tags = Array.isArray(item.tags) ? item.tags : []
  const category = /设计|建筑|美学/.test(tags.join(' ')) ? '设计与美学'
    : /自然|生活|旅行|户外/.test(tags.join(' ')) ? '自然与生活'
      : /阅读|成长|知识/.test(tags.join(' ')) ? '阅读与成长' : '科技与未来'
  return {
    ...item, id: String(item.id), title: item.title || '未命名知文', description: item.description || '', tags,
    category, cover: item.coverImage || item.images?.[0] || '',
    authorNickname: item.authorNickname || '知汇创作者', authorColor: 'olive',
    likes: Number(item.likeCount || 0), saves: Number(item.favoriteCount || 0),
    date: item.publishTime ? new Date(item.publishTime).toLocaleDateString('zh-CN') : '',
    minutes: null,
  }
}

export const api = {
  async feed(page = 1, mine = false) {
    const result = await request(`/knowposts/${mine ? 'mine' : 'feed'}?page=${page}&size=12`)
    return { ...result, items: (result.items || []).map(normalizePost) }
  },
  async search(q, after = '') {
    const result = await request(`/search?${new URLSearchParams({ q, size: '12', ...(after ? { after } : {}) })}`)
    return { ...result, items: (result.items || []).map(normalizePost) }
  },
  async detail(id) { return normalizePost(await request(`/knowposts/detail/${encodeURIComponent(id)}`)) },
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  sendCode: (body) => request('/auth/send-code', { method: 'POST', body }),
  me: () => request('/auth/me'),
  profile: (body) => request('/profile', { method: 'PATCH', body }),
  action: (id, action) => request(`/action/${action}`, { method: 'POST', body: { entityType: 'knowpost', entityId: String(id) } }),
  follow: (id, following) => request(`/relation/${following ? 'unfollow' : 'follow'}?toUserId=${encodeURIComponent(id)}`, { method: 'POST' }),
  following: (id) => request(`/relation/following?userId=${encodeURIComponent(id)}&limit=100`),
  relation: (id) => request(`/relation/status?toUserId=${encodeURIComponent(id)}`),
  summary: (content) => request('/knowposts/description/suggest', { method: 'POST', body: { content } }),
}

export async function uploadObject(postId, blob, scene, ext) {
  const signed = await request('/storage/presign', {
    method: 'POST', body: { scene, postId: String(postId), contentType: blob.type, ext },
  })
  const response = await fetch(signed.putUrl, { method: 'PUT', headers: signed.headers, body: blob, signal: AbortSignal.timeout(60000) })
  if (!response.ok) throw new ApiError('上传失败，请检查对象存储的访问及跨域配置。', response.status)
  const url = new URL(signed.putUrl)
  url.search = ''
  return { objectKey: signed.objectKey, etag: response.headers.get('ETag')?.replaceAll('"', ''), url: url.href }
}

export async function saveRemoteDraft(draft, publish = false) {
  const id = draft.remoteId || (await request('/knowposts/drafts', { method: 'POST' })).id
  // Preserve the created ID immediately so a failed upload does not create another draft on retry.
  draft.remoteId = String(id)
  const content = new Blob([draft.content], { type: 'text/markdown' })
  const uploaded = await uploadObject(id, content, 'knowpost_content', '.md')
  if (!uploaded.etag) throw new ApiError('对象存储未返回 ETag，请在 OSS 跨域规则中暴露 ETag 响应头。')
  const digest = await crypto.subtle.digest('SHA-256', await content.arrayBuffer())
  const sha256 = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('')
  await request(`/knowposts/${id}/content/confirm`, { method: 'POST', body: {
    objectKey: uploaded.objectKey, etag: uploaded.etag, size: content.size, sha256,
  } })
  let cover = draft.remoteCover || ''
  if (draft.coverFile) {
    cover = (await uploadObject(id, draft.coverFile, 'knowpost_image', draft.coverFile.name.split('.').pop())).url
    draft.remoteCover = cover
    draft.coverFile = null
  }
  await request(`/knowposts/${id}`, { method: 'PATCH', body: {
    title: draft.title, description: draft.description, tags: draft.tags,
    imgUrls: cover ? [cover] : [], visible: 'public', isTop: false,
  } })
  if (publish) await request(`/knowposts/${id}/publish`, { method: 'POST' })
  return String(id)
}

export async function streamAnswer(id, question, onChunk, signal) {
  const headers = { Accept: 'text/event-stream' }
  if (getSession()?.token?.accessToken) headers.Authorization = `Bearer ${getSession().token.accessToken}`
  const url = `${API_BASE}/api/v1/knowposts/${encodeURIComponent(id)}/qa/stream?${new URLSearchParams({ question })}`
  const response = await fetch(url, { headers, signal })
  if (!response.ok) throw new ApiError(`问答请求失败（${response.status}），请稍后重试。`, response.status)
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  function consume(event) {
    const data = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).replace(/^ /, '')).join('\n')
    if (data && data !== '[DONE]') onChunk(data)
  }
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      buffer = buffer.replace(/\r\n/g, '\n')
      let boundary
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        consume(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
      }
      if (done) { if (buffer.trim()) consume(buffer); break }
    }
  } finally { reader.releaseLock() }
}
