import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { DEMO_LOGIN_KEY, isPrivatePage, useCommunityAuth } from '../src/useCommunityAuth.js'

function fixture(values = {}) {
  const data = new Map(Object.entries(values))
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }
  const isDemo = ref(true)
  const profile = ref({ id: '100', nickname: '保留的演示资料', avatar: '/avatars/100.jpg' })
  const session = ref(null)
  return { ...useCommunityAuth({ isDemo, profile, session, storage }), data, storage, isDemo, profile, session }
}

test('preloaded profile and legacy local data never sign a visitor in', () => {
  const s = fixture({ 'zg.demo.profile': '{"id":"100","nickname":"旧资料"}', 'zg.demo.saved': '[{"id":"demo-1"}]' })
  assert.equal(s.user.value, null)
  assert.equal(s.guestChosen.value, false)
  assert.equal(s.data.has(DEMO_LOGIN_KEY), false)
})

test('an explicit demo sign-in persists only the selected demo identity', () => {
  const s = fixture()
  s.loginDemo()
  assert.equal(s.user.value.nickname, '保留的演示资料')
  assert.equal(s.session.value, null, 'demo sign-in must never create backend credentials')
  assert.equal(s.data.get(DEMO_LOGIN_KEY), '100')
  const reload = useCommunityAuth(s)
  assert.equal(reload.user.value.id, '100')
})

test('sign-out clears the identity while retaining profile, drafts, and saved data', () => {
  const s = fixture({ 'zg.demo.saved': '[{"id":"demo-1"}]', 'zg.demo.draft.demo': '{"content":"未完成的草稿"}' })
  s.loginDemo()
  s.logoutDemo()
  assert.equal(s.user.value, null)
  assert.equal(s.data.has(DEMO_LOGIN_KEY), false)
  assert.equal(s.data.get('zg.demo.saved'), '[{"id":"demo-1"}]')
  assert.equal(s.data.get('zg.demo.draft.demo'), '{"content":"未完成的草稿"}')
  assert.equal(s.guestChosen.value, true)
  assert.equal(useCommunityAuth(s).user.value, null)
})

test('guest browsing remembers the choice without granting an identity', () => {
  const s = fixture()
  s.chooseGuest()
  const reload = useCommunityAuth(s)
  assert.equal(reload.guestChosen.value, true)
  assert.equal(reload.user.value, null)
})

test('demo identity cannot authorize real mode or substitute for a real token', () => {
  const s = fixture()
  s.loginDemo()
  s.isDemo.value = false
  assert.equal(s.user.value, null)
  s.session.value = { user: { id: 7, nickname: '真实用户' } }
  assert.equal(s.user.value, null)
  s.session.value.token = { accessToken: ' ' }
  assert.equal(s.user.value, null)
  s.session.value.token.accessToken = 'test-access-token'
  assert.equal(s.user.value.id, 7)
  s.isDemo.value = true
  assert.equal(s.user.value.id, '100')
  s.logoutDemo()
  s.isDemo.value = false
  assert.equal(s.user.value.id, 7, 'independent mode sign-out must not mutate the real session')
  s.session.value = null
  assert.equal(s.user.value, null)
})

test('a stale demo identity for another profile does not authenticate the current visitor', () => {
  const s = fixture({ [DEMO_LOGIN_KEY]: '999' })
  assert.equal(s.user.value, null)
})

test('writing and personal routes require a user; public discovery and reading do not', () => {
  for (const page of ['write', 'saved', 'following', 'me']) assert.equal(isPrivatePage(page), true)
  for (const page of ['discover', 'post', 'topics']) assert.equal(isPrivatePage(page), false)
})
