import { additionalPosts } from './demo-posts.js'

export const topics = [
  { name: '科技与未来', short: '科技', english: 'TECH & TOMORROW', color: 'sage', count: '探索技术的下一种可能', icon: 'Orbit' },
  { name: '设计与美学', short: '设计', english: 'DESIGN & AESTHETICS', color: 'sand', count: '在日常中，发现美的秩序', icon: 'Shapes' },
  { name: '自然与生活', short: '生活', english: 'NATURE & LIVING', color: 'green', count: '向外看，也向内生长', icon: 'Leaf' },
  { name: '阅读与成长', short: '成长', english: 'READ & REFLECT', color: 'rose', count: '让每一次阅读，都有回响', icon: 'BookOpen' },
]

export const authors = [
  { id: '101', nickname: '山野来信', bio: '在山川与日常之间，寻找答案', avatar: '/avatars/101.jpg', color: 'olive' },
  { id: '102', nickname: '林间设计所', bio: '设计，是一种看待世界的方式', avatar: '/avatars/102.jpg', color: 'clay' },
  { id: '103', nickname: '陈一白', bio: '写代码，也写一些不一样的想法', avatar: '/avatars/103.jpg', color: 'blue' },
  { id: '104', nickname: '慢读时光', bio: '读书、记录，和缓慢的生活', avatar: '/avatars/104.jpg', color: 'rose' },
  { id: '105', nickname: '许知行', bio: '把后端原理，讲成听得懂的故事', avatar: '/avatars/105.jpg', color: 'blue' },
  { id: '106', nickname: '像素与秩序', bio: '关注产品细节，也关注真实的人', avatar: '/avatars/106.jpg', color: 'clay' },
  { id: '107', nickname: '周末散步计划', bio: '在熟悉的城市，发现新的风景', avatar: '/avatars/107.jpg', color: 'olive' },
  { id: '108', nickname: '一页手记', bio: '用简单的记录，整理复杂的生活', avatar: '/avatars/108.jpg', color: 'rose' },
  { id: '109', nickname: '数据观察员', bio: '从数据中提问，在证据中思考', avatar: '/avatars/109.jpg', color: 'blue' },
  { id: '110', nickname: '不止一杯咖啡', bio: '认真生活，也允许自己慢一点', avatar: '/avatars/110.jpg', color: 'clay' },
]

export const demoProfile = {
  id: '100', nickname: '好奇的旅人', bio: '保持好奇，慢慢生长。记录沿途的风景与灵感。',
  zgId: 'curious_soul', school: '', avatar: '/avatars/100.jpg',
}

export const seedPosts = [
  {
    id: 'demo-1', title: '走进山野，找回生活的另一种刻度',
    description: '当我们走进自然，时间便有了不同的流速。一次没有目的地的徒步，让我重新理解了「在场」这件小事。',
    category: '自然与生活', tags: ['自然', '生活方式', '户外'], cover: '/images/forest.jpg',
    authorId: '101', authorNickname: '山野来信', authorColor: 'olive', likes: 328, saves: 86, minutes: 8, date: '2026-11-05',
    content: '# 把脚步交还给山野\n\n周末的清晨，我把手机调成静音，走进了城市边缘的一片树林。没有计划好的路线，也没有必须完成的公里数，只是跟着树影，慢慢往前走。\n\n最先注意到的是声音。踩在落叶上的沙沙声，水流经过石头的声音，还有远处偶尔传来的鸟鸣。那些平时被消息提示音盖住的细节，忽然变得清晰。\n\n> 自然从不催促，但一切都在发生。\n\n## 一种不同的时间\n\n在城市里，我们常常用任务来衡量一天：完成了多少工作，回复了多少消息，学会了多少新知识。但山野有自己的刻度——一片叶子的颜色，一束光移动的距离，一条溪流绕过石头的方式。\n\n停下来之后，我发现自己并没有错过什么。恰恰相反，那些在匆忙中被忽略的感受，开始一点点回来。\n\n## 从一场小小的出走开始\n\n不必去很远的地方，也不必准备昂贵的装备。附近的公园、河边的步道，甚至回家路上多绕过的一排树，都可以是起点。\n\n- 留出一小段没有目的的时间。\n- 试着观察一件平时不会留意的事。\n- 用几句话记录当时的感受。\n\n走进自然，不是暂时逃离生活，而是学习一种更安静、更具体的生活方式。下一次感到疲惫的时候，也许可以先出门走走。',
  },
  {
    id: 'demo-2', title: '留白的力量：好的设计，懂得适时退后',
    description: '从一座建筑到一张海报，那些让人感到舒适的设计，往往都为「没有」留下了位置。',
    category: '设计与美学', tags: ['设计', '建筑', '美学'], cover: '/images/architecture.jpg',
    authorId: '102', authorNickname: '林间设计所', authorColor: 'clay', likes: 216, saves: 102, minutes: 6, date: '2026-11-04',
    content: '# 在空白里，感受设计\n\n第一次走进那座美术馆时，最打动我的并不是展品，而是墙壁与墙壁之间，光缓慢落下的样子。\n\n设计里的留白，像对话中的停顿。它给信息留出呼吸的空间，也让观看的人拥有自己的解释。\n\n## 少一些，更清楚一些\n\n我们很容易把更多元素等同于更多价值。但真正重要的内容，往往需要周围的安静才能被看见。\n\n> 留白不是尚未完成，而是经过选择之后的完整。\n\n试着拿走一个多余的装饰，拉开一段文字的行距，或者给一张照片多留一点边缘。细微的改变，会让整体的节奏变得不同。\n\n## 把空间交给使用者\n\n好的设计不必时时宣告自己的存在。它可以安静地退后，让阅读、行走和生活自然发生。',
  },
  {
    id: 'demo-3', title: 'AI 时代，为什么我们更需要保持好奇？',
    description: '当答案越来越容易获得，提出一个好问题，或许正在成为更珍贵的能力。',
    category: '科技与未来', tags: ['人工智能', '思考', '科技'], cover: '', visual: 'orbit',
    authorId: '103', authorNickname: '陈一白', authorColor: 'blue', likes: 482, saves: 174, minutes: 10, date: '2026-11-03',
    content: '# 在答案之前，先学会提问\n\n工具让获取信息变得轻松，却没有替我们决定什么问题值得思考。面对一个快速生成的答案，我们仍然需要追问：证据在哪里？它适用于什么情境？有没有其他解释？\n\n## 好奇心是一种实践\n\n保持好奇，不只是对新工具感到兴奋。它也意味着愿意承认自己不知道，愿意检查熟悉的假设，并花时间理解不同的观点。\n\n## 给问题一点时间\n\n下次使用 AI 之前，试着先写下自己的理解，再把它当作讨论的起点。比较不同回答，查阅原始资料，把发现连接到真实的问题中。\n\n工具会不断变化，而认真观察、清楚表达、独立判断，始终值得练习。',
  },
  {
    id: 'demo-4', title: '读完一本书之后，如何让它真正留下来',
    description: '放下「读完」的执念，把阅读变成一场与自己的长期对话。分享我的轻量阅读笔记方法。',
    category: '阅读与成长', tags: ['阅读', '知识管理', '成长'], cover: '/images/reading.jpg',
    authorId: '104', authorNickname: '慢读时光', authorColor: 'rose', likes: 189, saves: 126, minutes: 5, date: '2026-11-02',
    content: '# 让阅读，在合上书之后继续\n\n以前的我喜欢统计读过多少本书。后来发现，数量并不能告诉我哪些想法真的进入了生活。\n\n现在，每读完一章，我只问自己三个问题：\n\n1. 这一章最想告诉我什么？\n2. 它与我原本的理解有什么不同？\n3. 我可以尝试哪一个小小的改变？\n\n## 用自己的话再说一遍\n\n摘抄可以保留漂亮的句子，用自己的语言解释才能帮助理解。不必追求完整，先留下一个能记住的连接。\n\n## 在需要的时候再次相遇\n\n把笔记放到与实际问题有关的地方。写作时翻开写作的笔记，遇到困惑时看看过去留下的问题。阅读的价值，常常在很久之后才开始显现。',
  },
  {
    id: 'demo-5', title: '把周末还给自己，从一次看海开始',
    description: '不安排满满的行程，只让海风把思绪吹得远一些。关于休息，我们也许可以有新的理解。',
    category: '自然与生活', tags: ['生活方式', '自然', '旅行'], cover: '/images/sea.jpg',
    authorId: '101', authorNickname: '山野来信', authorColor: 'olive', likes: 152, saves: 61, minutes: 4, date: '2026-11-01',
    content: '# 允许自己，暂时什么也不做\n\n到海边的那天下午，我没有打开相机。只是坐在沙滩上，看潮水来来回回。\n\n休息并不是为了更有效率地工作，它本身就是生活的一部分。我们可以不把每一段空闲都安排成一项任务。\n\n## 找到属于自己的节奏\n\n海浪没有重复的形状，却有始终如一的节奏。或许我们也可以慢慢学会，在变化里找到自己的稳定。',
  },
  {
    id: 'demo-6', title: '建立自己的知识花园，而不是信息仓库',
    description: '收藏的文章越来越多，真正用到的却很少。让知识相互连接，比不断囤积更重要。',
    category: '阅读与成长', tags: ['知识管理', '成长', '思考'], cover: '', visual: 'garden',
    authorId: '104', authorNickname: '慢读时光', authorColor: 'rose', likes: 267, saves: 143, minutes: 7, date: '2026-10-31',
    content: '# 知识需要生长的空间\n\n收藏夹像一间堆满物品的仓库，什么都有，却很难找到此刻需要的东西。后来，我开始用「花园」代替「仓库」想象自己的笔记。\n\n每一条笔记是一株植物。它不必长得一样，也不必立刻有用，但需要偶尔照看，建立连接。\n\n## 从一个正在思考的问题开始\n\n不必先建立完美的分类系统。写下此刻关心的问题，再围绕它整理信息。把相似的想法放在一起，把不同的观点连接起来。\n\n每周留一点时间回看旧笔记，补上一句话，或者删除一个已经不再需要的片段。让知识慢慢成为自己的理解。',
  },
  ...additionalPosts,
].map(post => {
  const author = authors.find(item => item.id === post.authorId) || demoProfile
  return { ...post, authorNickname: author.nickname, authorAvatar: author.avatar, authorColor: author.color || 'blue' }
})

export const heroPost = {
  ...seedPosts[0], id: 'demo-hero', title: '世界很大，\n好奇心不必设限。', cover: '/images/mountains.jpg',
  description: '从一片山野、一页书、一个好问题开始，\n在这里，发现生活的更多可能。',
  content: seedPosts[0].content,
}
