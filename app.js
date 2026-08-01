const CATEGORIES = ["すべて", "最新情報", "サンダルフォン", "フェディエル", "ランスロット", "カリオストロ", "その他キャラクター", "ジーン、武器", "CPU、放置", "ボス攻略"];
const ATTRIBUTES = ["すべて", "火力", "回避", "コンボ", "装備", "CPU", "放置", "検証", "動画"];

const state = { posts: [], category: "すべて", attribute: "すべて", query: "", sort: "newest" };
const elements = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  Object.assign(elements, {
    posts: document.querySelector("#posts"), empty: document.querySelector("#emptyState"), error: document.querySelector("#errorState"),
    categoryFilters: document.querySelector("#categoryFilters"), attributeFilters: document.querySelector("#attributeFilters"),
    search: document.querySelector("#searchInput"), sort: document.querySelector("#sortSelect"), count: document.querySelector("#resultCount"),
    total: document.querySelector("#totalCount"), verified: document.querySelector("#verifiedCount"), updated: document.querySelector("#updatedDate"),
    sampleNotice: document.querySelector("#sampleNotice"), theme: document.querySelector("#themeToggle")
  });

  setupTheme();
  renderFilterButtons(elements.categoryFilters, CATEGORIES, "category");
  renderFilterButtons(elements.attributeFilters, ATTRIBUTES, "attribute");
  bindControls();

  try {
    const response = await fetch("data/posts.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("posts.json must be an array");
    state.posts = deduplicate(data).filter(isValidPost);
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

function deduplicate(posts) {
  const seenIds = new Set();
  const seenUrls = new Set();
  return posts.filter((post) => {
    if (!post.id || !post.sourceUrl || seenIds.has(post.id) || seenUrls.has(post.sourceUrl)) return false;
    seenIds.add(post.id);
    seenUrls.add(post.sourceUrl);
    return true;
  });
}

function isValidPost(post) {
  const required = ["title", "summary", "category", "author", "postedAt", "registeredAt"];
  return required.every((key) => typeof post[key] === "string" && post[key].trim()) && Array.isArray(post.attributes);
}

function renderFilterButtons(container, values, type) {
  container.replaceChildren(...values.map((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = value;
    button.dataset.value = value;
    button.setAttribute("aria-pressed", value === "すべて" ? "true" : "false");
    button.addEventListener("click", () => {
      state[type] = value;
      [...container.children].forEach((chip) => chip.setAttribute("aria-pressed", String(chip === button)));
      render();
    });
    return button;
  }));
}

function bindControls() {
  elements.search.addEventListener("input", (event) => { state.query = event.target.value.trim().toLocaleLowerCase("ja"); render(); });
  elements.sort.addEventListener("change", (event) => { state.sort = event.target.value; render(); });
  document.querySelector("#resetFilters").addEventListener("click", () => {
    state.category = state.attribute = "すべて"; state.query = ""; state.sort = "newest";
    elements.search.value = ""; elements.sort.value = "newest";
    document.querySelectorAll(".chip").forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.value === "すべて")));
    render();
  });
}

function setupTheme() {
  const saved = localStorage.getItem("relink-theme");
  const initial = saved || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  applyTheme(initial);
  elements.theme.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("relink-theme", next); applyTheme(next);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  elements.theme.firstElementChild.textContent = isDark ? "☼" : "☾";
  elements.theme.setAttribute("aria-label", `${isDark ? "ライト" : "ダーク"}モードに切り替え`);
}

function getFilteredPosts() {
  return state.posts.filter((post) => {
    const categoryMatch = state.category === "すべて" || post.category === state.category;
    const attributeMatch = state.attribute === "すべて" || post.attributes.includes(state.attribute);
    const haystack = [post.title, post.summary, post.category, post.author, ...post.attributes].join(" ").toLocaleLowerCase("ja");
    return categoryMatch && attributeMatch && (!state.query || haystack.includes(state.query));
  }).sort((a, b) => state.sort === "useful" ? Number(b.usefulness) - Number(a.usefulness) : new Date(b.registeredAt) - new Date(a.registeredAt));
}

function render() {
  const posts = getFilteredPosts();
  elements.posts.replaceChildren(...posts.map(createCard));
  elements.posts.setAttribute("aria-busy", "false");
  elements.empty.hidden = posts.length !== 0;
  elements.error.hidden = true;
  elements.count.textContent = `${posts.length} / ${state.posts.length} 件`;
  elements.sampleNotice.hidden = !posts.some((post) => post.isSample);
}

function createCard(post) {
  const article = document.createElement("article");
  article.className = "post-card";
  const media = post.media === "video" ? "▻ 動画あり" : post.media === "image" ? "▧ 画像あり" : "メディアなし";
  const statusClass = post.status === "確認済み" ? "score" : "";
  article.innerHTML = `
    <div class="card-top"><span class="category">${escapeHtml(post.category)}</span><span class="media-badge">${media}</span></div>
    <h3>${escapeHtml(post.title)}</h3>
    <p class="summary">${escapeHtml(post.summary)}</p>
    <div class="tags">${post.attributes.map((tag) => `<span class="tag"># ${escapeHtml(tag)}</span>`).join("")}</div>
    <dl class="metrics">
      <div><dt>有用性</dt><dd class="score">${Number(post.usefulness)}/100</dd></div>
      <div><dt>信頼度</dt><dd>${escapeHtml(post.confidence)}</dd></div>
      <div><dt>確認状態</dt><dd class="${statusClass}">${escapeHtml(post.status)}</dd></div>
    </dl>
    <p class="card-meta"><span>投稿者<br><span>${escapeHtml(post.author)}</span></span><span>投稿日時<br><span>${formatDate(post.postedAt)}</span></span><span>登録日時<br><span>${formatDate(post.registeredAt)}</span></span><span>ID<br><span>${escapeHtml(post.id)}</span></span></p>
    ${post.isSample ? '<span class="source-link disabled">架空サンプル（リンクなし）<span>—</span></span>' : `<a class="source-link" href="${escapeAttribute(post.sourceUrl)}" target="_blank" rel="noopener noreferrer">元投稿を開く<span aria-hidden="true">↗</span></a>`}
  `;
  return article;
}

function updateStats() {
  elements.total.textContent = String(state.posts.length).padStart(2, "0");
  elements.verified.textContent = String(state.posts.filter((post) => post.status === "確認済み").length).padStart(2, "0");
  const latest = state.posts.reduce((date, post) => post.registeredAt > date ? post.registeredAt : date, "");
  elements.updated.textContent = latest ? formatDate(latest, false) : "—";
}

function formatDate(value, includeTime = true) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", ...(includeTime && { hour: "2-digit", minute: "2-digit" }) }).format(date);
}

function escapeHtml(value) { const node = document.createElement("div"); node.textContent = String(value ?? ""); return node.innerHTML; }
function escapeAttribute(value) { return escapeHtml(value).replaceAll('"', "&quot;"); }
