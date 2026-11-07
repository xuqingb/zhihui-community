import { computed, ref, watch } from 'vue'

export const FEED_PAGE_SIZE = 12

export function useFeedPagination({ items, local, hasMore, loading, loadNext, resetOn = [] }) {
  const localPage = ref(1)
  const visiblePosts = computed(() => local.value
    ? items.value.slice(0, localPage.value * FEED_PAGE_SIZE) : items.value)
  const hasMorePosts = computed(() => local.value
    ? visiblePosts.value.length < items.value.length : hasMore.value)

  function resetPagination() { localPage.value = 1 }
  if (resetOn.length) watch(resetOn, resetPagination, { flush: 'sync' })

  async function loadMorePosts() {
    if (loading.value || !hasMorePosts.value) return
    if (local.value) localPage.value++
    else await loadNext()
  }

  return { visiblePosts, hasMorePosts, loadMorePosts, resetPagination }
}
