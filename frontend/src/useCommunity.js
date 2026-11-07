import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { api, readLocal, writeLocal, getSession, saveSession, saveRemoteDraft, streamAnswer, request } from './api'
import { seedPosts, heroPost, authors, demoProfile, topics } from './data'
import { useFeedPagination } from './useFeedPagination.js'
import { isPrivatePage, useCommunityAuth } from './useCommunityAuth.js'

const cleanMarkdown = value => DOMPurify.sanitize(marked.parse(value || '', { breaks: true, gfm: true }))
const readRoute = () => window.location.hash.slice(1) || '/discover'

export function useCommunity() {
  const route = ref(readRoute())
  const page = computed(() => route.value.split('/')[1] || 'discover')
  const mode = ref(readLocal('zg.mode', 'demo'))
  const isDemo = computed(() => mode.value !== 'live')
  const session = ref(getSession())
  const localProfile = ref({ ...demoProfile, ...readLocal('zg.demo.profile', {}) })
  if (!localProfile.value.avatar) localProfile.value.avatar = demoProfile.avatar
  const { user, guestChosen, chooseGuest, loginDemo: startDemoSession, logoutDemo } = useCommunityAuth({
    isDemo, profile: localProfile, session,
  })
  const needsLogin = computed(() => isPrivatePage(page.value) && !user.value)
  const localPosts = ref(readLocal('zg.demo.posts', []))
  const livePosts = ref([])
  function hydrateDemoPost(post) {
    const author = String(post.authorId) === String(localProfile.value.id)
      ? localProfile.value : authors.find(item => item.id === String(post.authorId))
    return {
      ...post,
      authorNickname: author?.nickname || post.authorNickname,
      authorAvatar: author?.avatar || post.authorAvatar || '/avatars/default.svg',
    }
  }
  const posts = computed(() => isDemo.value ? [...localPosts.value, ...seedPosts].map(hydrateDemoPost) : livePosts.value)
  const saveKey = computed(() => isDemo.value ? 'zg.demo.saved' : `zg.live.saved.${user.value?.id || 'guest'}`)
  const savedPosts = ref([])
  const demoLikes = ref(readLocal('zg.demo.likes', {}))
  const followedIds = ref(readLocal('zg.demo.followed', ['101']))
  const liveFollowing = ref([])
  const followed = computed(() => !user.value ? [] : isDemo.value
    ? followedIds.value : liveFollowing.value.map(item => String(item.id)))
  const authorOffset = ref(0)
  const recommendedAuthors = computed(() => isDemo.value
    ? Array.from({ length: Math.min(4, authors.length) }, (_, index) => authors[(authorOffset.value + index) % authors.length])
    : liveFollowing.value.slice(0, 4))
  function nextAuthors() { authorOffset.value = (authorOffset.value + 4) % authors.length }
  const followingAuthors = computed(() => isDemo.value ? authors.filter(author => followed.value.includes(author.id)) : liveFollowing.value)
  const category = ref('全部')
  const sort = ref('recommended')
  const gridView = ref(false)
  const searchInput = ref('')
  const searchTerm = ref('')
  const loading = ref(false)
  const error = ref('')
  const hasMore = ref(false)
  const currentPage = ref(1)
  const cursor = ref('')
  const mobileNav = ref(false)
  const dialog = ref('')
  const busy = ref(false)
  const formError = ref('')
  const toast = ref('')
  let toastTimer
  let loadVersion = 0
  let detailVersion = 0
  let aiController
  const actionBusy = reactive(new Set())
  const detail = ref(null)
  const detailLoading = ref(false)
  const articleContent = ref('')
  const contentError = ref('')
  const articleHtml = computed(() => cleanMarkdown(articleContent.value))
  const aiQuestion = ref('')
  const aiAnswer = ref('')
  const aiBusy = ref(false)
  const aiError = ref('')
  const aiHtml = computed(() => cleanMarkdown(aiAnswer.value))

  function notify(message) {
    toast.value = message
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toast.value = '' }, 3600)
  }
  function persist(key, value) {
    try { writeLocal(key, value); return true } catch { notify('本机存储空间不足，请减少封面图片大小后重试。'); return false }
  }
  function navigate(to) {
    mobileNav.value = false
    if (window.location.hash === `#${to}`) route.value = to
    else window.location.hash = to
  }
  function openDialog(name) { formError.value = ''; dialog.value = name }
  function closeDialog() {
    if (['login', 'register'].includes(dialog.value)) {
      auth.password = auth.code = ''
      if (!user.value) chooseGuest()
    }
    dialog.value = ''
  }
  function browseAsGuest() {
    if (isDemo.value) logoutDemo()
    chooseGuest()
    closeDialog()
    if (needsLogin.value) navigate('/discover')
  }
  function loginDemo() {
    if (!isDemo.value) return
    startDemoSession()
    auth.password = auth.code = ''
    dialog.value = ''
    notify('已使用演示账号，仅用于本机体验')
  }
  function requireUser() {
    if (user.value) return true
    openDialog('login')
    return false
  }
  function setMode(next) {
    if (mode.value === next) return
    mode.value = next
    persist('zg.mode', next)
    category.value = '全部'
    searchInput.value = searchTerm.value = ''
    detail.value = null
    dialog.value = ''
    livePosts.value = []
    navigate('/discover')
    notify(next === 'live' ? '已切换到真实接口模式' : '已进入本地演示空间')
  }
  function search(value = searchInput.value) {
    searchInput.value = searchTerm.value = value.trim()
    category.value = '全部'
    navigate('/discover')
    if (!isDemo.value) loadFeed()
  }
  function selectCategory(value) {
    category.value = value
    searchInput.value = searchTerm.value = ''
    navigate('/discover')
    if (!isDemo.value) loadFeed()
  }

  const filteredPosts = computed(() => {
    if (needsLogin.value) return []
    let result = page.value === 'saved'
      ? (isDemo.value ? savedPosts.value.map(hydrateDemoPost) : [...savedPosts.value]) : [...posts.value]
    if (page.value === 'me') result = isDemo.value
      ? posts.value.filter(post => String(post.authorId) === String(user.value.id)) : [...livePosts.value]
    if (page.value === 'following') result = result.filter(post => followed.value.includes(String(post.authorId)))
    if (category.value !== '全部') result = result.filter(post => post.category === category.value || post.tags.includes(category.value))
    if (isDemo.value && searchTerm.value) {
      const query = searchTerm.value.toLowerCase()
      result = result.filter(post => `${post.title} ${post.description} ${post.tags.join(' ')} ${post.authorNickname}`.toLowerCase().includes(query))
    }
    if (sort.value === 'popular') result.sort((a, b) => b.likes - a.likes)
    if (sort.value === 'latest') result.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    return result
  })
  const isLocalFeed = computed(() => isDemo.value || page.value === 'saved')
  const { visiblePosts, hasMorePosts, loadMorePosts, resetPagination } = useFeedPagination({
    items: filteredPosts,
    local: isLocalFeed,
    hasMore,
    loading,
    loadNext: () => loadFeed(true),
    resetOn: [route, mode, category, searchTerm, sort, () => user.value?.id],
  })
  const featured = computed(() => isDemo.value ? heroPost : posts.value[0])
  const feedTitle = computed(() => ({ saved: '我的收藏', following: '关注的声音', me: '我的知汇' }[page.value] || (searchTerm.value ? `关于「${searchTerm.value}」` : '让好奇心，自由生长。')))
  const feedSubtitle = computed(() => ({
    saved: isDemo.value ? '把喜欢的想法收好，留待下一次灵感来访。' : '保存在此设备、当前账号下的收藏记录。',
    following: '与喜欢的创作者同行，遇见下一次灵感。',
    me: '每一次分享，都是一束微小而明亮的光。',
  }[page.value] || (searchTerm.value ? `发现与你的好奇心有关的内容` : '发现有温度的知识，遇见有共鸣的灵魂。')))

  function syncSaved(items) {
    if (isDemo.value) return
    for (const post of items) {
      if (post.faved === true) {
        const index = savedPosts.value.findIndex(item => item.id === post.id)
        if (index >= 0) savedPosts.value[index] = post
        else savedPosts.value.unshift(post)
      } else if (post.faved === false) savedPosts.value = savedPosts.value.filter(item => item.id !== post.id)
    }
    persist(saveKey.value, savedPosts.value)
  }
  async function loadFeed(more = false) {
    if (isLocalFeed.value) {
      if (!more) resetPagination()
      return
    }
    if (['post', 'write', 'topics', 'saved'].includes(page.value)) return
    if (page.value === 'me' && !user.value) { livePosts.value = []; return }
    const version = ++loadVersion
    loading.value = true
    error.value = ''
    try {
      const nextPage = more ? currentPage.value + 1 : 1
      const result = searchTerm.value
        ? await api.search(searchTerm.value, more ? cursor.value : '')
        : await api.feed(nextPage, page.value === 'me')
      if (version !== loadVersion || isDemo.value) return
      livePosts.value = more ? [...livePosts.value, ...result.items.filter(item => !livePosts.value.some(old => old.id === item.id))] : result.items
      hasMore.value = result.hasMore
      currentPage.value = nextPage
      cursor.value = result.nextAfter || ''
      syncSaved(result.items)
    } catch (cause) { if (version === loadVersion) error.value = cause.message }
    finally { if (version === loadVersion) loading.value = false }
  }

  function isLiked(post) { return !!user.value && (isDemo.value ? !!demoLikes.value[post.id] : !!post.liked) }
  function isSaved(post) { return !!user.value && savedPosts.value.some(item => item.id === post.id) }
  function likeCount(post) { return post.likes + (isDemo.value && demoLikes.value[post.id] ? 1 : 0) }
  function updatePost(id, changes) {
    for (const post of [...livePosts.value, ...savedPosts.value, ...(detail.value ? [detail.value] : [])]) if (post.id === id) Object.assign(post, changes)
  }
  async function toggleLike(post) {
    if (!requireUser() || actionBusy.has(`like-${post.id}`)) return
    actionBusy.add(`like-${post.id}`)
    try {
      if (isDemo.value) {
        demoLikes.value[post.id] = !demoLikes.value[post.id]
        persist('zg.demo.likes', demoLikes.value)
      } else {
        const previous = !!post.liked
        const result = await api.action(post.id, previous ? 'unlike' : 'like')
        updatePost(post.id, { liked: result.liked, likes: Math.max(0, post.likes + (result.liked === previous ? 0 : result.liked ? 1 : -1)) })
      }
    } catch (cause) { notify(cause.message) }
    finally { actionBusy.delete(`like-${post.id}`) }
  }
  async function toggleSave(post) {
    if (!requireUser() || actionBusy.has(`save-${post.id}`)) return
    actionBusy.add(`save-${post.id}`)
    try {
      const previous = isSaved(post)
      if (!isDemo.value) {
        const result = await api.action(post.id, previous ? 'unfav' : 'fav')
        if (result.faved === previous) return
        updatePost(post.id, { faved: result.faved })
      }
      if (previous) savedPosts.value = savedPosts.value.filter(item => item.id !== post.id)
      else savedPosts.value.unshift({ ...post, faved: true })
      persist(saveKey.value, savedPosts.value)
      notify(previous ? '已移出收藏' : '已收藏，灵感下次见')
    } catch (cause) { notify(cause.message) }
    finally { actionBusy.delete(`save-${post.id}`) }
  }
  async function loadFollowing() {
    if (isDemo.value || !user.value) { liveFollowing.value = []; return }
    const accountId = user.value.id
    try {
      const result = await api.following(accountId)
      if (!isDemo.value && user.value?.id === accountId) liveFollowing.value = result
    } catch (cause) { if (!isDemo.value && user.value?.id === accountId) notify(`关注列表：${cause.message}`) }
  }
  async function toggleFollow(author) {
    if (!requireUser() || !author.id || actionBusy.has(`follow-${author.id}`)) return
    actionBusy.add(`follow-${author.id}`)
    try {
      const previous = followed.value.includes(String(author.id))
      if (isDemo.value) {
        followedIds.value = previous ? followedIds.value.filter(id => id !== author.id) : [...followedIds.value, author.id]
        persist('zg.demo.followed', followedIds.value)
      } else {
        await api.follow(author.id, previous)
        await loadFollowing()
      }
      notify(previous ? '已取消关注' : `已关注 ${author.nickname}`)
    } catch (cause) { notify(cause.message) }
    finally { actionBusy.delete(`follow-${author.id}`) }
  }

  async function loadDetail() {
    const id = route.value.split('/')[2]
    const version = ++detailVersion
    detailLoading.value = true
    error.value = contentError.value = articleContent.value = aiAnswer.value = aiError.value = aiQuestion.value = ''
    detail.value = null
    try {
      const post = isDemo.value ? [...posts.value, heroPost].find(item => item.id === id) : await api.detail(id)
      if (version !== detailVersion) return
      if (!post) throw new Error('这篇知文暂时找不到了，去发现页看看吧。')
      detail.value = { ...post }
      syncSaved([detail.value])
      if (isDemo.value) articleContent.value = post.content || ''
      else if (post.contentUrl) {
        try {
          const contentUrl = new URL(post.contentUrl, location.origin)
          if (!['http:', 'https:'].includes(contentUrl.protocol)) throw new Error('无效的内容地址')
          const response = await fetch(contentUrl, { signal: AbortSignal.timeout(12000) })
          if (!response.ok) throw new Error('读取失败')
          const content = await response.text()
          if (version === detailVersion) articleContent.value = content
        } catch { if (version === detailVersion) contentError.value = '正文暂时未能加载，请检查内容存储地址或稍后重试。' }
      }
    } catch (cause) { if (version === detailVersion) error.value = cause.message }
    finally { if (version === detailVersion) detailLoading.value = false }
  }

  const auth = reactive({ identifier: '', password: '', code: '', agreeTerms: false })
  const authTab = ref('password')
  const codeSeconds = ref(0)
  let codeTimer
  async function sendCode() {
    if (isDemo.value) { formError.value = '演示账号无需验证码；真实验证码请切换到真实账号登录。'; return }
    if (!auth.identifier.trim()) { formError.value = '请先输入手机号或邮箱。'; return }
    busy.value = true
    formError.value = ''
    try {
      await api.sendCode({ identifier: auth.identifier.trim(), identifierType: auth.identifier.includes('@') ? 'EMAIL' : 'PHONE', scene: dialog.value === 'register' ? 'REGISTER' : 'LOGIN' })
      codeSeconds.value = 60
      clearInterval(codeTimer)
      codeTimer = setInterval(() => { if (--codeSeconds.value <= 0) clearInterval(codeTimer) }, 1000)
      notify('验证码已发送，请查收')
    } catch (cause) { formError.value = cause.message }
    finally { busy.value = false }
  }
  async function submitAuth() {
    if (isDemo.value) { formError.value = '请选择使用演示账号，或切换到真实账号登录。'; return }
    formError.value = ''
    busy.value = true
    try {
      if (dialog.value === 'register' && !auth.agreeTerms) throw new Error('请先阅读并同意社区约定。')
      const body = { identifier: auth.identifier.trim(), identifierType: auth.identifier.includes('@') ? 'EMAIL' : 'PHONE' }
      if (dialog.value === 'register' || authTab.value === 'code') body.code = auth.code
      if (dialog.value === 'register' || authTab.value === 'password') body.password = auth.password
      const result = dialog.value === 'register' ? await api.register({ ...body, agreeTerms: auth.agreeTerms }) : await api.login(body)
      if (result?.user?.id == null || !result?.token?.accessToken) throw new Error('登录响应缺少用户或令牌，请检查后端服务。')
      saveSession(result)
      dialog.value = ''
      auth.password = auth.code = ''
      await loadFeed()
      notify(`欢迎回来，${result.user.nickname || '知汇创作者'}`)
    } catch (cause) { formError.value = cause.message }
    finally { busy.value = false }
  }
  async function logout() {
    if (isDemo.value) {
      logoutDemo()
      dialog.value = ''
      navigate('/discover')
      notify('已退出演示账号，现在以游客浏览')
      return
    }
    busy.value = true
    try {
      if (session.value?.token?.refreshToken) await request('/auth/logout', { method: 'POST', body: { refreshToken: session.value.token.refreshToken } })
      saveSession(null)
      navigate('/discover')
      notify('已退出登录')
    } catch (cause) { notify(cause.message) }
    finally { busy.value = false }
  }
  const profileForm = reactive({ nickname: '', bio: '', school: '' })
  function editProfile() {
    if (!requireUser()) return
    Object.assign(profileForm, { nickname: user.value?.nickname || '', bio: user.value?.bio || '', school: user.value?.school || '' })
    openDialog('profile')
  }
  async function saveProfile() {
    if (!requireUser()) return
    busy.value = true
    formError.value = ''
    try {
      if (!profileForm.nickname.trim()) throw new Error('给自己起一个名字吧。')
      if (isDemo.value) {
        localProfile.value = { ...localProfile.value, ...profileForm }
        persist('zg.demo.profile', localProfile.value)
      } else {
        const result = await api.profile(profileForm)
        saveSession({ ...session.value, user: { ...session.value.user, ...result } })
      }
      dialog.value = ''
      notify('资料已更新')
    } catch (cause) { formError.value = cause.message }
    finally { busy.value = false }
  }

  const draftKey = computed(() => `zg.${mode.value}.draft.${isDemo.value ? 'demo' : user.value?.id || 'guest'}`)
  const emptyDraft = () => ({ title: '', content: '', description: '', tagText: '', category: '自然与生活', coverData: '', coverFile: null, remoteId: '', remoteCover: '' })
  const draft = reactive({ ...emptyDraft(), ...readLocal(draftKey.value, {}) })
  const draftStatus = ref('你的每一个想法，都值得被记录')
  const editorPreview = ref(false)
  const previewHtml = computed(() => cleanMarkdown(draft.content))
  let draftTimer
  function persistDraft() {
    const { coverFile, ...serializable } = draft
    if (persist(draftKey.value, serializable)) draftStatus.value = '草稿已保存到本机'
  }
  watch(draft, () => {
    draftStatus.value = '正在保存…'
    clearTimeout(draftTimer)
    draftTimer = setTimeout(persistDraft, 800)
  }, { deep: true })
  async function pickCover(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { notify('请选择 JPG、PNG 或 WebP 图片。'); return }
    if (file.size > 4 * 1024 * 1024) { notify('封面图片请小于 4 MB。'); return }
    const reader = new FileReader()
    reader.onload = () => { draft.coverData = String(reader.result); draft.coverFile = file }
    reader.readAsDataURL(file)
    event.target.value = ''
  }
  function removeCover() { draft.coverData = draft.remoteCover = ''; draft.coverFile = null }
  async function generateSummary() {
    if (!draft.content.trim()) { notify('先写一些正文，再生成摘要吧。'); return }
    if (!requireUser()) return
    busy.value = true
    try {
      if (isDemo.value) { draft.description = draft.content.replace(/[#*>`\n]/g, '').slice(0, 50); notify('已提取本地示例摘要（未调用 AI）') }
      else draft.description = (await api.summary(draft.content)).description
    } catch (cause) { notify(cause.message) }
    finally { busy.value = false }
  }
  async function saveDraft(publish = false) {
    if (!requireUser()) return
    formError.value = ''
    if (publish && (!draft.title.trim() || !draft.content.trim())) { formError.value = '请写好标题和正文，再分享给大家。'; return }
    busy.value = true
    try {
      let id
      const tags = [...new Set([draft.category, ...draft.tagText.split(/[,，\s]+/).filter(Boolean)])].slice(0, 20)
      if (isDemo.value) {
        persistDraft()
        if (publish) {
          id = `demo-local-${Date.now()}`
          const post = { id, title: draft.title.trim(), content: draft.content, description: draft.description || draft.content.replace(/[#*>`\n]/g, '').slice(0, 85), tags, category: draft.category, cover: draft.coverData, authorId: String(user.value.id), authorNickname: user.value.nickname, authorAvatar: user.value.avatar, authorColor: 'blue', likes: 0, saves: 0, minutes: Math.max(1, Math.ceil(draft.content.length / 400)), date: new Date().toISOString().slice(0, 10) }
          const updated = [post, ...localPosts.value]
          if (!persist('zg.demo.posts', updated)) return
          localPosts.value = updated
        }
      } else {
        // Rehydrate a persisted image after a reload, before obtaining the upload signature.
        if (draft.coverData && !draft.coverFile && !draft.remoteCover) {
          const blob = await (await fetch(draft.coverData)).blob()
          draft.coverFile = new File([blob], `cover.${blob.type.split('/')[1] || 'jpg'}`, { type: blob.type })
        }
        draft.tags = tags
        id = await saveRemoteDraft(draft, publish)
        persistDraft()
      }
      if (publish) {
        Object.assign(draft, emptyDraft())
        persistDraft()
        navigate(`/post/${id}`)
        notify(isDemo.value ? '已发布到本地演示空间' : '发布成功，让想法被看见')
      } else notify(isDemo.value ? '草稿已保存到本机' : '草稿已同步到后端')
    } catch (cause) { formError.value = cause.message; persistDraft() }
    finally { busy.value = false }
  }

  async function askAi(question = aiQuestion.value) {
    if (!question.trim() || aiBusy.value || !detail.value) return
    if (!requireUser()) return
    aiQuestion.value = question
    aiAnswer.value = aiError.value = ''
    aiBusy.value = true
    aiController = new AbortController()
    const timeout = setTimeout(() => aiController?.abort(), 60000)
    try {
      if (isDemo.value) aiAnswer.value = `**本地演示回答**\n\n这篇知文围绕「${detail.value.title.replaceAll('\n', '')}」展开。\n\n- ${detail.value.description}\n- 作者鼓励从日常的小行动开始，把观察转化为自己的理解。\n- 你可以结合个人经历，记录一个值得继续探索的问题。\n\n*这是预设的交互示例。切换到真实接口模式后，将调用后端的 RAG 问答服务。*`
      else await streamAnswer(detail.value.id, question.trim(), chunk => { aiAnswer.value += chunk }, aiController.signal)
    } catch (cause) { aiError.value = cause.name === 'AbortError' ? '回答已停止，可以重新提问。' : cause.message }
    finally { clearTimeout(timeout); aiBusy.value = false }
  }
  function stopAi() { aiController?.abort() }
  async function sharePost() {
    try { await navigator.clipboard.writeText(location.href); notify('知文链接已复制') }
    catch { notify('请复制浏览器地址栏中的链接分享。') }
  }
  function onHashChange() { route.value = readRoute() }
  function onSessionChange() { session.value = getSession() }
  function onKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('global-search')?.focus() }
    if (event.key === 'Escape') { closeDialog(); mobileNav.value = false }
  }
  watch([saveKey, () => user.value?.id], ([key, id]) => {
    savedPosts.value = id == null ? [] : readLocal(key, [])
  }, { immediate: true })
  watch([mode, () => user.value?.id], ([nextMode, nextId], [previousMode, previousId]) => {
    ++loadVersion
    error.value = ''
    loading.value = false
    hasMore.value = false
    livePosts.value = []
    loadFollowing()
    clearTimeout(draftTimer)
    // Keep a visitor's in-progress writing when signing in from the editor.
    const guestDraft = nextMode === previousMode && !previousId && nextId && page.value === 'write'
      ? { ...draft } : null
    Object.assign(draft, emptyDraft(), readLocal(draftKey.value, guestDraft || {}))
    if (!isDemo.value) loadFeed()
  })
  watch(route, () => {
    ++loadVersion
    error.value = ''
    loading.value = false
    stopAi()
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (page.value === 'post') loadDetail()
    else {
      ++detailVersion
      detail.value = null
      if (needsLogin.value) openDialog('login')
      loadFeed()
    }
  })
  onMounted(() => {
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('zhiguang-session', onSessionChange)
    window.addEventListener('keydown', onKeydown)
    if (page.value === 'post') loadDetail()
    else loadFeed()
    loadFollowing()
    if (needsLogin.value || (!user.value && !guestChosen.value)) openDialog('login')
  })
  onUnmounted(() => {
    window.removeEventListener('hashchange', onHashChange)
    window.removeEventListener('zhiguang-session', onSessionChange)
    window.removeEventListener('keydown', onKeydown)
    clearTimeout(toastTimer); clearTimeout(draftTimer); clearInterval(codeTimer); stopAi()
  })
  return {
    page, route, mode, isDemo, user, needsLogin, localProfile, topics, authors, category, sort, gridView, searchInput, searchTerm,
    loading, error, hasMore, mobileNav, dialog, busy, formError, toast, actionBusy, detail, detailLoading,
    articleHtml, contentError, aiQuestion, aiAnswer, aiBusy, aiError, aiHtml, followed, followingAuthors,
    recommendedAuthors, nextAuthors, filteredPosts, featured, feedTitle, feedSubtitle, savedPosts, localPosts,
    visiblePosts, hasMorePosts, loadMorePosts, isLocalFeed,
    navigate, notify, openDialog, closeDialog, browseAsGuest, loginDemo, setMode, search, selectCategory, loadFeed, isLiked, isSaved, likeCount,
    toggleLike, toggleSave, toggleFollow, loadDetail, auth, authTab, codeSeconds, sendCode, submitAuth, logout,
    profileForm, editProfile, saveProfile, draft, draftStatus, editorPreview, previewHtml, pickCover,
    removeCover, generateSummary, saveDraft, askAi, stopAi, sharePost,
  }
}
