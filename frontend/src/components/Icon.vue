<script setup>
import {
  Compass, Users, Bookmark, SquarePen, Search, ArrowUpRight, ArrowRight, ArrowLeft,
  ChevronDown, ChevronRight, Heart, LayoutGrid, List, Plus, Check, Menu, X, Settings2,
  LogOut, BookOpen, Leaf, Orbit, Shapes, Quote, Sun, Upload, Eye, FileText, Send,
  LoaderCircle, Clock3, Globe, Sparkles, Link, Bold, Italic, Heading2, Code, Triangle,
} from '@lucide/vue'
defineProps({ name: String, size: { type: [Number, String], default: 20 } })
const icons = { Compass, Users, Bookmark, SquarePen, Search, ArrowUpRight, ArrowRight, ArrowLeft,
  ChevronDown, ChevronRight, Heart, LayoutGrid, List, Plus, Check, Menu, X, Settings2,
  LogOut, BookOpen, Leaf, Orbit, Shapes, Quote, Sun, Upload, Eye, FileText, Send,
  LoaderCircle, Clock3, Globe, Sparkles, Link, Bold, Italic, Heading2, Code, Triangle }
</script>
<template><component :is="icons[name] || icons.Compass" :size="size" :stroke-width="1.65" aria-hidden="true" /></template>
