<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Icon from './Icon.vue'
defineProps({ title: String, wide: Boolean })
const emit = defineEmits(['close'])
const element = ref(null)
let previousFocus
let previousOverflow
onMounted(() => {
  previousFocus = document.activeElement
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  element.value.showModal()
})
onUnmounted(() => {
  document.body.style.overflow = previousOverflow
  previousFocus?.focus?.()
})
</script>
<template>
  <dialog ref="element" class="app-dialog" :class="{ wide }" aria-labelledby="dialog-title" @cancel.prevent="emit('close')" @click="event => { if (event.target === element) emit('close') }">
    <div class="dialog-inner">
      <button class="icon-button dialog-close" aria-label="关闭弹窗" @click="emit('close')"><Icon name="X" /></button>
      <slot name="eyebrow" />
      <h2 id="dialog-title">{{ title }}</h2>
      <slot />
    </div>
  </dialog>
</template>
