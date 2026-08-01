const CHARACTER_GROUPS = [
  {
    label: "主人公",
    values: [
      { value: "主人公（グラン／ジータ）", label: "主人公（グラン／ジータ）", aliases: ["主人公", "グラン", "ジータ"] }
    ]
  },
  {
    label: "グランサイファーの仲間",
    values: [
      { value: "カタリナ" },
      { value: "ラカム" },
      { value: "イオ" },
      { value: "オイゲン" },
      { value: "ロゼッタ" }
    ]
  },
  {
    label: "騎空団に加わる仲間",
    values: [
      { value: "ランスロット" },
      { value: "ヴェイン" },
      { value: "パーシヴァル" },
      { value: "ジークフリート" },
      { value: "シャルロッテ" },
      { value: "ヨダルラーハ" },
      { value: "ナルメア" },
      { value: "ゼタ" },
      { value: "バザラガ" },
      { value: "フェリ" },
      { value: "ガンダゴウザ" },
      { value: "カリオストロ" },
      { value: "イド" }
    ]
  },
  {
    label: "無料アップデート追加",
    values: [
      { value: "シエテ" },
      { value: "ソーン" },
      { value: "サンダルフォン" }
    ]
  },
  {
    label: "Endless Ragnarok追加",
    values: [
      { value: "ベアトリクス" },
      { value: "ユーステス" },
      { value: "ガランツァ" },
      { value: "マギラフリラ" },
      { value: "フラウ" },
      { value: "フェディエル" }
    ]
  }
];

const ATTRIBUTE_GROUPS = [
  {
    label: "攻撃・ダメージ",
    values: ["火力", "通常攻撃", "アビリティ", "奥義", "コンボ", "ダメージ上限", "クリティカル", "追撃", "スタン", "リンク", "ブレイク"]
  },
  {
    label: "防御・支援",
    values: ["回避", "ガード", "無敵", "生存", "回復", "支援", "強化", "弱体"]
  },
  {
    label: "装備・育成",
    values: ["装備", "武器", "ジーン", "加護", "召喚石", "マスタースキル", "アビリティ構成", "育成", "素材集め"]
  },
  {
    label: "プレイ方法",
    values: ["CPU", "放置", "フルアシスト", "ソロ", "マルチ", "周回", "初心者", "高難度"]
  },
  {
    label: "属性・敵・情報形式",
    values: ["火属性", "水属性", "土属性", "風属性", "光属性", "闇属性", "ボス攻略", "検証", "動画", "画像", "アップデート", "バグ・不具合"]
  }
];

const CATEGORY_OPTIONS = [
  "キャラクター攻略",
  "ジーン・武器",
  "召喚石",
  "マスタースキル",
  "CPU・放置",
  "ボス攻略",
  "素材・周回",
  "システム・検証",
  "最新情報"
];

const CATEGORY_ALIASES = {
  "ジーン・武器": ["ジーン・武器", "ジーン、武器", "ジーン", "武器"],
  "CPU・放置": ["CPU・放置", "CPU、放置", "CPU", "放置"],
  "素材・周回": ["素材・周回", "素材集め", "周回"],
  "システム・検証": ["システム・検証", "システム、検証", "検証"],
  "最新情報": ["最新情報", "アップデート"]
};

const ALL_CHARACTER_NAMES = new Set(
  CHARACTER_GROUPS.flatMap((group) => group.values.map((item) => item.value))
);

const CHARACTER_ALIAS_MAP = new Map();
CHARACTER_GROUPS.forEach((group) => {
  group.values.forEach((item) => {
    CHARACTER_ALIAS_MAP.set(item.value, item.value);
    (item.aliases || []).forEach((alias) => CHARACTER_ALIAS_MAP.set(alias, item.value));
  });
});

const state = {
  posts: [],
  character: "すべて",
  attribute: "すべて",
  category: "すべて",
  query: "",
  sort: "newest"
};

const elements = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  Object.assign(elements, {
    posts: document.querySelector("#posts"),
    empty: document.querySelector("#emptyState"),
    error: document.querySelector("#errorState"),
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
    route: document.querySelector("#selectedRouteText")
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

    state.posts = deduplicate(data)
      .map(normalizePost)
      .filter(isValidPost);

    appendDataOnlyAttributes();
    updateStats();
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

  CHARACTER_GROUPS.forEach((group) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    group.values.forEach((item) => {
      optgroup.append(createOption(item.value, item.label || item.value));
    });
    elements.character.append(optgroup);
  });
}

function populateAttributeSelect() {
  elements.attribute.replaceChildren(createOption("すべて", "すべての補助属性"));

  ATTRIBUTE_GROUPS.forEach((group) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    group.values.forEach((value) => optgroup.append(createOption(value, value)));
    elements.attribute.append(optgroup);
  });
}

function populateCategorySelect() {
  elements.category.replaceChildren(createOption("すべて", "すべての大分類"));
  CATEGORY_OPTIONS.forEach((value) => elements.category.append(createOption(value, value)));
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function appendDataOnlyAttributes() {
  const known = new Set([
    "すべて",
    ...ATTRIBUTE_GROUPS.flatMap((group) => group.values)
  ]);
  const extras = [...new Set(state.posts.flatMap((post) => post.attributes))]
    .filter((value) => value && !known.has(value))
    .sort((a, b) => a.localeCompare(b, "ja"));

  if (!extras.length) return;
  const optgroup = document.createElement("optgroup");
  optgroup.label = "登録データ内のその他";
  extras.forEach((value) => optgroup.append(createOption(value, value)));
  elements.attribute.append(optgroup);
}

function bindControls() {
  elements.character.addEventListener("change", (event) => {
    state.character = event.target.value;
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
    render();
  });

  document.querySelector("#resetFilters").addEventListener("click", resetFilters);
  document.querySelector("#emptyResetButton").addEventListener("click", resetFilters);
}

function resetFilters() {
  state.character = "すべて";
  state.attribute = "すべて";
  state.category = "すべて";
  state.query = "";
  state.sort = "newest";

  elements.character.value = "すべて";
  elements.attribute.value = "すべて";
  elements.category.value = "すべて";
  elements.search.value = "";
  elements.sort.value = "newest";
  render();
}

function deduplicate(posts) {
  const seenIds = new Set();
  const seenUrls = new Set();

  return posts.filter((post) => {
    const id = String(post?.id || "").trim();
    const url = String(post?.sourceUrl || "").trim();
    if (!id || !url || seenIds.has(id) || seenUrls.has(url)) return false;
    seenIds.add(id);
    seenUrls.add(url);
    return true;
  });
}

function normalizePost(post) {
  const rawCategory = String(post.category || "").trim();
  const rawCharacter = String(post.character || "").trim();
  const characterFromCategory = canonicalizeCharacter(rawCategory);
  const character = canonicalizeCharacter(rawCharacter) || characterFromCategory || "キャラクター共通";

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
    status: String(post.status || "未検証").trim(),
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
  return Boolean(
    post.id &&
    post.title &&
    post.summary &&
    post.sourceUrl &&
    Array.isArray(post.attributes)
  );
}

function getFilteredPosts() {
  const filtered = state.posts.filter((post) => {
    const characterMatch = state.character === "すべて" || post.character === state.character;
    const attributeMatch = state.attribute === "すべて" || post.attributes.includes(state.attribute);
    const categoryMatch = categoryMatches(post, state.category);
    const searchable = [
      post.title,
      post.summary,
      post.character,
      post.category,
      post.author,
      ...post.attributes
    ].join(" ").toLocaleLowerCase("ja");
    const queryMatch = !state.query || searchable.includes(state.query);

    return characterMatch && attributeMatch && categoryMatch && queryMatch;
  });

  return filtered.sort((a, b) => {
    switch (state.sort) {
      case "postedNewest":
        return safeDate(b.postedAt) - safeDate(a.postedAt);
      case "useful":
        return b.usefulness - a.usefulness;
      case "oldest":
        return safeDate(a.registeredAt) - safeDate(b.registeredAt);
      case "newest":
      default:
        return safeDate(b.registeredAt) - safeDate(a.registeredAt);
    }
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
  const posts = getFilteredPosts();
  elements.posts.replaceChildren(...posts.map(createCard));
  elements.posts.setAttribute("aria-busy", "false");
  elements.empty.hidden = posts.length !== 0;
  elements.error.hidden = true;
  elements.count.textContent = `${posts.length} / ${state.posts.length} 件`;
  elements.sampleNotice.hidden = !posts.some((post) => post.isSample);
  renderSelectedRoute();
}

function renderSelectedRoute() {
  const parts = [];
  if (state.character !== "すべて") parts.push(state.character);
  if (state.attribute !== "すべて") parts.push(state.attribute);
  if (state.category !== "すべて") parts.push(state.category);
  if (state.query) parts.push(`「${state.query}」`);
  elements.route.textContent = parts.length ? parts.join(" › ") : "すべての攻略情報";
}

function createCard(post) {
  const article = document.createElement("article");
  article.className = "post-card";

  const mediaLabel = post.media === "video"
    ? "動画あり"
    : post.media === "image"
      ? "画像あり"
      : "メディアなし";

  const statusTone = post.status === "確認済み"
    ? "verified"
    : post.status.includes("誤情報") || post.status.includes("要追加")
      ? "caution"
      : "unverified";

  article.innerHTML = `
    <div class="card-ribbon" aria-hidden="true"></div>
    <header class="card-header">
      <div>
        <span class="character-label">${escapeHtml(post.character)}</span>
        <span class="category-label">${escapeHtml(post.category)}</span>
      </div>
      <span class="media-label">${escapeHtml(mediaLabel)}</span>
    </header>

    <h3>${escapeHtml(post.title)}</h3>
    <p class="summary">${escapeHtml(post.summary)}</p>

    <div class="tag-list" aria-label="補助属性">
      ${post.attributes.length
        ? post.attributes.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")
        : "<span>属性未設定</span>"}
    </div>

    <dl class="record-metrics">
      <div><dt>有用性</dt><dd>${post.usefulness}<small>/100</small></dd></div>
      <div><dt>信頼度</dt><dd>${escapeHtml(post.confidence)}</dd></div>
      <div><dt>確認状態</dt><dd class="status-${statusTone}">${escapeHtml(post.status)}</dd></div>
    </dl>

    <details class="record-details">
      <summary>投稿情報を確認する</summary>
      <dl>
        <div><dt>投稿者</dt><dd>${escapeHtml(post.author)}</dd></div>
        <div><dt>投稿日時</dt><dd>${formatDate(post.postedAt)}</dd></div>
        <div><dt>登録日時</dt><dd>${formatDate(post.registeredAt)}</dd></div>
        <div><dt>管理ID</dt><dd>${escapeHtml(post.id)}</dd></div>
      </dl>
    </details>

    ${post.isSample
      ? '<span class="source-button source-button-disabled">架空サンプル（リンクなし）</span>'
      : `<a class="source-button" href="${escapeAttribute(post.sourceUrl)}" target="_blank" rel="noopener noreferrer"><span>元投稿を開く</span><span aria-hidden="true">↗</span></a>`}
  `;

  return article;
}

function updateStats() {
  elements.total.textContent = String(state.posts.length).padStart(2, "0");
  elements.verified.textContent = String(
    state.posts.filter((post) => post.status === "確認済み" || post.status === "複数情報で一致").length
  ).padStart(2, "0");

  const latest = state.posts.reduce((latestValue, post) => {
    return safeDate(post.registeredAt) > safeDate(latestValue) ? post.registeredAt : latestValue;
  }, "");
  elements.updated.textContent = latest ? formatDate(latest, false) : "—";
}

function setupTheme() {
  const saved = localStorage.getItem("relink-theme");
  const initial = saved === "night" ? "night" : "sky";
  applyTheme(initial);

  elements.theme.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "night" ? "sky" : "night";
    localStorage.setItem("relink-theme", next);
    applyTheme(next);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const night = theme === "night";
  elements.theme.querySelector("span:first-child").textContent = night ? "☀" : "☾";
  elements.theme.querySelector(".theme-label").textContent = night ? "蒼空" : "夜空";
  elements.theme.setAttribute("aria-label", `${night ? "蒼空" : "夜空"}テーマに切り替え`);
}

function safeDate(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatDate(value, includeTime = true) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeTime && { hour: "2-digit", minute: "2-digit" })
  }).format(date);
}

function escapeHtml(value) {
  const node = document.createElement("div");
  node.textContent = String(value ?? "");
  return node.innerHTML;
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
