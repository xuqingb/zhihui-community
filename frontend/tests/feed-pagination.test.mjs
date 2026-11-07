import test from 'node:test'
import assert from 'node:assert/strict'
import { computed, effectScope, ref } from 'vue'
import { useFeedPagination } from '../src/useFeedPagination.js'

function fixture({ total = 24, local = true, loadNext = async () => {} } = {}) {
  const scope = effectScope()
  const records = ref(Array.from({ length: total }, (_, index) => ({ id: index + 1, category: index % 4 })))
  const category = ref(null)
  const search = ref('')
  const sort = ref('recommended')
  const route = ref('/discover')
  const localMode = ref(local)
  const loading = ref(false)
  const hasMore = ref(true)
  const items = computed(() => {
    let result = records.value.filter(item => category.value === null || item.category === category.value)
    if (search.value) result = result.filter(item => String(item.id).includes(search.value))
    if (sort.value === 'reverse') result = [...result].reverse()
    return result
  })
  const pager = scope.run(() => useFeedPagination({ items, local: localMode, hasMore, loading, loadNext,
    resetOn: [category, search, sort, route, localMode] }))
  return { ...pager, records, items, category, search, sort, route, localMode, loading, hasMore, stop: () => scope.stop() }
}

test('demo feed appends the second batch without duplicating or replacing the first', async t => {
  const s = fixture(); t.after(s.stop)
  const firstIds = s.visiblePosts.value.map(item => item.id)
  assert.equal(firstIds.length, 12)
  assert.equal(s.hasMorePosts.value, true)
  await s.loadMorePosts()
  assert.deepEqual(s.visiblePosts.value.slice(0, 12).map(item => item.id), firstIds)
  assert.equal(s.visiblePosts.value.length, 24)
  assert.equal(new Set(s.visiblePosts.value.map(item => item.id)).size, 24)
  assert.equal(s.hasMorePosts.value, false)
  await s.loadMorePosts()
  assert.equal(s.visiblePosts.value.length, 24)
})

test('partial final page, empty results, and short collections have no redundant next page', async t => {
  const s = fixture({ total: 25 }); t.after(s.stop)
  await s.loadMorePosts()
  assert.equal(s.visiblePosts.value.length, 24)
  await s.loadMorePosts()
  assert.equal(s.visiblePosts.value.length, 25)
  assert.equal(s.hasMorePosts.value, false)
  s.search.value = 'no-match'
  assert.equal(s.visiblePosts.value.length, 0)
  assert.equal(s.hasMorePosts.value, false)
  s.search.value = ''
  s.category.value = 0
  assert.equal(s.visiblePosts.value.length, 7)
  assert.equal(s.hasMorePosts.value, false)
})

test('changing category, search, ordering, or page resets the visible batch', async t => {
  const s = fixture(); t.after(s.stop)
  await s.loadMorePosts()
  s.category.value = 1
  assert.equal(s.visiblePosts.value.length, 6)
  s.category.value = null
  assert.equal(s.visiblePosts.value.length, 12)
  await s.loadMorePosts()
  s.search.value = '1'
  assert.equal(s.visiblePosts.value.length, 12)
  s.search.value = ''
  assert.equal(s.visiblePosts.value.length, 12)
  await s.loadMorePosts()
  s.sort.value = 'reverse'
  assert.equal(s.visiblePosts.value.length, 12)
  assert.equal(s.visiblePosts.value[0].id, 24)
  await s.loadMorePosts()
  s.route.value = '/saved'
  assert.equal(s.visiblePosts.value.length, 12)
  assert.equal(s.records.value[0].id, 1, 'sorting must not mutate the original collection')
})

test('local batches survive view changes, and mode changes reset the local window', async t => {
  const s = fixture(); t.after(s.stop)
  await s.loadMorePosts()
  assert.equal(s.visiblePosts.value.length, 24)
  s.localMode.value = false
  assert.equal(s.visiblePosts.value.length, 24, 'server results remain fully visible')
  s.localMode.value = true
  assert.equal(s.visiblePosts.value.length, 12)
  s.resetPagination()
  assert.equal(s.visiblePosts.value.length, 12)
})

test('remote pagination delegates to the API and respects loading and exhaustion', async t => {
  let calls = 0
  let s
  s = fixture({ total: 12, local: false, loadNext: async () => {
    calls++
    s.records.value.push({ id: 13, category: 0 })
    s.hasMore.value = false
  } }); t.after(s.stop)
  s.loading.value = true
  await s.loadMorePosts()
  assert.equal(calls, 0)
  s.loading.value = false
  await s.loadMorePosts()
  assert.equal(calls, 1)
  assert.equal(s.visiblePosts.value.length, 13)
  assert.equal(s.hasMorePosts.value, false)
  await s.loadMorePosts()
  assert.equal(calls, 1)
})
