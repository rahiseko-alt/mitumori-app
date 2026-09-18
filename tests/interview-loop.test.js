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

  test(name + "：1回3問、推奨案と金額つきという形が決まっている", () => {
    assert.ok(text.includes("1回につき3問"), "1回に出す問数が決まっていない");
    assert.ok(text.includes("推奨案と金額を添える"), "推奨案と金額の決まりがない");
    assert.ok(text.includes("そのまま読み上げられる形"), "営業が読み上げる前提が書かれていない");
  });

  test(name + "：文書を出すのはヒアリングのあとだと決まっている", () => {
    const stage3 = text.slice(text.indexOf("### 3"), text.indexOf("### 4"));
    assert.ok(stage3.includes("アーティファクトはこの段階では出さない"),
      "聞く前に提案書を作る余地が残っている");
  });
}
