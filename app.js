/* ===================================================
 *  安倍晋三画像集 — メインアプリ
 * =================================================== */

(function () {
  "use strict";

  /* ── お気に入り ── */
  const FAV_KEY = "abe_favs";
  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || {}; } catch { return {}; }
  }
  function saveFavs(f) { localStorage.setItem(FAV_KEY, JSON.stringify(f)); }
  function isFav(id) { return !!getFavs()[id]; }
  function toggleFav(id) {
    const f = getFavs();
    if (f[id]) delete f[id]; else f[id] = true;
    saveFavs(f);
    return !!f[id];
  }

  /* ── トースト ── */
  const toastEl = document.getElementById("toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  /* ── クリップボード ── */
  function copyText(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast("✓ " + label + " をコピーしました"));
    } else {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      toast("✓ " + label + " をコピーしました");
    }
  }

  /* ── X iframe URL ── */
  function xEmbedUrl(xUrl) {
    if (!xUrl) return null;
    const m = xUrl.match(/status\/(\d+)/);
    return m ? "https://platform.twitter.com/embed/Tweet.html?id=" + m[1] + "&lang=ja" : null;
  }

  /* ── 要素取得 ── */
  const grid         = document.getElementById("grid");
  const searchInput  = document.getElementById("search");
  const countEl      = document.getElementById("count");
  const favFilterBtn = document.getElementById("fav-filter");
  const favLabel     = document.getElementById("fav-filter-label");
  const listView     = document.getElementById("list-view");

  const folderModal      = document.getElementById("folder-modal");
  const folderModalTitle = document.getElementById("folder-modal-title");
  const folderModalClose = document.getElementById("folder-modal-close");
  const folderGrid       = document.getElementById("folder-grid");
  const folderBackdrop   = folderModal.querySelector(".modal-backdrop");

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
  const xOpen       = document.getElementById("x-open");

  let showFavOnly = false;
  let currentItem = null;
  let scrollPos = 0;

  /* ── ヘルパー ── */
  function findById(id) {
    return images.find(item => String(item.id) === String(id));
  }

  function getImagesInFolder(folderId) {
    return images.filter(item => item.folder === folderId);
  }

  function getLooseImages() {
    return images.filter(item => !item.folder);
  }

  /* ============================================
   *  フォルダサムネ（Canvas で最大4枚を合成）
   * ============================================ */
  function buildFolderThumb(canvas, folderImages) {
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#e8e8e8";
    ctx.fillRect(0, 0, size, size);

    const srcs = folderImages.slice(0, 4).map(item => item.imgur);
    const count = srcs.length;
    if (count === 0) return;

    const positions = {
      1: [{ x: 0, y: 0, w: size, h: size }],
      2: [
        { x: 0, y: 0, w: size / 2, h: size },
        { x: size / 2, y: 0, w: size / 2, h: size },
      ],
      3: [
        { x: 0, y: 0, w: size / 2, h: size / 2 },
        { x: size / 2, y: 0, w: size / 2, h: size / 2 },
        { x: 0, y: size / 2, w: size, h: size / 2 },
      ],
      4: [
        { x: 0, y: 0, w: size / 2, h: size / 2 },
        { x: size / 2, y: 0, w: size / 2, h: size / 2 },
        { x: 0, y: size / 2, w: size / 2, h: size / 2 },
        { x: size / 2, y: size / 2, w: size / 2, h: size / 2 },
      ],
    };

    const layout = positions[Math.min(count, 4)];

    srcs.forEach((src, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const pos = layout[i];
        // cover 描画
        const scale = Math.max(pos.w / img.width, pos.h / img.height);
        const sw = pos.w / scale;
        const sh = pos.h / scale;
        const sx = (img.width - sw) / 2;
        const sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, pos.x, pos.y, pos.w, pos.h);

        // 枠線
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.strokeRect(pos.x, pos.y, pos.w, pos.h);
      };
      img.src = src;
    });
  }

  /* ============================================
   *  カード生成（画像用）
   * ============================================ */
  function createCard(item) {
    const card = document.createElement("div");
    card.className = "card";

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

    card.querySelector(".card-img-wrap").addEventListener("click", () => {
      location.hash = "detail/" + item.id;
    });

    card.querySelector(".btn-ci").addEventListener("click", (e) => {
      e.stopPropagation();
      copyText(item.imgur, "Imgurリンク");
    });

    card.querySelector(".btn-cx").addEventListener("click", (e) => {
      e.stopPropagation();
      copyText(item.xUrl, "Xリンク");
    });

    card.querySelector(".btn-cf").addEventListener("click", (e) => {
      e.stopPropagation();
      const on = toggleFav(item.id);
      e.currentTarget.textContent = on ? "★" : "☆";
      e.currentTarget.classList.toggle("fav-active", on);
      toast(on ? "⭐ お気に入りに追加" : "☆ お気に入りを解除");
      if (showFavOnly) render();
    });

    return card;
  }

  /* ============================================
   *  フォルダカード生成
   * ============================================ */
  function createFolderCard(folder) {
    const folderImages = getImagesInFolder(folder.id);
    const card = document.createElement("div");
    card.className = "folder-card";

    card.innerHTML = `
      <div class="folder-thumb">
        <canvas></canvas>
      </div>
      <div class="folder-bottom">
        <div class="folder-name">📁 ${folder.name}</div>
        <div class="folder-count">${folderImages.length} 枚</div>
      </div>
    `;

    // サムネ合成
    const canvas = card.querySelector("canvas");
    buildFolderThumb(canvas, folderImages);

    card.addEventListener("click", () => {
      location.hash = "folder/" + folder.id;
    });

    return card;
  }

  /* ============================================
   *  メイン描画
   * ============================================ */
  function render() {
    const query = searchInput.value.trim().toLowerCase();
    const favs = getFavs();

    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();
    let totalCount = 0;

    // ── フォルダ表示 ──
    if (!showFavOnly) {
      folders.forEach(folder => {
        const folderImages = getImagesInFolder(folder.id);
        if (query) {
          // 検索時：フォルダ内にマッチする画像があるか
          const hasMatch = folderImages.some(item => {
            const h = (item.title + " " + (item.tags || []).join(" ") + " " + folder.name).toLowerCase();
            return h.includes(query);
          });
          if (!hasMatch) return;
        }
        if (folderImages.length > 0) {
          fragment.appendChild(createFolderCard(folder));
          totalCount += folderImages.length;
        }
      });
    }

    // ── 単体画像（フォルダに属さない） ──
    const loose = getLooseImages().filter(item => {
      if (showFavOnly && !favs[item.id]) return false;
      if (!query) return true;
      const h = (item.title + " " + (item.tags || []).join(" ")).toLowerCase();
      return h.includes(query);
    });

    // ⭐フィルター時：フォルダ内の画像も単体として出す
    if (showFavOnly) {
      const favImages = images.filter(item => {
        if (!favs[item.id]) return false;
        if (!query) return true;
        const h = (item.title + " " + (item.tags || []).join(" ")).toLowerCase();
        return h.includes(query);
      });
      favImages.forEach(item => fragment.appendChild(createCard(item)));
      totalCount = favImages.length;
    } else {
      loose.forEach(item => fragment.appendChild(createCard(item)));
      totalCount += loose.length;
    }

    grid.appendChild(fragment);
    countEl.textContent = `${totalCount} / ${images.length} 枚`;
  }

  /* ============================================
   *  フォルダモーダル
   * ============================================ */
  function openFolder(folderId) {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) { location.hash = ""; return; }

    const folderImages = getImagesInFolder(folderId);
    folderModalTitle.textContent = "📁 " + folder.name;

    folderGrid.innerHTML = "";
    const fragment = document.createDocumentFragment();
    folderImages.forEach(item => fragment.appendChild(createCard(item)));
    folderGrid.appendChild(fragment);

    folderModal.classList.remove("hidden");
  }

  function closeFolder() {
    folderModal.classList.add("hidden");
    folderGrid.innerHTML = "";
  }

  /* ============================================
   *  詳細画面
   * ============================================ */
  function openDetail(item) {
    currentItem = item;
    scrollPos = window.scrollY;

    detailImg.src = item.imgur;
    detailTitle.textContent = item.title;

    detailTags.innerHTML = "";
    (item.tags || []).forEach(t => {
      const sp = document.createElement("span");
      sp.className = "tag";
      sp.textContent = "#" + t;
      detailTags.appendChild(sp);
    });

    detailFav.textContent = isFav(item.id) ? "★" : "☆";

    // Imgur: 画像表示
    imgurEmbed.innerHTML = `<img src="${item.imgur}" style="width:100%;border-radius:12px;">`;

    // X: iframe
    const embedSrc = xEmbedUrl(item.xUrl);
    if (embedSrc) {
      xEmbed.innerHTML = `<iframe src="${embedSrc}" style="width:100%;min-height:350px;border:none;border-radius:12px;" allowfullscreen></iframe>`;
    } else {
      xEmbed.innerHTML = `<p style="padding:16px;color:#999;">Xリンクなし</p>`;
    }

    // Xで開くリンク
    if (item.xUrl) {
      xOpen.href = item.xUrl;
      xOpen.style.display = "";
    } else {
      xOpen.style.display = "none";
    }

    detailView.classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  function closeDetail() {
    detailView.classList.add("hidden");
    imgurEmbed.innerHTML = "";
    xEmbed.innerHTML = "";
    currentItem = null;
    window.scrollTo(0, scrollPos);
    render();
  }

  /* ============================================
   *  ハッシュルーティング
   *
   *  #folder/g7      → フォルダモーダル
   *  #detail/3       → 詳細画面
   *  (なし)          → 一覧
   * ============================================ */
  function handleRoute() {
    const hash = location.hash;

    const folderMatch = hash.match(/^#folder\/(.+)$/);
    const detailMatch = hash.match(/^#detail\/(\d+)$/);

    // まず全部閉じる
    if (!detailMatch) {
      detailView.classList.add("hidden");
    }
    if (!folderMatch) {
      closeFolder();
    }

    if (detailMatch) {
      const item = findById(detailMatch[1]);
      if (item) {
        openDetail(item);
      } else {
        location.hash = "";
      }
    } else if (folderMatch) {
      openFolder(folderMatch[1]);
    } else {
      // 一覧
      closeDetail();
      closeFolder();
    }
  }

  /* ── イベント ── */
  searchInput.addEventListener("input", render);

  favFilterBtn.addEventListener("click", () => {
    showFavOnly = !showFavOnly;
    favFilterBtn.classList.toggle("active", showFavOnly);
    favLabel.textContent = showFavOnly ? "⭐のみ" : "すべて";
    render();
  });

  backBtn.addEventListener("click", () => { location.hash = ""; });

  folderModalClose.addEventListener("click", () => { location.hash = ""; });
  folderBackdrop.addEventListener("click", () => { location.hash = ""; });

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

  window.addEventListener("hashchange", handleRoute);

  /* ── 初期化 ── */
  render();
  handleRoute();

  /* ── Service Worker ── */
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

})();
