<script setup>
import { computed, reactive, ref } from 'vue'
import { useCommunity } from './useCommunity'
import Icon from './components/Icon.vue'
import PostCard from './components/PostCard.vue'
import AppDialog from './components/AppDialog.vue'
import Avatar from './components/Avatar.vue'

const s = reactive(useCommunity())
const editor = ref(null)
const coverInput = ref(null)
const nav = [
  { page: 'discover', label: '首页', icon: 'Compass' },
  { page: 'following', label: '关注', icon: 'Users' },
  { page: 'topics', label: '专题', icon: 'Shapes' },
  { page: 'saved', label: '收藏', icon: 'Bookmark' },
]
const categories = ['全部', '科技与未来', '设计与美学', '自然与生活', '阅读与成长']
const today = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Taipei' }).format(new Date())
const dialogTitle = computed(() => ['login', 'register'].includes(s.dialog) && s.isDemo
  ? '登录知汇演示空间'
  : ({ login: '欢迎回到知汇', register: '从好奇，开始相遇', profile: '让大家认识你', settings: '选择你的知汇空间', guidelines: '认真分享，友善相遇' }[s.dialog] || '知汇'))
const detailAuthor = computed(() => ({ id: String(s.detail?.authorId || ''), nickname: s.detail?.authorNickname, color: s.detail?.authorColor || 'olive' }))
function goNav(path) {
  s.category = '全部'
  s.searchTerm = s.searchInput = ''
  if (s.route === path) s.loadFeed()
  s.navigate(path)
}
function chooseAuthMode(mode) {
  const name = s.dialog === 'register' ? 'register' : 'login'
  s.setMode(mode)
  s.openDialog(name)
}
function formatText(before, after = '') {
  if (!editor.value) return
  const field = editor.value
  const start = field.selectionStart
  const end = field.selectionEnd
  const selection = s.draft.content.slice(start, end) || '文字'
  s.draft.content = s.draft.content.slice(0, start) + before + selection + after + s.draft.content.slice(end)
  requestAnimationFrame(() => { field.focus(); field.setSelectionRange(start + before.length, start + before.length + selection.length) })
}
function imageFallback(event) { event.target.src = '/images/fallback.svg' }
</script>

<template>
  <div class="app-shell">
    <div v-if="s.mobileNav" class="nav-scrim" @click="s.mobileNav = false"></div>
    <aside class="sidebar" :class="{ 'is-open': s.mobileNav }" aria-label="主导航">
      <button class="icon-button sidebar-close" aria-label="关闭导航" @click="s.mobileNav = false"><Icon name="X" :size="19" /></button>
      <a class="brand" href="#/discover" @click="goNav('/discover')"><span class="brand-symbol">✳</span><span class="brand-name">知汇<span>ZHIHUI</span></span></a>
      <p class="brand-caption">让每一份好奇，都有回响。</p>
      <div class="nav-section-label">你的知识漫游</div>
      <nav class="primary-nav"><a v-for="item in nav" :key="item.page" :href="`#/${item.page}`" :class="{ selected: s.page === item.page }" :aria-current="s.page === item.page ? 'page' : undefined" @click.prevent="goNav(`/${item.page}`)"><Icon :name="item.icon" :size="21" /><span>{{ item.label }}</span><span v-if="item.page === 'discover'" class="nav-new">NEW</span><span v-if="item.page === 'saved' && s.savedPosts.length" class="nav-count">{{ s.savedPosts.length }}</span></a></nav>
      <div class="sidebar-line"></div>
      <div class="nav-section-label topic-nav-title">感兴趣的方向<span>✧</span></div>
      <div class="topic-nav"><button v-for="topic in s.topics" :key="topic.name" @click="s.selectCategory(topic.name)"><span class="topic-dot" :class="topic.color"></span>{{ topic.name }}<Icon name="ChevronRight" :size="14" /></button></div>
      <div class="sidebar-invitation"><span class="invitation-art">✺<span>✧</span></span><h3>好想法，值得被看见。</h3><p>写下你的思考，<br />让知识在分享中发光。</p><a href="#/write">开始你的创作<Icon name="ArrowUpRight" :size="16" /></a></div>
      <div class="sidebar-bottom"><button class="space-status" @click="s.openDialog('settings')"><span class="status-dot" :class="{ live: !s.isDemo }"></span>{{ s.isDemo ? '本地演示空间' : '真实接口模式' }}<Icon name="Settings2" :size="15" /></button><button class="sidebar-user" @click="s.user ? goNav('/me') : s.openDialog('login')"><Avatar :src="s.user?.avatar" :name="s.user?.nickname" /><span>{{ s.user?.nickname || '登录，开启探索' }}<small>{{ s.user ? '保持好奇，慢慢生长' : '让想法彼此相遇' }}</small></span><Icon name="ChevronRight" :size="16" /></button></div>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <a href="#/discover" class="header-brand" @click.prevent="goNav('/discover')">知汇</a>
        <nav class="header-nav" aria-label="顶部导航"><a v-for="item in nav" :key="item.page" :href="`#/${item.page}`" :class="{ active: s.page === item.page }" :aria-current="s.page === item.page ? 'page' : undefined" @click.prevent="goNav(`/${item.page}`)">{{ item.label }}</a></nav>
        <button class="icon-button mobile-menu" aria-label="打开导航" @click="s.mobileNav = !s.mobileNav"><Icon name="Menu" /></button>
        <form class="global-search" role="search" @submit.prevent="s.search()"><input id="global-search" v-model="s.searchInput" type="search" placeholder="搜索你感兴趣的内容" aria-label="搜索知文" /><button type="submit" class="icon-button" aria-label="提交搜索"><Icon name="Search" :size="19" /></button></form>
        <div class="topbar-right"><button v-if="!s.user" class="text-button login-link" @click="s.openDialog('login')">登录 / 注册</button><template v-else><span v-if="s.isDemo" class="demo-account-badge">演示账号</span><button class="header-user" aria-label="打开个人主页" @click="goNav('/me')"><Avatar :src="s.user.avatar" :name="s.user.nickname" /></button></template><a class="button button-primary write-button" href="#/write"><Icon name="SquarePen" :size="17" /><span>写文章</span></a></div>
      </header>

      <main id="main-content" class="main-content" :class="{ 'reading-layout': s.page === 'post', 'writing-layout': s.page === 'write' }">
        <section v-if="s.needsLogin" class="auth-required">
          <span class="auth-required-icon"><Icon :name="s.page === 'write' ? 'SquarePen' : 'Users'" :size="30" /></span>
          <h1>{{ s.page === 'write' ? '登录后，开始你的创作' : '登录后，查看你的个人空间' }}</h1>
          <p>收藏、关注、个人资料和创作内容，需要登录后访问。</p>
          <button class="button button-primary" @click="s.openDialog('login')">登录 / 注册<Icon name="ArrowRight" :size="16" /></button>
          <button class="text-button" @click="s.browseAsGuest()">先浏览公开文章</button>
        </section>
        <template v-else-if="['discover', 'following', 'saved', 'me'].includes(s.page)">
          <section v-if="s.page !== 'discover' || s.searchTerm" class="page-intro"><div><h1>{{ s.feedTitle }}</h1><p>{{ s.feedSubtitle }}</p></div><span class="today">{{ today }}</span></section>

          <div class="content-grid"><div class="feed-column">

            <section v-if="s.page === 'me'" class="profile-card"><div class="profile-banner"><span>KEEP GROWING.</span><span class="profile-spark">✳</span></div><div class="profile-body"><Avatar :src="s.user?.avatar" :name="s.user?.nickname" size="lg" /><div class="profile-info"><h2>{{ s.user?.nickname || '你的故事，等你来写' }}</h2><p>{{ s.user?.bio || '登录后，在这里留下你的思考与灵感。' }}</p><span v-if="s.user" class="profile-handle">@{{ s.user.zgId || s.user.zhId || 'zhihui_reader' }}</span></div><button class="button button-outline" @click="s.user ? s.editProfile() : s.openDialog('login')">{{ s.user ? '编辑资料' : '登录知汇' }}</button></div><div class="profile-stats"><span><strong>{{ s.filteredPosts.length }}</strong> {{ s.isDemo ? '发布知文' : '已加载知文' }}</span><span><strong>{{ s.savedPosts.length }}</strong> 本机收藏</span><span><strong>{{ s.followed.length }}</strong> 关注创作者</span><button v-if="s.user" class="text-button" :disabled="s.busy" @click="s.logout()"><Icon name="LogOut" :size="14" />{{ s.isDemo ? '退出演示账号' : '退出登录' }}</button></div></section>

            <section v-if="s.page === 'following'" class="following-section"><div class="section-heading"><h2>与你同频的人</h2><span>{{ s.followingAuthors.length }} 位创作者</span></div><div v-if="s.followingAuthors.length" class="following-list"><div v-for="author in s.followingAuthors" :key="author.id" class="following-person"><Avatar :src="author.avatar" :name="author.nickname" :color="author.color || 'blue'" /><div><strong>{{ author.nickname }}</strong><p>{{ author.bio || '保持好奇，分享所见。' }}</p></div><button class="button button-soft" :disabled="s.actionBusy.has(`follow-${author.id}`)" @click="s.toggleFollow(author)"><Icon name="Check" :size="14" />已关注</button></div></div><div v-else class="empty-state compact"><Icon name="Users" :size="30" /><h3>遇见下一位同路人</h3><p>在知文详情页关注喜欢的作者，新的连接从这里开始。</p><button class="text-button" @click="goNav('/discover')">去发现知文<Icon name="ArrowRight" :size="15" /></button></div></section>

            <template v-if="s.page !== 'following' || s.isDemo">
              <div class="feed-toolbar"><div v-if="s.page === 'discover'" class="category-tabs" aria-label="文章分类"><button v-for="cat in categories" :key="cat" :class="{ active: s.category === cat }" :aria-pressed="s.category === cat" @click="s.selectCategory(cat)">{{ cat === '全部' ? '为你推荐' : cat }}</button></div><h2 v-else class="feed-section-title">{{ s.page === 'me' ? '我的创作' : s.page === 'saved' ? '值得再次打开的想法' : '他们的最新分享' }}</h2><button class="icon-button view-toggle" :aria-label="s.gridView ? '切换列表视图' : '切换网格视图'" @click="s.gridView = !s.gridView"><Icon :name="s.gridView ? 'List' : 'LayoutGrid'" :size="17" /></button></div>
              <div class="feed-meta"><span>{{ s.searchTerm ? '搜索结果' : s.category !== '全部' ? s.category : '每一次打开，都有新的收获' }}<span v-if="s.searchTerm || s.page === 'saved'" class="result-count"> · {{ s.filteredPosts.length }} 篇</span></span><label class="sort-control"><select v-model="s.sort" aria-label="文章排序"><option value="recommended">推荐排序</option><option value="latest">最新发布</option><option value="popular">最多喜欢</option></select><Icon name="ChevronDown" :size="12" /></label></div>
              <div v-if="s.loading && !s.filteredPosts.length" class="skeleton-list" aria-label="正在加载知文" aria-busy="true"><div v-for="i in 3" :key="i" class="skeleton-post"><div><span></span><span></span><span></span></div><span></span></div></div>
              <div v-else-if="s.error" class="error-state" role="alert"><Icon name="Globe" :size="28" /><h3>连接暂时停了一下</h3><p>{{ s.error }}</p><div><button class="button button-primary" @click="s.loadFeed()">重新加载</button><button class="button button-outline" @click="s.openDialog('settings')">连接设置</button></div></div>
              <div v-else-if="!s.filteredPosts.length" class="empty-state"><div class="empty-illustration"><Icon :name="s.page === 'saved' ? 'Bookmark' : s.page === 'me' ? 'SquarePen' : 'Search'" :size="34" /><span>✧</span></div><h3>{{ s.page === 'saved' ? '给喜欢的想法，留一个位置' : s.page === 'me' ? '第一篇知文，从一个想法开始' : '换个方向，灵感也许就在附近' }}</h3><p>{{ s.page === 'saved' ? '点击知文旁的收藏图标，就能在这里再次找到它。' : s.page === 'me' ? '不必等到想法完美，记录本身就很有意义。' : '试试其他关键词或分类，发现更多值得阅读的内容。' }}</p><button class="button button-primary" @click="s.page === 'me' ? s.navigate('/write') : goNav('/discover')">{{ s.page === 'me' ? '写下第一篇知文' : '发现更多好内容' }}<Icon name="ArrowRight" :size="16" /></button></div>
              <div v-else class="post-list" :class="{ 'grid-view': s.gridView }"><PostCard v-for="post in s.visiblePosts" :key="post.id" :post="post" :liked="s.isLiked(post)" :saved="s.isSaved(post)" :likes="s.likeCount(post)" :pending="s.actionBusy.has(`like-${post.id}`) || s.actionBusy.has(`save-${post.id}`)" @like="s.toggleLike(post)" @save="s.toggleSave(post)" @tag="s.search($event)" /></div>
              <div v-if="s.visiblePosts.length && !s.error" class="feed-progress" aria-live="polite">已显示 {{ s.visiblePosts.length }} 篇<template v-if="s.isLocalFeed"> / 共 {{ s.filteredPosts.length }} 篇</template></div>
              <button v-if="s.hasMorePosts && !s.error" class="load-more" :disabled="s.loading" @click="s.loadMorePosts()"><Icon v-if="s.loading" name="LoaderCircle" class="spin" :size="17" />{{ s.loading ? '正在加载…' : '加载更多' }}<Icon v-if="!s.loading" name="ArrowRight" :size="15" /></button><div v-else-if="s.visiblePosts.length && !s.error" class="feed-end"><span></span>已显示全部内容<span></span></div>
            </template>
          </div>

          <aside class="right-column" aria-label="灵感与推荐">
            <section class="creator-center"><div class="section-heading"><h2><Icon name="SquarePen" :size="20" />创作中心</h2><button class="text-button" @click="goNav('/me')">我的主页<Icon name="ChevronRight" :size="14" /></button></div><div class="creator-shortcuts"><a href="#/write"><span class="shortcut-blue"><Icon name="SquarePen" :size="22" /></span>写文章</a><a href="#/saved"><span class="shortcut-orange"><Icon name="Bookmark" :size="22" /></span>看收藏</a><a href="#/topics"><span class="shortcut-purple"><Icon name="Shapes" :size="22" /></span>逛专题</a></div><div class="creator-welcome"><strong>{{ s.user ? `你好，${s.user.nickname}` : '开启你的创作之旅' }}</strong><p>把你的知识、经验和见解，<br />分享给更多有需要的人。</p><span class="creator-welcome-icon"><Icon name="FileText" :size="42" /></span></div><a class="creator-write" href="#/write"><Icon name="Plus" :size="18" />开始创作</a></section>
            <section class="sidebar-section"><div class="section-heading"><h2>此刻，大家在聊</h2><button class="text-button" @click="goNav('/topics')">更多<Icon name="ArrowUpRight" :size="13" /></button></div><div class="trending-topics"><button v-for="(topic, index) in ['AI 时代的好奇心', '生活里的设计感', '建立自己的知识花园', '与自然重新连接']" :key="topic" @click="s.search(['人工智能', '设计', '知识管理', '自然'][index])"><span class="trend-number" :class="{ first: index === 0 }">0{{ index + 1 }}</span><span>{{ topic }}<small>{{ ['从技术出发，向人文靠近', '发现那些被忽略的美', '让知识在连接中生长', '给日常，留一点山野'][index] }}</small></span><span v-if="index === 0" class="hot-label">热</span></button></div></section>
            <section v-if="s.recommendedAuthors.length" class="sidebar-section authors-section"><div class="section-heading"><h2>{{ s.isDemo ? '值得遇见的创作者' : '我关注的创作者' }}</h2><button v-if="s.isDemo" class="text-button" @click="s.nextAuthors()">换一批<Icon name="ArrowRight" :size="13" /></button></div><div v-for="author in s.recommendedAuthors" :key="author.id" class="creator-row"><Avatar :src="author.avatar" :name="author.nickname" :color="author.color || 'blue'" /><div><strong>{{ author.nickname }}</strong><small>{{ author.bio || '记录思考，分享所见' }}</small></div><button :class="['follow-button', { following: s.followed.includes(String(author.id)) }]" :aria-label="`${s.followed.includes(String(author.id)) ? '取消关注' : '关注'} ${author.nickname}`" :disabled="s.actionBusy.has(`follow-${author.id}`)" @click="s.toggleFollow(author)"><Icon :name="s.followed.includes(String(author.id)) ? 'Check' : 'Plus'" :size="15" /></button></div></section>
            <section class="gentle-callout"><span>每一份认真，都值得被看见。</span><p>分享你的独特见解，发现更大的世界。</p><a href="#/write">写下你的第一篇文章<Icon name="ArrowRight" :size="15" /></a></section>
            <div class="connection-bar"><button @click="s.openDialog('settings')"><span class="status-dot" :class="{ live: !s.isDemo }"></span>{{ s.isDemo ? '本地演示空间' : '真实接口模式' }}</button><button aria-label="连接设置" @click="s.openDialog('settings')"><Icon name="Settings2" :size="16" /></button></div>
            <footer class="community-footer"><div><button @click="s.openDialog('guidelines')">社区约定</button><span>·</span><button @click="s.openDialog('settings')">连接设置</button><span>·</span><a href="#/topics">探索知汇</a></div><p>知汇 ZHIHUI © {{ new Date().getFullYear() }}</p><span>知识因分享而有光。</span></footer>
          </aside></div>
        </template>

        <template v-else-if="s.page === 'topics'"><section class="page-intro"><div><div class="eyebrow">FOLLOW YOUR CURIOSITY</div><h1>世界的每一面，都值得探索。<span class="title-spark">✧</span></h1><p>从你喜欢的方向开始，找到下一份热爱。</p></div></section><div class="topics-hero"><div><span class="eyebrow">THE ART OF EXPLORING</span><h2>好奇，是一切的开始。</h2><p>不必给兴趣设限。跨出熟悉的领域，<br />也许一个新的世界，正在等你推开门。</p></div><div class="topics-art"><span>✳</span><i></i><b></b></div></div><div class="topic-cards"><button v-for="(topic, index) in s.topics" :key="topic.name" class="topic-card" :class="topic.color" @click="s.selectCategory(topic.name)"><div><span class="topic-card-number">0{{ index + 1 }}</span><Icon :name="topic.icon" :size="30" /></div><span class="eyebrow">{{ topic.english }}</span><h2>{{ topic.name }}</h2><p>{{ topic.count }}</p><span class="topic-card-link">进入专题<Icon name="ArrowUpRight" :size="18" /></span></button></div><p class="topics-end">兴趣相遇的地方，知识自然生长。<span>✦</span></p></template>

        <template v-else-if="s.page === 'post'"><a href="#/discover" class="back-link"><Icon name="ArrowLeft" :size="16" />返回发现</a><div v-if="s.detailLoading" class="article-loading"><Icon name="LoaderCircle" class="spin" :size="28" /><span>正在展开一个新的世界…</span></div><div v-else-if="s.error" class="error-state" role="alert"><Icon name="BookOpen" :size="30" /><h2>暂时无法打开这篇知文</h2><p>{{ s.error }}</p><button class="button button-primary" @click="s.loadDetail()">重新加载</button></div><div v-else-if="s.detail" class="article-layout"><article class="article-paper"><div class="article-category"><span>{{ s.detail.category }}</span><span v-if="s.detail.minutes">{{ s.detail.minutes }} 分钟阅读</span><span v-if="s.isDemo" class="demo-content-label">演示知文</span></div><h1>{{ s.detail.title.replaceAll('\n', '') }}</h1><p class="article-deck">{{ s.detail.description }}</p><div class="article-author-row"><Avatar :src="s.detail.authorAvatar" :name="s.detail.authorNickname" :color="s.detail.authorColor" /><div><strong>{{ s.detail.authorNickname }}</strong><small>{{ s.detail.date || '知汇创作者' }}</small></div><button v-if="detailAuthor.id && detailAuthor.id !== String(s.user?.id)" class="button button-soft" :disabled="s.actionBusy.has(`follow-${detailAuthor.id}`)" @click="s.toggleFollow(detailAuthor)"><Icon :name="s.followed.includes(detailAuthor.id) ? 'Check' : 'Plus'" :size="14" />{{ s.followed.includes(detailAuthor.id) ? '已关注' : '关注作者' }}</button></div><img v-if="s.detail.cover" class="article-hero" :src="s.detail.cover" :alt="s.detail.title" @error="imageFallback" /><div v-if="s.articleHtml" class="prose article-prose" v-html="s.articleHtml"></div><div v-else-if="s.contentError" class="content-error"><p>{{ s.contentError }}</p><button class="text-button" @click="s.loadDetail()">重新加载正文</button></div><p v-else class="muted article-empty">这篇知文暂未附加正文。</p><div class="article-bottom-tags"><button v-for="tag in s.detail.tags" :key="tag" @click="s.search(tag)"># {{ tag }}</button></div><div class="article-closing"><span>✳</span><p>愿每一次阅读，都带来一点新的光。</p></div><div class="article-action-bar"><button :class="['button', s.isLiked(s.detail) ? 'button-primary' : 'button-outline']" :disabled="s.actionBusy.has(`like-${s.detail.id}`)" :aria-pressed="s.isLiked(s.detail)" @click="s.toggleLike(s.detail)"><Icon name="Heart" :size="17" />喜欢 · {{ s.likeCount(s.detail) }}</button><button :class="['button', s.isSaved(s.detail) ? 'button-soft' : 'button-outline']" :disabled="s.actionBusy.has(`save-${s.detail.id}`)" :aria-pressed="s.isSaved(s.detail)" @click="s.toggleSave(s.detail)"><Icon name="Bookmark" :size="17" />{{ s.isSaved(s.detail) ? '已收藏' : '收藏知文' }}</button><button class="icon-button share-button" aria-label="复制知文链接" @click="s.sharePost()"><Icon name="Link" :size="19" /></button></div></article><aside class="article-aside"><section class="ai-reading-card"><div class="ai-card-icon"><Icon name="Sparkles" :size="23" /></div><span class="eyebrow">A LITTLE HELP TO GO DEEPER</span><h2>不止于阅读，<br />让好奇继续。</h2><p>关于这篇知文，<br />问问你的 AI 阅读伙伴。</p><span v-if="s.isDemo" class="demo-ai-note">演示回答 · 未连接大模型</span><button class="suggested-question" :disabled="s.aiBusy" @click="s.askAi('用三句话总结这篇知文')">帮我梳理文章要点<Icon name="ArrowUpRight" :size="14" /></button><button class="suggested-question" :disabled="s.aiBusy" @click="s.askAi('这篇知文给日常生活带来哪些启发？')">有哪些值得实践的启发？<Icon name="ArrowUpRight" :size="14" /></button><div v-if="s.aiAnswer" class="ai-answer prose" aria-live="polite" v-html="s.aiHtml"></div><p v-if="s.aiError" class="form-error" role="alert">{{ s.aiError }}</p><div v-if="s.aiBusy" class="ai-thinking" role="status"><Icon name="LoaderCircle" class="spin" :size="15" />正在认真思考…<button @click="s.stopAi()">停止</button></div><form class="ai-question-form" @submit.prevent="s.askAi()"><input v-model="s.aiQuestion" placeholder="写下你的好奇…" aria-label="关于知文的问题" maxlength="500" :disabled="s.aiBusy" /><button type="submit" class="icon-button" :disabled="s.aiBusy || !s.aiQuestion.trim()" aria-label="发送问题"><Icon name="ArrowUpRight" :size="19" /></button></form></section><div class="article-aside-note"><Icon name="BookOpen" :size="20" /><p>读慢一点，<br />让好想法留得久一点。</p></div></aside></div></template>

        <template v-else-if="s.page === 'write'"><div class="editor-topline"><a href="#/discover" class="back-link"><Icon name="ArrowLeft" :size="16" />返回发现</a><span class="editor-status"><span class="status-dot"></span>{{ s.draftStatus }}</span><div class="editor-top-actions"><button class="button button-outline" :disabled="s.busy" @click="s.saveDraft(false)">保存草稿</button><button class="button button-primary" :disabled="s.busy" @click="s.saveDraft(true)"><Icon :name="s.busy ? 'LoaderCircle' : 'ArrowUpRight'" :class="{ spin: s.busy }" :size="17" />{{ s.busy ? '正在保存…' : '发布知文' }}</button></div></div><div class="editor-grid"><section class="editor-paper"><div class="eyebrow">EVERY IDEA STARTS SOMEWHERE</div><input v-model="s.draft.title" class="editor-title" placeholder="一个好想法，从这里开始…" aria-label="知文标题" maxlength="150" /><div class="editor-toolbar"><div><button class="icon-button" title="二级标题" aria-label="插入二级标题" @click="formatText('\n## ')"><Icon name="Heading2" :size="18" /></button><button class="icon-button" title="粗体" aria-label="插入粗体" @click="formatText('**', '**')"><Icon name="Bold" :size="17" /></button><button class="icon-button" title="斜体" aria-label="插入斜体" @click="formatText('*', '*')"><Icon name="Italic" :size="17" /></button><span></span><button class="icon-button" title="引用" aria-label="插入引用" @click="formatText('\n> ')"><Icon name="Quote" :size="17" /></button><button class="icon-button" title="链接" aria-label="插入链接" @click="formatText('[', '](https://example.com)')"><Icon name="Link" :size="17" /></button><button class="icon-button" title="代码" aria-label="插入代码" @click="formatText('`', '`')"><Icon name="Code" :size="18" /></button></div><button :class="['preview-toggle', { active: s.editorPreview }]" :aria-pressed="s.editorPreview" @click="s.editorPreview = !s.editorPreview"><Icon :name="s.editorPreview ? 'FileText' : 'Eye'" :size="15" />{{ s.editorPreview ? '继续编辑' : '预览' }}</button></div><div v-if="s.editorPreview" class="prose editor-preview" v-html="s.previewHtml || '<p>写下一些内容，就能在这里预览。</p>'"></div><textarea v-else ref="editor" v-model="s.draft.content" class="editor-content" placeholder="分享一个观察、一段经历，或一个还没有答案的问题。&#10;&#10;不用急着写得完美，让想法自然生长。&#10;&#10;支持 Markdown，专注于你的表达。" aria-label="知文正文"></textarea><div class="editor-bottomline"><span>{{ s.draft.content.length }} 字</span><span><Icon name="Leaf" :size="14" />让表达，回到简单。</span></div><p v-if="s.formError" class="form-error editor-error" role="alert">{{ s.formError }}</p></section><aside class="editor-aside"><section class="editor-settings-card"><div class="section-heading"><h2>给想法一个好封面</h2><span>选填</span></div><input ref="coverInput" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" aria-label="上传知文封面" @change="s.pickCover" /><div v-if="s.draft.coverData || s.draft.remoteCover" class="editor-cover-preview"><img :src="s.draft.coverData || s.draft.remoteCover" alt="知文封面预览" /><button class="icon-button" aria-label="移除封面" @click="s.removeCover()"><Icon name="X" :size="16" /></button></div><button v-else class="cover-upload" @click="coverInput.click()"><span><Icon name="Upload" :size="21" /></span><strong>选择一张封面</strong><small>JPG / PNG / WebP · 最大 4 MB</small></button><label class="field-label" for="draft-category">选择一个方向</label><div class="select-wrap"><select id="draft-category" v-model="s.draft.category"><option v-for="cat in categories.slice(1)" :key="cat">{{ cat }}</option></select><Icon name="ChevronDown" :size="15" /></div><label class="field-label" for="draft-tags">给知文加点标签</label><input id="draft-tags" v-model="s.draft.tagText" class="form-input" placeholder="例如：生活方式，自然" maxlength="160" /><p class="field-hint">多个标签用逗号分隔</p></section><section class="editor-settings-card summary-card"><div class="section-heading"><h2>一句话，点亮好奇</h2><Icon name="Sparkles" :size="17" /></div><p>简短的摘要，让更多人发现你的想法。</p><textarea v-model="s.draft.description" class="form-input" placeholder="这篇知文，想和大家聊些什么？" aria-label="知文摘要" rows="4" maxlength="180"></textarea><button class="summary-button" :disabled="s.busy || !s.draft.content.trim()" @click="s.generateSummary()"><Icon name="Sparkles" :size="14" />{{ s.isDemo ? '试试摘要示例' : '让 AI 帮忙提炼' }}<Icon name="ArrowUpRight" :size="14" /></button></section><div class="writing-tip"><span>✧</span><p>好的分享，不一定是完整的答案。<br />一次真诚的观察，就已足够。</p><small v-if="s.isDemo">当前发布仅保存在本机演示空间。</small></div></aside></div></template>

        <div v-else class="empty-state"><Icon name="Compass" :size="34" /><h1>换个方向，继续探索。</h1><p>这个页面暂时不存在。</p><a href="#/discover" class="button button-primary">返回发现</a></div>
      </main>
    </div>

    <Transition name="toast"><div v-if="s.toast" class="toast-message" role="status"><span><Icon name="Check" :size="15" /></span>{{ s.toast }}</div></Transition>

    <AppDialog v-if="s.dialog" :key="s.dialog" :title="dialogTitle" @close="s.closeDialog()">
      <template #eyebrow><div class="dialog-brand"><span>✳</span> ZHIHUI</div></template>
      <template v-if="['login', 'register'].includes(s.dialog)">
        <p class="dialog-description">选择体验方式，再开启你的知识探索。</p>
        <div class="auth-mode-tabs" aria-label="登录方式">
          <button :class="{ active: s.isDemo }" :aria-pressed="s.isDemo" @click="chooseAuthMode('demo')">演示体验</button>
          <button :class="{ active: !s.isDemo }" :aria-pressed="!s.isDemo" @click="chooseAuthMode('live')">真实账号</button>
        </div>
        <div v-if="s.isDemo" class="demo-login-card">
          <Avatar :src="s.localProfile.avatar" :name="s.localProfile.nickname" size="lg" />
          <h3>{{ s.localProfile.nickname }}</h3>
          <span class="demo-account-badge">本机演示账号</span>
          <p>用于体验点赞、收藏、关注和写作。<br />数据只保存在本机，不代表真实账号登录。</p>
          <button class="button button-primary auth-submit" @click="s.loginDemo()">使用演示账号<Icon name="ArrowRight" :size="17" /></button>
        </div>
        <template v-else>
          <p class="real-auth-note">真实账号由后端验证，需要后端服务已启动。</p>
          <div v-if="s.dialog === 'login'" class="auth-tabs"><button :class="{ active: s.authTab === 'password' }" @click="s.authTab = 'password'">密码登录</button><button :class="{ active: s.authTab === 'code' }" @click="s.authTab = 'code'">验证码登录</button></div>
          <form class="auth-form" @submit.prevent="s.submitAuth()">
            <label class="field-label" for="auth-account">手机号或邮箱</label>
            <input id="auth-account" v-model="s.auth.identifier" class="form-input" placeholder="输入手机号或邮箱" autocomplete="username" required maxlength="128" />
            <template v-if="s.dialog === 'register' || s.authTab === 'code'">
              <label class="field-label" for="auth-code">验证码</label><div class="code-input"><input id="auth-code" v-model="s.auth.code" class="form-input" placeholder="输入验证码" autocomplete="one-time-code" inputmode="numeric" required maxlength="10" /><button type="button" :disabled="s.busy || s.codeSeconds > 0" @click="s.sendCode()">{{ s.codeSeconds > 0 ? `${s.codeSeconds}s 后重试` : '获取验证码' }}</button></div>
            </template>
            <template v-if="s.dialog === 'register' || s.authTab === 'password'">
              <label class="field-label" for="auth-password">密码{{ s.dialog === 'register' ? '（建议至少 8 位，包含字母与数字）' : '' }}</label><input id="auth-password" v-model="s.auth.password" class="form-input" type="password" placeholder="输入密码" :autocomplete="s.dialog === 'register' ? 'new-password' : 'current-password'" :required="s.dialog === 'login'" maxlength="128" />
            </template>
            <label v-if="s.dialog === 'register'" class="terms-check"><input v-model="s.auth.agreeTerms" type="checkbox" />我同意认真分享、尊重原创，并与他人友善交流。</label>
            <p v-if="s.formError" class="form-error" role="alert">{{ s.formError }}</p>
            <button class="button button-primary auth-submit" type="submit" :disabled="s.busy"><Icon v-if="s.busy" name="LoaderCircle" class="spin" :size="17" />{{ s.busy ? '请稍候…' : s.dialog === 'login' ? '登录，继续探索' : '加入知汇' }}<Icon v-if="!s.busy" name="ArrowRight" :size="17" /></button>
          </form>
          <p class="auth-switch">{{ s.dialog === 'login' ? '第一次来到知汇？' : '已经是知汇的一员？' }}<button @click="s.openDialog(s.dialog === 'login' ? 'register' : 'login')">{{ s.dialog === 'login' ? '创建账号' : '去登录' }}</button></p>
        </template>
        <button class="demo-enter" @click="s.browseAsGuest()">先以游客浏览公开内容<Icon name="ArrowUpRight" :size="14" /></button>
      </template>
      <template v-else-if="s.dialog === 'settings'"><p class="dialog-description">先看看美好的想法，再选择如何相遇。</p><button class="mode-option" :class="{ selected: s.isDemo }" @click="s.setMode('demo')"><span class="mode-icon"><Icon name="Sun" :size="24" /></span><span><strong>本地演示空间</strong><small>体验完整页面与交互，无需启动后端。<br />演示内容与操作保存在当前浏览器。</small></span><Icon :name="s.isDemo ? 'Check' : 'ArrowRight'" :size="18" /></button><button class="mode-option" :class="{ selected: !s.isDemo }" @click="s.setMode('live')"><span class="mode-icon"><Icon name="Globe" :size="24" /></span><span><strong>连接真实后端</strong><small>浏览真实知文，登录账号并发布内容。<br />需要项目后端及相关服务已启动。</small></span><Icon :name="!s.isDemo ? 'Check' : 'ArrowRight'" :size="18" /></button><p class="settings-footnote">两种空间的数据分别保存，切换后可随时回来。</p></template>
      <template v-else-if="s.dialog === 'profile'"><p class="dialog-description">独特的你，会遇见同样有趣的人。</p><form class="auth-form" @submit.prevent="s.saveProfile()"><label class="field-label" for="profile-name">你的昵称</label><input id="profile-name" v-model="s.profileForm.nickname" class="form-input" required maxlength="64" /><label class="field-label" for="profile-bio">关于自己</label><textarea id="profile-bio" v-model="s.profileForm.bio" class="form-input" rows="3" maxlength="512" placeholder="用一两句话，介绍此刻的自己"></textarea><label class="field-label" for="profile-school">学校 / 学习的地方</label><input id="profile-school" v-model="s.profileForm.school" class="form-input" maxlength="128" placeholder="选填" /><p v-if="s.formError" class="form-error" role="alert">{{ s.formError }}</p><button class="button button-primary auth-submit" :disabled="s.busy">{{ s.busy ? '正在保存…' : '保存新的自己' }}<Icon name="Check" :size="17" /></button></form></template>
      <template v-else-if="s.dialog === 'guidelines'"><p class="dialog-description">知汇相信，知识因真诚的分享而更明亮。</p><div class="guidelines"><h3>尊重原创，注明来处</h3><p>分享自己的观察与思考。引用他人的内容时，清楚标注作者和来源。</p><h3>保持好奇，也保持尊重</h3><p>欢迎不同的观点，用事实和善意展开讨论，尊重彼此的经历与感受。</p><h3>认真表达，让知识流动</h3><p>不必追求完美。一个有依据的解释、一段真实的经验，都值得被看见。</p></div><button class="button button-primary auth-submit" @click="s.dialog = ''">带着好奇，继续探索<Icon name="ArrowRight" :size="17" /></button></template>
    </AppDialog>
  </div>
</template>
