/*
 * Service Worker — 画像キャッシュ
 * Imgur画像を一度読み込んだらキャッシュに保存し
 * 次回以降はネットワーク通信なしで表示する
 */

const CACHE_NAME = "abe-gallery-v1";

// インストール
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// アクティベート — 古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// フェッチ — Cache First 戦略（画像のみ）
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // 画像リクエストかどうか判定（Imgur画像 or 一般的な画像拡張子）
  const isImage =
    url.includes("i.imgur.com") ||
    /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);

  if (isImage) {
    // Cache First: キャッシュにあればそれを返す、なければネットワーク→キャッシュ保存
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            // 正常レスポンスのみキャッシュ
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
  }
  // 画像以外は通常通り
});
