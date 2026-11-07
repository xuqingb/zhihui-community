import { computed, ref } from 'vue'

export const DEMO_LOGIN_KEY = 'zg.demo.login.v1'
const GUEST_CHOICE_KEY = 'zg.guest.choice.v1'
const PRIVATE_PAGES = new Set(['write', 'saved', 'following', 'me'])

export function isPrivatePage(page) { return PRIVATE_PAGES.has(page) }

// Demo identity is explicitly selected by the visitor. It never creates a JWT
// or authorizes requests against the real backend.
export function useCommunityAuth({ isDemo, profile, session, storage = globalThis.sessionStorage }) {
  function read(key) { try { return storage.getItem(key) } catch { return null } }
  function write(key, value) { try { storage.setItem(key, value) } catch { /* Remain session-local in memory. */ } }
  const demoSignedIn = ref(read(DEMO_LOGIN_KEY) === String(profile.value.id))
  const guestChosen = ref(read(GUEST_CHOICE_KEY) === 'true')
  const user = computed(() => {
    if (isDemo.value) return demoSignedIn.value ? profile.value : null
    const value = session.value
    return value?.user?.id != null && typeof value?.token?.accessToken === 'string'
      && value.token.accessToken.trim() ? value.user : null
  })
  function chooseGuest() {
    guestChosen.value = true
    write(GUEST_CHOICE_KEY, 'true')
  }
  function loginDemo() {
    write(DEMO_LOGIN_KEY, String(profile.value.id))
    demoSignedIn.value = true
  }
  function logoutDemo() {
    try { storage.removeItem(DEMO_LOGIN_KEY) } catch { /* The in-memory identity is still cleared. */ }
    demoSignedIn.value = false
    chooseGuest()
  }
  return { user, guestChosen, chooseGuest, loginDemo, logoutDemo }
}
