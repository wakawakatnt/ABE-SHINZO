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
 *    xUrl: "https://x.com/ユーザー名/status/数字",
 *    tags: ["タグ1", "タグ2"],
 *  },
 *
 *  ・id は他と被らない数字にする
 *  ・imgur は画像の直リンク（.jpg .png 等）
 *  ・xUrl は X のポストURL
 *  ・tags は無くてもOK → tags: [],
 *
 * ===================================================
 */

const images = [
  // ── サンプル1 ──
  {
    id: 1,
    title: "トランプ　銃撃　遺影",
    imgur: "https://i.imgur.com/uFmtVf0.jpeg",
    xUrl: "https://x.com/GZ8FxNhlHi45022/status/2044051922102169897",
    tags: ["トランプ", "銃撃", "遺影"],
  },
  // ── サンプル2 ──
  {
    id: 2,
    title: "サンプル画像2",
    imgur: "https://i.imgur.com/example2.jpg",
    xUrl: "https://x.com/example/status/222222222",
    tags: ["サンプル"],
  },

  // ★ ここに追加していく ★
];
