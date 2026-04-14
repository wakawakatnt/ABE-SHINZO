/* ===================================================
 *  安倍晋三画像集 — メインアプリ
 * =================================================== */

(function () {
  "use strict";

  // ── お気に入り (localStorage) ──
  const FAV_KEY = "abe_favs";
  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || {}; }
    catch { return {}; }
  }
  function saveFavs(favs) {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  }
  function isFav(id) { return !!getFavs()[id]; }
  function toggleFav(id) {
    const f = getFavs();
    if (f[id]) delete f[id]; else f[id] = true;
    saveFavs(f);
    return !!f[id];
  }

  // ── トースト ──
  const toastEl = document.getElementById("toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  // ── クリップボードコピー ──
  function copyText(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast("✓ " + label + " をコピーしました"));
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast("✓ " + label + " をコピーしました");
    }
  }

  // ── X の埋め込みiframe URL生成 ──
  // https://x.com/user/status/123 → https://platform.twitter.com/embed/Tweet.html?id=123
  function xEmbedUrl(xUrl) {
    if (!xUrl) return null;
    const m = xUrl.match(/status\/(\d+)/);
    if (!m) return null;
    return "https://platform.twitter.com/embed/Tweet.html?id=" + m[1] + "&lang=ja";
  }

  // ── 要素取得 ──
  const grid        = document.getElementById("grid");
  const searchInput = document.getElementById("search");
  const countEl     = document.getElementById("count");
  const favFilterBtn= document.getElementById("fav-filter");
  const favLabel    = document.getElementById("fav-filter-label");
  const listView    = document.getElementById("list-view");
  const detailView  = document.getElementById("detail-view");
  const backBtn     = document.getElementById("back-btn");
  const detailImg   = document.getElementById("detail-img");
  const detailTitle = document.getElementById("detail-title");
  const detailTags  = document.getElementById("detail-tags");
  const detailFav   = document.getElementById("detail-fav");
  const copyImgur   = document.getElementById("copy-imgur");
  const copyX       = document.getElementById("copy-x");
  const imgurEmbed  = document.getElementById("imgur-embed");
  const xEmbed      = document.getElementById("x-embed");

  let showFavOnly = false;
  let currentItem = null;
  let scrollPos = 0;

  // ── IDから画像データを取得 ──
  function findById(id) {
    return images.find((item) => String(item.id) === String(id));
  }

  // ── カード生成 ──
  function createCard(item) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = item.id;

    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${item.imgur}" alt="${item.title}" class="loading" loading="lazy">
      </div>
      <div class="card-bottom">
        <div class="card-title">${item.title}</div>
        <div class="card-icons">
          <button class="card-icon-btn btn-ci" title="Imgurリンクをコピー">🏞️</button>
          <button class="card-icon-btn btn-cx" title="Xリンクをコピー">𝕏</button>
          <button class="card-icon-btn btn-cf ${isFav(item.id) ? 'fav-active' : ''}" title="お気に入り">${isFav(item.id) ? '★' : '☆'}</button>
        </div>
      </div>
    `;

    const img = card.querySelector("img");
    img.onload = () => {
      img.classList.remove("loading");
      card.querySelector(".card-img-wrap").classList.add("loaded");
    };
    img.onerror = () => {
      img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23eee' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23bbb' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
      card.querySelector(".card-img-wrap").classList.add("loaded");
    };

    // 画像クリック → 詳細
    card.querySelector(".card-img-wrap").addEventListener("click", () => {
      location.hash = "detail/" + item.id;
    });

    // 🏞️ コピー
    card.querySelector(".btn-ci").addEventListener("click", (e) => {
      e.stopPropagation();
      copyText(item.imgur, "Imgurリンク");
    });

    // 𝕏 コピー
    card.querySelector(".btn-cx").addEventListener("click", (e) => {
      e.stopPropagation();
      copyText(item.xUrl, "Xリンク");
    });

    // ⭐ お気に入り
    card.querySelector(".btn-cf").addEventListener("click", (e) => {
      e.stopPropagation();
      const on = toggleFav(item.id);
      const btn = e.currentTarget;
      btn.textContent = on ? "★" : "☆";
      btn.classList.toggle("fav-active", on);
      toast(on ? "⭐ お気に入りに追加" : "☆ お気に入りを解除");
      if (showFavOnly) render();
    });

    return card;
  }

  // ── 描画 ──
  function render() {
    const query = searchInput.value.trim().toLowerCase();
    const favs = getFavs();

    const filtered = images.filter((item) => {
      if (showFavOnly && !favs[item.id]) return false;
      if (!query) return true;
      const haystack = (item.title + " " + (item.tags || []).join(" ")).toLowerCase();
      return haystack.includes(query);
    });

    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();
    filtered.forEach((item) => fragment.appendChild(createCard(item)));
    grid.appendChild(fragment);

    countEl.textContent = `${filtered.length} / ${images.length} 枚`;
  }

  // ── 詳細画面を開く ──
  function openDetail(item) {
    currentItem = item;
    scrollPos = window.scrollY;

    detailImg.src = item.imgur;
    detailTitle.textContent = item.title;

    // タグ
    detailTags.innerHTML = "";
    (item.tags || []).forEach((t) => {
      const sp = document.createElement("span");
      sp.className = "tag";
      sp.textContent = "#" + t;
      detailTags.appendChild(sp);
    });

    // ⭐
    detailFav.textContent = isFav(item.id) ? "★" : "☆";

    // Imgur: 画像そのものを表示
    imgurEmbed.innerHTML = `<img src="${item.imgur}" style="width:100%;border-radius:12px;">`;

    // X: iframe で埋め込み
    const embedSrc = xEmbedUrl(item.xUrl);
    if (embedSrc) {
      xEmbed.innerHTML = `<iframe src="${embedSrc}" style="width:100%;min-height:350px;border:none;border-radius:12px;" allowfullscreen></iframe>`;
    } else {
      xEmbed.innerHTML = `<p style="padding:16px;color:#999;">Xリンクなし</p>`;
    }

    listView.style.display = "none";
    detailView.classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  // ── 詳細画面を閉じる ──
  function closeDetail() {
    detailView.classList.add("hidden");
    listView.style.display = "";
    imgurEmbed.innerHTML = "";
    xEmbed.innerHTML = "";
    currentItem = null;
    window.scrollTo(0, scrollPos);
    render();
  }

  // ── ハッシュルーティング ──
  function handleRoute() {
    const hash = location.hash;
    const match = hash.match(/^#detail\/(\d+)$/);

    if (match) {
      const item = findById(match[1]);
      if (item) {
        openDetail(item);
      } else {
        location.hash = "";
      }
    } else {
      // 一覧表示
      if (!detailView.classList.contains("hidden")) {
        closeDetail();
      }
    }
  }

  // ── イベント ──
  searchInput.addEventListener("input", render);

  favFilterBtn.addEventListener("click", () => {
    showFavOnly = !showFavOnly;
    favFilterBtn.classList.toggle("active", showFavOnly);
    favLabel.textContent = showFavOnly ? "⭐のみ" : "すべて";
    render();
  });

  backBtn.addEventListener("click", () => {
    location.hash = "";
  });

  detailFav.addEventListener("click", () => {
    if (!currentItem) return;
    const on = toggleFav(currentItem.id);
    detailFav.textContent = on ? "★" : "☆";
    toast(on ? "⭐ お気に入りに追加" : "☆ お気に入りを解除");
  });

  copyImgur.addEventListener("click", () => {
    if (currentItem) copyText(currentItem.imgur, "Imgurリンク");
  });

  copyX.addEventListener("click", () => {
    if (currentItem) copyText(currentItem.xUrl, "Xリンク");
  });

  // ハッシュ変化を監視
  window.addEventListener("hashchange", handleRoute);

  // ── 初期化 ──
  render();
  handleRoute(); // URLに #detail/X があれば直接開く

  // ── Service Worker 登録 ──
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

})();
