/*
 * ===================================================
 *  ★ 画像データ ★
 *  画像を追加するには下のテンプレをコピペして
 *  値を書き換えるだけでOK！
 * ===================================================
 *
 *  テンプレ（これをコピーして images の中に貼る）:
 *
 *  {
 *    id: 番号,
 *    title: "タイトル",
 *    imgur: "https://i.imgur.com/XXXXX.jpg",
 *    imgurPage: "https://imgur.com/XXXXX",
 *    xUrl: "https://x.com/ユーザー名/status/数字",
 *    tags: ["タグ1", "タグ2"],
 *  },
 *
 *  ・id は他と被らない数字にする
 *  ・imgur は画像の直リンク（.jpg .png 等）
 *  ・imgurPage は Imgur のページURL
 *  ・xUrl は X のポストURL
 *  ・tags は無くてもOK → tags: [],
 *
 * ===================================================
 */

const images = [
  // ── サンプル1 ──
  {
    id: 1,
    title: "サンプル画像1",
    imgur: "https://i.imgur.com/example1.jpg",
    imgurPage: "https://imgur.com/example1",
    xUrl: "https://x.com/example/status/111111111",
    tags: ["サンプル"],
  },
  // ── サンプル2 ──
  {
    id: 2,
    title: "サンプル画像2",
    imgur: "https://i.imgur.com/example2.jpg",
    imgurPage: "https://imgur.com/example2",
    xUrl: "https://x.com/example/status/222222222",
    tags: ["サンプル"],
  },

  // ★ ここに追加していく ★
];
