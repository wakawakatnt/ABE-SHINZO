/*
 * ===================================================
 *  ★ 画像データ（フォルダに属さない画像）★
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
  {
    id: 1,
    title: "トランプ　銃撃　遺影",
    imgur: "https://i.imgur.com/uFmtVf0.jpeg",
    xUrl: "https://x.com/GZ8FxNhlHi45022/status/2044051922102169897",
    tags: ["トランプ", "銃撃", "遺影"],
  },
  {
    id: 2,
    title: "全世界　宣戦布告　国交断絶　テコンダー朴",
    imgur: "https://i.imgur.com/uRMWz7j.jpeg",
    xUrl: "https://x.com/GZ8FxNhlHi45022/status/2044052040222159358",
    tags: ["テコ朴", "宣戦布告", "全世界", "全世界193ヵ国に対し", "テコンダー朴", "193", "国交断絶"],
  },
  {
    id: 3,
    title: "いいかげんなことばっかり言うんじゃないよ",
    imgur: "https://i.imgur.com/wvlW1vb.jpeg",
    xUrl: "https://x.com/GZ8FxNhlHi45022/status/2044051427220500794",
    tags: ["加減", "いいかげんなことばっかり言うんじゃないよ"],
  },

  // ★ ここに追加していく ★
];

/*
 * ===================================================
 *  フォルダ登録システム（この下は触らない）
 * ===================================================
 */
const folders = [];

function registerFolder(folderData) {
  folders.push({
    id: folderData.id,
    name: folderData.name,
  });
  folderData.images.forEach(function (img) {
    img.folder = folderData.id;
    images.push(img);
  });
}
