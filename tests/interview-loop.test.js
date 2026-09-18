const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("path");

// 手順の中身そのものを見張る。数字ではなく「聞くのはこちらの仕事」という一点を守る。
// ここが緩むと、未決の一覧を営業へ投げ返すだけの提案書作成機に戻る。
const SKILL = fs.readFileSync(
  path.join(__dirname, "..", ".claude", "skills", "mitsumori-flow", "SKILL.md"), "utf8");
const PASTE = fs.readFileSync(
  path.join(__dirname, "..", ".claude", "skills", "mitsumori-flow", "project-instructions.md"), "utf8");

for (const [name, text] of [["SKILL.md", SKILL], ["貼る指示", PASTE]]) {
  test(name + "：一覧を渡して終わることを禁じている", () => {
    assert.ok(text.includes("一覧を渡して終わってはいけない") || text.includes("未決の一覧を渡して終わる"),
      "宿題を出して終わる振る舞いに歯止めがない");
    assert.ok(text.includes("質問で終わらない返答を返す"),
      "返答を質問で終える決まりがない");
  });

  test(name + "：聞くのが商談の最中だと書いてある", () => {
    assert.ok(text.includes("聞く場は商談の最中"), "いつ聞くのかが書かれていない");
    assert.ok(text.includes("ヒアリングではない"), "宿題とヒアリングの区別がない");
  });

  test(name + "：1回3問、そのまま読み上げられる形が決まっている", () => {
    assert.ok(text.includes("1回に3問"), "1回に出す問数が決まっていない");
    assert.ok(text.includes("そのまま読み上げられる形"), "営業が読み上げる前提が書かれていない");
  });

  test(name + "：質問をボタンで出すことが既定の動作になっている", () => {
    assert.ok(text.includes("質問は必ずボタンで出す"), "ボタンで出す決まりがない");
    assert.ok(text.includes("これが既定の動作である"), "ボタンが既定だと書かれていない");
    assert.ok(text.includes("選択肢を文章に並べて"), "文章で並べることへの歯止めがない");
    assert.ok(text.includes("選択肢は4つまで"), "ボタンの選択肢数の制約が書かれていない");
    assert.ok(text.includes("「分からない・持ち帰る」を必ず選べる"), "分からないを選べる決まりがない");
    assert.ok(text.includes("選択肢の説明に金額を入れる"), "金額をどこに置くかが書かれていない");
  });

  test(name + "：文書を出すのはヒアリングのあとだと決まっている", () => {
    const stage3 = text.slice(text.indexOf("### 3"), text.indexOf("### 4"));
    assert.ok(stage3.includes("アーティファクトはこの段階では出さない"),
      "聞く前に提案書を作る余地が残っている");
  });
}
