<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  name: { type: String, default: '用户' },
  color: { type: String, default: 'blue' },
  size: { type: String, default: '' },
})
const failed = ref(false)
const imageSource = computed(() => !props.src || failed.value ? '/avatars/default.svg' : props.src)
watch(() => props.src, () => { failed.value = false })
</script>
<template>
  <span class="avatar" :class="[color, size && `avatar-${size}`]">
    <img :src="imageSource" :alt="`${name || '用户'}的头像`" decoding="async" @error="failed = true" />
  </span>
</template>
