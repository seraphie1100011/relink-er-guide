const CHARACTER_GROUPS = [
  {
    label: "主人公",
    values: [
      { value: "主人公（グラン／ジータ）", aliases: ["主人公", "グラン", "ジータ"] }
    ]
  },
  {
    label: "グランサイファーの仲間",
    values: ["カタリナ", "ラカム", "イオ", "オイゲン", "ロゼッタ"].map((value) => ({ value }))
  },
  {
    label: "騎空団に加わる仲間",
    values: [
      "ランスロット", "ヴェイン", "パーシヴァル", "ジークフリート", "シャルロッテ",
      "ヨダルラーハ", "ナルメア", "ゼタ", "バザラガ", "フェリ", "ガンダゴウザ",
      "カリオストロ", "イド"
    ].map((value) => ({ value }))
  },
  {
    label: "無料アップデート追加",
    values: ["シエテ", "ソーン", "サンダルフォン"].map((value) => ({ value }))
  },
  {
    label: "Endless Ragnarok追加",
    values: ["ベアトリクス", "ユーステス", "ガランツァ", "マギラフリラ", "フラウ", "フェディエル"]
      .map((value) => ({ value }))
  }
];

const DIRECTORY_CHARACTERS = CHARACTER_GROUPS
  .flatMap((group) => group.values.map((item) => ({ ...item, group: group.label })))
  .filter((item) => item.value !== "主人公（グラン／ジータ）");

const ATTRIBUTE_GROUPS = [
  { label: "攻撃", values: ["火力", "通常攻撃", "アビリティ", "奥義", "コンボ", "ダメージ上限", "クリティカル", "追撃", "スタン", "リンク", "ブレイク"] },
  { label: "防御・支援", values: ["回避", "ガード", "無敵", "生存", "回復", "支援", "強化", "弱体"] },
  { label: "装備・育成", values: ["装備", "武器", "ジーン", "加護", "召喚石", "マスタースキル", "アビリティ構成", "育成", "素材集め"] },
  { label: "プレイ方法", values: ["CPU", "放置", "フルアシスト", "ソロ", "マルチ", "周回", "初心者", "高難度"] },
  { label: "その他", values: ["火属性", "水属性", "土属性", "風属性", "光属性", "闇属性", "ボス攻略", "検証", "動画", "画像", "アップデート", "バグ・不具合"] }
];

const CATEGORY_OPTIONS = [
  "キャラクター攻略", "ジーン・武器", "召喚石", "マスタースキル", "CPU・放置",
  "ボス攻略", "素材・周回", "システム・検証", "最新情報"
];

const CATEGORY_ALIASES = {
  "ジーン・武器": ["ジーン・武器", "ジーン、武器", "ジーン", "武器"],
  "CPU・放置": ["CPU・放置", "CPU、放置", "CPU", "放置"],
  "素材・周回": ["素材・周回", "素材集め", "周回"],
  "システム・検証": ["システム・検証", "システム、検証", "検証"],
  "最新情報": ["最新情報", "アップデート"]
};

const PERIODS = {
  all: { label: "全期間", duration: Infinity },
  day: { label: "過去1日", duration: 24 * 60 * 60 * 1000 },
  week: { label: "過去1週間", duration: 7 * 24 * 60 * 60 * 1000 },
  month: { label: "過去1ヶ月", duration: 30 * 24 * 60 * 60 * 1000 }
};

const HIGH_DIFFICULTY_TERMS = [
  "高難度", "ボス攻略", "CHAOS", "インフィニティ", "極沌空所", "ルシファー",
  "ベルゼバブ", "ザ・ワールド", "ワールドの胎動", "天元", "終末のヴィジョン"
];

const TOPIC_DEFINITIONS = [
  {
    id: "highDifficulty",
    title: "高難易度攻略",
    subtitle: "CHAOS・インフィニティ・ボス攻略",
    matches: (post) => post.category === "ボス攻略" || containsAny(post, HIGH_DIFFICULTY_TERMS)
  },
  {
    id: "gene",
    title: "ジーン情報",
    subtitle: "構成・上限・スキル検証",
    matches: (post) => post.category === "ジーン・武器" || post.attributes.includes("ジーン")
  },
  {
    id: "latest",
    title: "最新情報",
    subtitle: "公式案内・更新内容・新要素",
    matches: (post) => post.category === "最新情報" || post.attributes.includes("アップデート")
  }
];

const ALL_CHARACTER_NAMES = new Set(
  CHARACTER_GROUPS.flatMap((group) => group.values.map((item) => item.value))
);

const CHARACTER_ALIAS_MAP = new Map();
for (const group of CHARACTER_GROUPS) {
  for (const item of group.values) {
    CHARACTER_ALIAS_MAP.set(item.value, item.value);
    for (const alias of item.aliases || []) CHARACTER_ALIAS_MAP.set(alias, item.value);
  }
}

const state = {
  posts: [],
  period: "all",
  character: "すべて",
  topic: "すべて",
  attribute: "すべて",
  category: "すべて",
  query: "",
  sort: "newest",
  expandedCharacters: new Set()
};

const elements = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  Object.assign(elements, {
    posts: document.querySelector("#posts"),
    empty: document.querySelector("#emptyState"),
    error: document.querySelector("#errorState"),
    characterGrid: document.querySelector("#characterGrid"),
    topicGrid: document.querySelector("#topicGrid"),
    character: document.querySelector("#characterSelect"),
    attribute: document.querySelector("#attributeSelect"),
    category: document.querySelector("#categorySelect"),
    search: document.querySelector("#searchInput"),
    sort: document.querySelector("#sortSelect"),
    count: document.querySelector("#resultCount"),
    total: document.querySelector("#totalCount"),
    verified: document.querySelector("#verifiedCount"),
    updated: document.querySelector("#updatedDate"),
    sampleNotice: document.querySelector("#sampleNotice"),
    theme: document.querySelector("#themeToggle"),
    route: document.querySelector("#selectedRouteText"),
    periodDescription: document.querySelector("#periodDescription")
  });

  populateCharacterSelect();
  populateAttributeSelect();
  populateCategorySelect();
  setupTheme();
  bindControls();

  try {
    const response = await fetch("data/posts.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("posts.json must be an array");

    state.posts = deduplicate(data).map(normalizePost).filter(isValidPost);
    appendDataOnlyAttributes();
    updateStats();
    updatePeriodCounts();
    render();
  } catch (error) {
    console.error("攻略情報の読み込みに失敗しました:", error);
    elements.posts.setAttribute("aria-busy", "false");
    elements.error.hidden = false;
    elements.total.textContent = "0";
    elements.verified.textContent = "0";
    elements.updated.textContent = "—";
  }
}

function populateCharacterSelect() {
  elements.character.replaceChildren(createOption("すべて", "すべてのキャラクター"));
  for (const group of CHARACTER_GROUPS) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    for (const item of group.values) optgroup.append(createOption(item.value, item.value));
    elements.character.append(optgroup);
  }
}

function populateAttributeSelect() {
  elements.attribute.replaceChildren(createOption("すべて", "すべての補助属性"));
  for (const group of ATTRIBUTE_GROUPS) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    for (const value of group.values) optgroup.append(createOption(value, value));
    elements.attribute.append(optgroup);
  }
}

function populateCategorySelect() {
  elements.category.replaceChildren(createOption("すべて", "すべての大分類"));
  for (const value of CATEGORY_OPTIONS) elements.category.append(createOption(value, value));
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function appendDataOnlyAttributes() {
  const known = new Set(["すべて", ...ATTRIBUTE_GROUPS.flatMap((group) => group.values)]);
  const extras = [...new Set(state.posts.flatMap((post) => post.attributes))]
    .filter((value) => value && !known.has(value))
    .sort((a, b) => a.localeCompare(b, "ja"));
  if (!extras.length) return;

  const optgroup = document.createElement("optgroup");
  optgroup.label = "その他の登録属性";
  for (const value of extras) optgroup.append(createOption(value, value));
  elements.attribute.append(optgroup);
}

function bindControls() {
  document.querySelector("#periodTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-period]");
    if (!button || !PERIODS[button.dataset.period]) return;
    state.period = button.dataset.period;
    updatePeriodButtons();
    render();
  });

  elements.character.addEventListener("change", (event) => {
    state.character = event.target.value;
    state.topic = "すべて";
    render();
  });
  elements.attribute.addEventListener("change", (event) => {
    state.attribute = event.target.value;
    render();
  });
  elements.category.addEventListener("change", (event) => {
    state.category = event.target.value;
    render();
  });
  elements.search.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLocaleLowerCase("ja");
    render();
  });
  elements.sort.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderResults();
  });

  document.querySelector("#resetFilters").addEventListener("click", resetFilters);
  document.querySelector("#emptyResetButton").addEventListener("click", resetFilters);
}

function resetFilters() {
  Object.assign(state, {
    period: "all",
    character: "すべて",
    topic: "すべて",
    attribute: "すべて",
    category: "すべて",
    query: "",
    sort: "newest"
  });

  elements.character.value = "すべて";
  elements.attribute.value = "すべて";
  elements.category.value = "すべて";
  elements.search.value = "";
  elements.sort.value = "newest";
  updatePeriodButtons();
  render();
}

function selectCharacter(character) {
  state.character = character;
  state.topic = "すべて";
  elements.character.value = character;
  render();
  document.querySelector("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectTopic(topicId) {
  state.topic = topicId;
  state.character = "すべて";
  elements.character.value = "すべて";
  render();
  document.querySelector("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function deduplicate(posts) {
  const ids = new Set();
  const urls = new Set();

  return posts.filter((post) => {
    const id = String(post?.id || "").trim();
    const url = String(post?.sourceUrl || "").trim();
    if (!id || !url || ids.has(id) || urls.has(url)) return false;
    ids.add(id);
    urls.add(url);
    return true;
  });
}

function normalizePost(post) {
  const rawCategory = String(post.category || "").trim();
  const rawCharacter = String(post.character || "").trim();
  const character = canonicalizeCharacter(rawCharacter)
    || canonicalizeCharacter(rawCategory)
    || "キャラクター共通";

  return {
    ...post,
    id: String(post.id || "").trim(),
    title: String(post.title || "").trim(),
    summary: String(post.summary || "").trim(),
    character,
    category: normalizeCategory(rawCategory, character),
    attributes: Array.isArray(post.attributes)
      ? [...new Set(post.attributes.map((value) => String(value).trim()).filter(Boolean))]
      : [],
    author: String(post.author || "不明").trim(),
    postedAt: String(post.postedAt || "").trim(),
    registeredAt: String(post.registeredAt || "").trim(),
    usefulness: clampScore(post.usefulness),
    confidence: String(post.confidence || "未設定").trim(),
    status: String(post.status || "未確認").trim(),
    media: ["video", "image", "none"].includes(post.media) ? post.media : "none",
    sourceUrl: String(post.sourceUrl || "").trim(),
    isSample: Boolean(post.isSample)
  };
}

function canonicalizeCharacter(value) {
  if (!value) return "";
  return CHARACTER_ALIAS_MAP.get(value) || (ALL_CHARACTER_NAMES.has(value) ? value : "");
}

function normalizeCategory(rawCategory, character) {
  if (!rawCategory || rawCategory === character || canonicalizeCharacter(rawCategory)) {
    return character === "キャラクター共通" ? "最新情報" : "キャラクター攻略";
  }

  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.includes(rawCategory)) return canonical;
  }
  return CATEGORY_OPTIONS.includes(rawCategory) ? rawCategory : rawCategory;
}

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function isValidPost(post) {
  return Boolean(post.id && post.title && post.summary && post.sourceUrl && Array.isArray(post.attributes));
}

function containsAny(post, terms) {
  const haystack = [post.title, post.summary, post.category, ...post.attributes]
    .join(" ")
    .toLocaleLowerCase("ja");
  return terms.some((term) => haystack.includes(term.toLocaleLowerCase("ja")));
}

function getReferenceTimestamp(post) {
  return safeDate(post.postedAt) || safeDate(post.registeredAt);
}

function periodMatches(post, periodKey = state.period) {
  if (periodKey === "all") return true;
  const timestamp = getReferenceTimestamp(post);
  if (!timestamp) return false;
  const elapsed = Date.now() - timestamp;
  return elapsed >= 0 && elapsed <= PERIODS[periodKey].duration;
}

function getPeriodPosts(periodKey = state.period) {
  return state.posts.filter((post) => periodMatches(post, periodKey));
}

function topicMatches(post, topicId) {
  if (topicId === "すべて") return true;
  return TOPIC_DEFINITIONS.find((topic) => topic.id === topicId)?.matches(post) || false;
}

function getFilteredPosts() {
  const filtered = state.posts.filter((post) => {
    const periodMatch = periodMatches(post);
    const characterMatch = state.character === "すべて" || post.character === state.character;
    const topicMatch = topicMatches(post, state.topic);
    const attributeMatch = state.attribute === "すべて" || post.attributes.includes(state.attribute);
    const categoryMatch = categoryMatches(post, state.category);
    const text = [
      post.title, post.summary, post.character, post.category, post.author, ...post.attributes
    ].join(" ").toLocaleLowerCase("ja");
    const queryMatch = !state.query || text.includes(state.query);
    return periodMatch && characterMatch && topicMatch && attributeMatch && categoryMatch && queryMatch;
  });

  return sortPosts(filtered, state.sort);
}

function sortPosts(posts, sort = "newest") {
  return [...posts].sort((a, b) => {
    if (sort === "postedNewest") return safeDate(b.postedAt) - safeDate(a.postedAt);
    if (sort === "useful") return b.usefulness - a.usefulness;
    if (sort === "oldest") return safeDate(a.registeredAt) - safeDate(b.registeredAt);
    return safeDate(b.registeredAt) - safeDate(a.registeredAt);
  });
}

function categoryMatches(post, selectedCategory) {
  if (selectedCategory === "すべて") return true;
  if (selectedCategory === "キャラクター攻略") return post.character !== "キャラクター共通";
  if (post.category === selectedCategory) return true;
  const aliases = CATEGORY_ALIASES[selectedCategory] || [];
  return aliases.includes(post.category) || post.attributes.some((attribute) => aliases.includes(attribute));
}

function render() {
  renderDirectories();
  renderResults();
  renderActiveFilters();
}

function renderDirectories() {
  const periodPosts = sortPosts(getPeriodPosts(), "newest");
  elements.characterGrid.replaceChildren(
    ...DIRECTORY_CHARACTERS.map((character) => createCharacterDirectoryCard(character, periodPosts))
  );
  elements.topicGrid.replaceChildren(
    ...TOPIC_DEFINITIONS.map((topic) => createTopicDirectoryCard(topic, periodPosts))
  );
}

function createCharacterDirectoryCard(character, periodPosts) {
  const posts = periodPosts.filter((post) => post.character === character.value);
  const expanded = state.expandedCharacters.has(character.value);
  const characterIndex = DIRECTORY_CHARACTERS.findIndex((item) => item.value === character.value);
  const panelId = `character-panel-${characterIndex}`;
  const article = document.createElement("article");
  article.className = `directory-card${expanded ? " is-expanded" : ""}${state.character === character.value ? " is-active" : ""}`;

  const header = document.createElement("button");
  header.type = "button";
  header.className = "directory-card-head";
  header.setAttribute("aria-expanded", String(expanded));
  header.setAttribute("aria-controls", panelId);
  header.addEventListener("click", () => {
    if (expanded) state.expandedCharacters.delete(character.value);
    else state.expandedCharacters.add(character.value);
    renderDirectories();
  });
  header.innerHTML = `
    <span><small>${escapeHtml(character.group)}</small><strong>${escapeHtml(character.value)}</strong></span>
    <span class="directory-card-count">
      <b>${posts.length}<small>件</small></b>
      <i aria-hidden="true">${expanded ? "−" : "＋"}</i>
    </span>
  `;

  article.append(header);

  if (expanded) {
    const panel = document.createElement("div");
    panel.id = panelId;
    panel.className = "directory-expanded";

    const actions = document.createElement("div");
    actions.className = "directory-expanded-actions";

    const detailsButton = document.createElement("button");
    detailsButton.type = "button";
    detailsButton.className = "directory-detail-button";
    detailsButton.textContent = "詳しく見る";
    detailsButton.disabled = posts.length === 0;
    detailsButton.addEventListener("click", () => selectCharacter(character.value));
    actions.append(detailsButton);

    panel.append(actions, createDirectoryTitleList(posts, Infinity));
    article.append(panel);
  }

  return article;
}

function createTopicDirectoryCard(topic, periodPosts) {
  const posts = periodPosts.filter(topic.matches);
  const article = document.createElement("article");
  article.className = `topic-card${state.topic === topic.id ? " is-active" : ""}`;

  const header = document.createElement("button");
  header.type = "button";
  header.className = "topic-card-head";
  header.addEventListener("click", () => selectTopic(topic.id));
  header.innerHTML = `
    <span><small>${escapeHtml(topic.subtitle)}</small><strong>${escapeHtml(topic.title)}</strong></span>
    <b>${posts.length}<small>件</small></b>
  `;

  article.append(header, createDirectoryTitleList(posts, 4));
  return article;
}

function createDirectoryTitleList(posts, limit = Infinity) {
  const wrap = document.createElement("div");
  wrap.className = "directory-titles";

  if (!posts.length) {
    wrap.innerHTML = '<p class="directory-empty">情報はまだありません</p>';
    return wrap;
  }

  const visiblePosts = Number.isFinite(limit) ? posts.slice(0, limit) : posts;
  const list = document.createElement("ul");
  for (const post of visiblePosts) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = post.sourceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = `${post.title} — Xの投稿を開く`;
    link.innerHTML = `<span>${escapeHtml(post.title)}</span><small aria-hidden="true">↗</small>`;
    item.append(link);
    list.append(item);
  }
  wrap.append(list);

  if (Number.isFinite(limit) && posts.length > limit) {
    const more = document.createElement("p");
    more.className = "directory-more";
    more.textContent = `ほか ${posts.length - limit}件`;
    wrap.append(more);
  }
  return wrap;
}

function renderResults() {
  const posts = getFilteredPosts();
  elements.posts.replaceChildren(...posts.map(createCard));
  elements.posts.setAttribute("aria-busy", "false");
  elements.empty.hidden = posts.length > 0;
  elements.error.hidden = true;
  elements.count.textContent = `${posts.length}件`;
  elements.sampleNotice.hidden = !posts.some((post) => post.isSample);
}

function renderActiveFilters() {
  const labels = [PERIODS[state.period].label];
  if (state.character !== "すべて") labels.push(state.character);
  if (state.topic !== "すべて") {
    labels.push(TOPIC_DEFINITIONS.find((topic) => topic.id === state.topic)?.title || state.topic);
  }
  if (state.attribute !== "すべて") labels.push(state.attribute);
  if (state.category !== "すべて") labels.push(state.category);
  if (state.query) labels.push(`「${state.query}」`);
  elements.route.textContent = labels.join(" / ");
}

function createCard(post) {
  const article = document.createElement("article");
  article.className = "post-card";

  const statusClass = post.status === "確認済み" ? "verified" : "unverified";
  const mediaLabel = post.media === "video" ? "動画" : post.media === "image" ? "画像" : "";
  const isSearchLink = post.sourceLinkType === "search" || /https:\/\/x\.com\/search\?/.test(post.sourceUrl);
  const sourceButtonLabel = isSearchLink ? "Xで該当投稿を探す" : "元投稿を開く";
  const visibleTags = post.attributes.slice(0, 4);
  const extraTagCount = Math.max(0, post.attributes.length - visibleTags.length);

  article.innerHTML = `
    <div class="card-meta-top">
      <div class="card-labels">
        <span class="character-label">${escapeHtml(post.character)}</span>
        <span class="category-label">${escapeHtml(post.category)}</span>
      </div>
      <span class="status-label ${statusClass}">${escapeHtml(post.status)}</span>
    </div>

    <h3>${escapeHtml(post.title)}</h3>
    <p class="summary">${escapeHtml(post.summary)}</p>

    <div class="tag-list">
      ${visibleTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      ${extraTagCount ? `<span>+${extraTagCount}</span>` : ""}
      ${mediaLabel ? `<span>${mediaLabel}あり</span>` : ""}
    </div>

    <div class="card-quick-meta">
      <span>有用性 <strong>${post.usefulness}</strong></span>
      <span>${formatDate(post.postedAt, false)}</span>
    </div>

    <details class="card-details">
      <summary>投稿情報を見る</summary>
      <dl>
        <div><dt>投稿者</dt><dd>${escapeHtml(post.author)}</dd></div>
        <div><dt>投稿日時</dt><dd>${formatDate(post.postedAt)}</dd></div>
        <div><dt>登録日時</dt><dd>${formatDate(post.registeredAt)}</dd></div>
        <div><dt>信頼度</dt><dd>${escapeHtml(post.confidence)}</dd></div>
        ${isSearchLink ? "<div><dt>リンク</dt><dd>X検索結果（元投稿URL要確認）</dd></div>" : ""}
      </dl>
    </details>

    ${post.isSample
      ? '<span class="source-button disabled">架空サンプル</span>'
      : `<a class="source-button" href="${escapeAttribute(post.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceButtonLabel)} <span aria-hidden="true">↗</span></a>`}
  `;

  return article;
}

function updateStats() {
  elements.total.textContent = state.posts.length;
  elements.verified.textContent = state.posts.filter((post) => post.status === "確認済み").length;

  const latest = state.posts.reduce((current, post) => {
    return safeDate(post.registeredAt) > safeDate(current) ? post.registeredAt : current;
  }, "");
  elements.updated.textContent = latest ? formatDate(latest, false) : "—";
}

function updatePeriodCounts() {
  const countIds = {
    all: "#periodCountAll",
    day: "#periodCountDay",
    week: "#periodCountWeek",
    month: "#periodCountMonth"
  };
  for (const [period, selector] of Object.entries(countIds)) {
    document.querySelector(selector).textContent = `${getPeriodPosts(period).length}件`;
  }
}

function updatePeriodButtons() {
  for (const button of document.querySelectorAll("[data-period]")) {
    const active = button.dataset.period === state.period;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  elements.periodDescription.textContent = `${PERIODS[state.period].label}の情報を表示中`;
}

function safeDate(value) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDate(value, includeTime = true) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日時不明";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {})
  }).format(date);
}

function setupTheme() {
  const saved = localStorage.getItem("relink-theme");
  const initial = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(initial);

  elements.theme.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("relink-theme", next);
    applyTheme(next);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  elements.theme.firstElementChild.textContent = dark ? "☀" : "☾";
  elements.theme.setAttribute("aria-label", `${dark ? "ライト" : "ダーク"}モードに切り替え`);
}

function escapeHtml(value) {
  const node = document.createElement("div");
  node.textContent = String(value ?? "");
  return node.innerHTML;
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
