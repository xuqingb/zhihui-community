<script setup>
import Icon from './Icon.vue'
import Avatar from './Avatar.vue'
defineProps({ post: Object, liked: Boolean, saved: Boolean, likes: Number, pending: Boolean })
defineEmits(['like', 'save', 'tag'])
function imageFallback(event) { event.target.src = '/images/fallback.svg' }
</script>
<template>
  <article class="post-card">
    <div class="post-copy">
      <div class="post-author"><Avatar :src="post.authorAvatar" :name="post.authorNickname" :color="post.authorColor || 'blue'" size="xs" /><span>{{ post.authorNickname }}</span><span class="author-dot">·</span><span class="post-category">{{ post.category }}</span></div>
      <a class="post-title" :href="`#/post/${post.id}`"><h2>{{ post.title }}</h2></a>
      <p class="post-description">{{ post.description || '每一种独特的观察，都值得被看见。打开知文，读一读作者的分享。' }}</p>
      <a class="post-read-link" :href="`#/post/${post.id}`">阅读全文<Icon name="ChevronDown" :size="13" /></a>
      <div class="post-bottom">
        <div class="post-actions"><button :class="{ active: liked }" :aria-label="`${liked ? '取消点赞' : '点赞'}：${post.title}`" :aria-pressed="liked" :disabled="pending" @click="$emit('like')"><Icon name="Triangle" :size="12" /><span>赞同 {{ likes }}</span></button><button :class="{ active: saved }" :aria-label="`${saved ? '取消收藏' : '收藏'}：${post.title}`" :aria-pressed="saved" :disabled="pending" @click="$emit('save')"><Icon name="Bookmark" :size="16" /><span>{{ saved ? '已收藏' : '收藏' }}</span></button></div>
        <div class="post-tags"><button v-for="tag in post.tags.slice(0, 2)" :key="tag" @click="$emit('tag', tag)">{{ tag }}</button><span v-if="post.minutes" class="reading-time">{{ post.minutes }} 分钟</span></div>
      </div>
    </div>
    <a class="post-cover" :class="{ 'visual-orbit': !post.cover && post.visual !== 'garden', 'visual-garden': !post.cover && post.visual === 'garden' }" :href="`#/post/${post.id}`" :aria-label="`阅读：${post.title}`" tabindex="-1">
      <img v-if="post.cover" :src="post.cover" :alt="post.title" loading="lazy" @error="imageFallback" />
      <template v-else><div class="cover-orbit orbit-one"></div><div class="cover-orbit orbit-two"></div><div class="cover-orbit orbit-three"></div><span class="cover-star">✳</span><span class="cover-word">{{ post.visual === 'garden' ? 'GROW YOUR MIND' : 'STAY CURIOUS' }}</span></template>
    </a>
  </article>
</template>
