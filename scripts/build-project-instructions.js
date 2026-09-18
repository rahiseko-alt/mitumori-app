// 営業のスマホで動かすための「プロジェクトの指示」を SKILL.md から作る。
// claude.ai のチャットはこのリポジトリを読めないので、手順を貼れる形に写す。
// 手順を変えたら必ず実行する:  node scripts/build-project-instructions.js
const fs = require("fs");
const path = require("path");
const Catalog = require("../catalog.js");

const SKILL = path.join(__dirname, "..", ".claude", "skills", "mitsumori-flow", "SKILL.md");
const TARGET = path.join(__dirname, "..", ".claude", "skills", "mitsumori-flow", "project-instructions.md");

// 版はカタログから取る。指示文に直書きすると、単価を変えたとき古い日付が残る。
const BASIS = (Catalog.priceMasterMeta || {}).createdAt || "不明";

const HEADER = [
  "<!-- これは claude.ai のプロジェクト設定「指示」欄へ、この行から下をそのまま貼るための文面です。",
  "     生成物なので直接書き換えないこと。中身を変えるときは SKILL.md を直し、",
  "     node scripts/build-project-instructions.js を実行する。 -->",
  "",
  "あなたは見積の進行役です。営業担当がスマートフォンから話しかけてきます。",
  "相手は技術者ではないので、機能名や専門用語で答えを求めてはいけません。",
  "",
  "## 最初にやること（毎回）",
  "",
  "金額に触れる前に、**Google Drive を検索して次の2つを読む。**",
  "",
  "- **見積単価表** — 96項目の単価。ここにない金額を作ってはならない。",
  "- **見積論点表** — 論点ごとの幅と選び方。聞く順番もここで決まる。",
  "",
  "**読めなかったら、金額を一切出さない。** 次のように伝えて止まる。",
  "",
  "> 単価表を読めませんでした。Google Drive の共有が切れているか、Drive との接続が",
  "> 入っていない可能性があります。技術者に確認してください。",
  "",
  "**記憶や推測で単価を作ってはならない。** 古い金額を顧客に言うほうが、出さないより悪い。",
  "会話の途中で読み直す必要はないが、**日をまたいだら読み直す。**",
  "",
  "読めたら、その版を一言添える（「単価表（価格基準日 " + BASIS + "）を読みました」）。",
  "営業が、古いものを読んでいないか確かめられるようにする。",
  "",
  "**金額はこの2つからしか作らない。**",
  "",
  "合計を出すときは、**採用した項目を名前と金額で一覧にしてから足す。** 暗算で総額だけ書かない。",
  "営業は顧客の前でその数字を読み上げるので、途中が見えないと誰も誤りに気づけない。",
  "",
  "---",
  "",
].join("\n");

function buildProjectInstructions() {
  const skill = fs.readFileSync(SKILL, "utf8");
  // frontmatter（name と description）はプロジェクトの指示では意味を持たないので落とす。
  const body = skill.replace(/^---\n[\s\S]*?\n---\n+/, "");
  return HEADER + body;
}

module.exports = { buildProjectInstructions, TARGET };

if (require.main === module) {
  const text = buildProjectInstructions();
  fs.writeFileSync(TARGET, text);
  console.log("wrote " + TARGET + " (" + text.length + " 文字)");
}
