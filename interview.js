(function attachInterview(root, factory) {
  const data = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  if (root) root.EstimateInterview = data;
})(typeof window !== "undefined" ? window : null, function createInterview() {
  // 骨格の木。営業が顧客に聞くのは「業務の事実」で、機能名は聞かない。
  // 答えが見積項目を導く。pricingClass が foundation の15件と必須6件は
  // 誰も選ばない基盤なので、ここでは一切扱わない（docs/adr/0003 参照）。
  //
  // q(id, section, prompt, help, choices, opts)
  //   choices[].adds  この選択肢が足す見積項目
  //   choices[].dig   掘り下げが要る選択肢。用語表に残す問いを持つ
  //   opts.multi      複数選べる
  //   opts.when       前の答えに応じて出す（省略時は必ず聞く）

  const q = (id, section, prompt, help, choices, opts = {}) => ({
    id, section, prompt, help, choices, multi: !!opts.multi, when: opts.when || null,
  });

  const questions = [
    // ── 誰が使うか ─────────────────────────────────────────
    q("who", "誰が使うか",
      "このシステムは誰が使いますか。",
      "社外の人が触るかどうかで、権限まわりの作りが大きく変わります。",
      [
        { value: "staff", label: "社内の人だけ", adds: [] },
        { value: "partner", label: "取引先や協力会社も使う", adds: ["customer-portal-ui", "external-portal-access", "role-permissions"] },
        { value: "public", label: "一般のお客さんが使う", adds: ["customer-portal-ui", "role-permissions"] },
      ], { multi: true }),

    q("login", "誰が使うか",
      "ログインは必要ですか。",
      "誰が何をしたかを残すには、ログインが前提になります。",
      [
        { value: "none", label: "不要（URLを知っていれば誰でも）", adds: [] },
        { value: "email", label: "メールアドレスとパスワード", adds: ["email-login"] },
        { value: "social", label: "Googleなど既にお持ちのアカウント", adds: ["social-login"] },
      ], { multi: true }),

    q("mfa", "誰が使うか",
      "ログインのとき、確認コードによる本人確認まで行いますか。",
      "金銭や個人情報を扱う場合に求められることがあります。",
      [
        { value: "yes", label: "行う", adds: ["mfa"] },
        { value: "no", label: "行わない", adds: [] },
      ], { when: (a) => has(a.login, "email") || has(a.login, "social") }),

    q("scope", "誰が使うか",
      "人によって、見えるものや、できることを変えますか。",
      "「一般社員は自分の分だけ、部長は部署全体」のような区別です。",
      [
        { value: "role", label: "役割ごとに変える", adds: ["role-permissions"] },
        { value: "tenant", label: "会社ごとにデータを完全に分ける", adds: ["organization-tenancy"] },
        { value: "no", label: "全員が同じものを見る", adds: [] },
      ], { multi: true }),

    q("volume", "誰が使うか",
      "だいたい何人くらいが使いますか。",
      "同時に使う人数が多いほど、速度と障害への備えが要ります。",
      [
        { value: "small", label: "〜30人", adds: [] },
        { value: "mid", label: "30〜300人", adds: ["performance-tests"] },
        { value: "large", label: "300人以上", adds: ["performance-tests", "scalable-infra", "disaster-recovery"] },
      ]),

    // ── 何を扱うか ─────────────────────────────────────────
    q("records", "何を扱うか",
      "登録して、あとから見返したい情報はありますか。",
      "顧客名簿、案件、日報、点検記録など。ほぼすべてのシステムで「ある」になります。",
      [
        { value: "yes", label: "ある", adds: ["list-detail-ui", "form-ui"] },
        { value: "no", label: "ない（見せるだけ）", adds: [] },
      ]),

    q("find", "何を扱うか",
      "登録した情報を、どうやって見つけますか。",
      "件数が増えたときに困らないかを決めます。",
      [
        { value: "list", label: "一覧から探せば十分", adds: [] },
        { value: "filter", label: "条件を指定して絞り込みたい", adds: ["advanced-search-ui"] },
        { value: "fulltext", label: "文章の中身まで検索したい", adds: ["advanced-search-ui", "search-index"] },
      ], { when: (a) => has(a.records, "yes"), multi: true }),

    q("master", "何を扱うか",
      "分類・単価・選択肢を、あとからご自身で変更したいですか。",
      "「変更できない」を選ぶと、変更のたびに開発費が発生します。",
      [
        { value: "yes", label: "自分たちで変更したい", adds: ["master-data"] },
        { value: "no", label: "変更は依頼でよい", adds: [] },
      ], { when: (a) => has(a.records, "yes") }),

    q("history", "何を扱うか",
      "「誰がいつ何を変えたか」と、変更前の内容を残しますか。",
      "後から揉めたときに効きます。監査が入る業種では必須になりがちです。",
      [
        { value: "yes", label: "残す", adds: ["history-versioning"] },
        { value: "no", label: "残さない", adds: [] },
      ], { when: (a) => has(a.records, "yes") }),

    q("migrate", "何を扱うか",
      "いま使っているデータを、新しいシステムへ移しますか。",
      "件数と品質によって費用が大きく変わるため、正式見積の前に必ず実物を確認します。",
      [
        { value: "yes", label: "移す", adds: ["data-migration"], dig: "いま何で管理していて、何件あり、どの項目を移すか" },
        { value: "no", label: "移さない（新規に入力する）", adds: [] },
      ]),

    // ── 業務の流れ ─────────────────────────────────────────
    q("flow", "業務の流れ",
      "処理には段階がありますか。",
      "「下書き → 確認中 → 完了」のように状態が進むかどうかです。",
      [
        { value: "status", label: "段階がある", adds: ["workflow-engine"], dig: "どんな段階があり、誰が次へ進めるか" },
        { value: "approve", label: "段階があり、承認や差戻しもある", adds: ["workflow-engine", "approval-flow"], dig: "承認は何段階で、誰が承認し、金額などで承認者が変わるか" },
        { value: "no", label: "段階はない（登録したら終わり）", adds: [] },
      ]),

    q("calc", "業務の流れ",
      "自動で計算してほしいものはありますか。",
      "金額、期限、割引、判定など。ここが手計算のままだと導入効果が出ません。",
      [
        { value: "yes", label: "ある", adds: ["business-rules"], dig: "どんな計算を、どんなルールで行うか" },
        { value: "no", label: "ない", adds: [] },
      ]),

    q("business", "業務の流れ",
      "この中に、当てはまるものはありますか。",
      "当てはまるものをすべて選んでください。",
      [
        { value: "estimate", label: "見積書・請求書の金額を計算する", adds: ["estimate-invoice"] },
        { value: "booking", label: "予約・変更・キャンセルを受け付ける", adds: ["booking-flow"] },
        { value: "catalog", label: "商品やサービスと価格を登録する", adds: ["product-catalog"] },
        { value: "stock", label: "在庫の増減と残数を管理する", adds: ["inventory"] },
        { value: "shop", label: "商品を選んで注文してもらう", adds: ["ecommerce"] },
        { value: "subscription", label: "月額・年額で継続的に課金する", adds: ["subscription"] },
        { value: "crm", label: "取引先・案件・対応履歴をまとめる", adds: ["crm"] },
        { value: "none", label: "どれもない", adds: [] },
      ], { multi: true }),

    // ── お金 ──────────────────────────────────────────────
    q("money", "お金",
      "お金のやり取りはありますか。",
      "決済を含むと、第三者による安全性の確認が必要になります。",
      [
        { value: "card", label: "システム上で支払う（クレジットカードなど）", adds: ["payment-integration"], dig: "どの決済手段を使い、返金や分割はあるか" },
        { value: "accounting", label: "会計ソフトへ請求・入金を渡す", adds: ["accounting-integration"], dig: "どの会計ソフトを使っているか" },
        { value: "no", label: "システムではお金を扱わない", adds: [] },
      ], { multi: true }),

    // ── 画面 ──────────────────────────────────────────────
    q("screens", "画面",
      "ほしい画面はありますか。",
      "当てはまるものをすべて選んでください。",
      [
        { value: "dashboard", label: "状況をひと目で把握する画面", adds: ["dashboard-ui"] },
        { value: "chart", label: "数値をグラフで見る", adds: ["charts-ui"] },
        { value: "calendar", label: "予定や期限をカレンダーで見る", adds: ["calendar-ui"] },
        { value: "editor", label: "画像や表を含む文章を作る", adds: ["rich-editor-ui"] },
        { value: "admin", label: "管理者だけが使う設定画面", adds: ["admin-ui"] },
        { value: "none", label: "特にない", adds: [] },
      ], { multi: true }),

    q("device", "画面",
      "どの端末で使いますか。",
      "スマートフォンで使うなら、画面の作り方が変わります。",
      [
        { value: "pc", label: "パソコンが中心", adds: [] },
        { value: "mobile", label: "スマートフォン・タブレットでも使う", adds: ["responsive-shell"] },
        { value: "app", label: "ホーム画面から起動したい", adds: ["responsive-shell", "pwa"] },
        { value: "store", label: "アプリストアで配布したい", adds: ["responsive-shell", "pwa", "native-app"] },
      ], { multi: true }),

    q("brand", "画面",
      "見た目について、要望はありますか。",
      "",
      [
        { value: "lang", label: "日本語以外の言語でも表示したい", adds: ["i18n-ui"], dig: "どの言語に対応し、誰が翻訳するか" },
        { value: "theme", label: "会社ごとにロゴや配色を変えたい", adds: ["theme-ui"] },
        { value: "a11y", label: "高齢者や障がいのある方にも配慮したい", adds: ["accessibility-ui", "accessibility-tests"] },
        { value: "none", label: "特にない", adds: [] },
      ], { multi: true }),

    // ── 写真・ファイル ─────────────────────────────────────
    q("files", "写真・ファイル",
      "写真や書類を扱いますか。",
      "現場の記録では、ここが使い勝手を左右します。",
      [
        { value: "doc", label: "書類を添付する", adds: ["file-upload"] },
        { value: "photo", label: "写真を複数選んで並べ替える", adds: ["file-upload", "image-upload", "image-processing"] },
        { value: "camera", label: "その場で撮影して登録する", adds: ["file-upload", "image-upload", "image-processing", "camera-capture"] },
        { value: "video", label: "動画を添付して再生する", adds: ["file-upload", "video-upload"] },
        { value: "none", label: "扱わない", adds: [] },
      ], { multi: true }),

    q("field", "写真・ファイル",
      "電波の届かない場所でも入力しますか。",
      "山間部・地下・建物内など。後から自動で送る作りが必要になります。",
      [
        { value: "yes", label: "ある", adds: ["offline-sync"], dig: "通信できない時間はどのくらい続くか" },
        { value: "no", label: "ない", adds: [] },
      ], { when: (a) => has(a.device, "mobile") || has(a.device, "app") || has(a.device, "store") }),

    q("place", "写真・ファイル",
      "現在地や地図を使いますか。",
      "",
      [
        { value: "map", label: "住所検索や地図の表示だけ", adds: ["maps-integration"] },
        { value: "gps", label: "現在地の取得や経路案内まで", adds: ["maps-integration", "geolocation"] },
        { value: "no", label: "使わない", adds: [] },
      ]),

    // ── 知らせる ──────────────────────────────────────────
    q("notify", "知らせる",
      "利用者へどうやって知らせますか。",
      "当てはまるものをすべて選んでください。",
      [
        { value: "inapp", label: "アプリの中でお知らせを出す", adds: ["notification-center"] },
        { value: "mail", label: "メールを自動送信する", adds: ["email-integration"] },
        { value: "sms", label: "SMSを自動送信する", adds: ["sms-integration"] },
        { value: "chat", label: "普段使っている社内チャットへ送る", adds: ["messaging-integration"], dig: "どのチャットサービスを使っているか" },
        { value: "push", label: "スマートフォンへ通知を出す", adds: ["push-notification"] },
        { value: "none", label: "知らせは不要", adds: [] },
      ], { multi: true }),

    q("timer", "知らせる",
      "決まった時刻に、自動で通知や集計を行いますか。",
      "「毎朝8時に当日の予定を送る」「月末に集計する」など。",
      [
        { value: "yes", label: "行う", adds: ["scheduled-jobs"], dig: "何を、いつ、誰に送るか" },
        { value: "no", label: "行わない", adds: [] },
      ]),

    // ── 書類・データ ──────────────────────────────────────
    q("output", "書類・データ",
      "システムから出したいものはありますか。",
      "当てはまるものをすべて選んでください。",
      [
        { value: "report", label: "登録内容から報告書を作る", adds: ["report-generator"], dig: "どんな様式の書類を、何種類作るか" },
        { value: "pdf", label: "PDFで出力する", adds: ["pdf-generator"] },
        { value: "excel", label: "Excel・CSVで取り込む／書き出す", adds: ["import-export"] },
        { value: "analytics", label: "集計・分析のためにデータをためる", adds: ["analytics-store"] },
        { value: "none", label: "特にない", adds: [] },
      ], { multi: true }),

    // ── 他サービス ────────────────────────────────────────
    q("external", "他サービス",
      "他のサービスとつなぎますか。",
      "当てはまるものをすべて選んでください。",
      [
        { value: "calendar", label: "外部カレンダーと予定を合わせる", adds: ["calendar-integration"] },
        { value: "esign", label: "契約書を送って電子署名してもらう", adds: ["esign-integration"] },
        { value: "webhook", label: "他サービスの更新をすぐ受け取る", adds: ["webhooks"], dig: "どのサービスの、どんな更新を受け取るか" },
        { value: "none", label: "つながない", adds: [] },
      ], { multi: true }),

    // ── 確かめる ──────────────────────────────────────────
    q("quality", "確かめる",
      "標準の動作確認に加えて、確かめておきたいことはありますか。",
      "単体テスト・結合テスト・画面操作テストは標準の動作確認一式に含まれており、必ず実施します。" +
      "ここで選ばなかったものは、本番で見つかることになります。",
      [
        { value: "security", label: "不正な操作や設定漏れがないか確認する", adds: ["security-tests"] },
        { value: "review", label: "第三者に安全性を確認してもらう", adds: ["security-review"] },
        { value: "uat", label: "顧客側の確認作業を支援する", adds: ["uat-support"] },
        { value: "standard", label: "標準の動作確認だけでよい", adds: [] },
      ], { multi: true }),

    // ── 導入後 ────────────────────────────────────────────
    q("after", "導入後",
      "公開したあとのことで、必要なものはありますか。",
      "",
      [
        { value: "manual", label: "操作マニュアルと説明会", adds: ["documentation-training"] },
        { value: "support", label: "問い合わせ・障害への対応", adds: ["support-operation"] },
        { value: "none", label: "自分たちで対応する", adds: [] },
      ], { multi: true }),

    q("domain", "導入後",
      "この業界に、守らなければならないルールや法令はありますか。",
      "建設業、医療、金融、士業など。あとから判明すると作り直しになります。",
      [
        { value: "yes", label: "ある", adds: ["domain-research"], dig: "どの法令・業界ルールに従う必要があるか" },
        { value: "no", label: "特にない", adds: [] },
      ]),
  ];

  // どの案件でも設計工程は必要になるため、1問目に答えた時点で足す。
  // （必須項目6件はエンジン側が常に入れるので、ここには含めない）
  const alwaysAdded = ["information-architecture", "wireframes", "design-system", "db-foundation", "web-deploy"];

  function has(answer, value) {
    if (!answer) return false;
    return Array.isArray(answer) ? answer.includes(value) : answer === value;
  }

  function visibleQuestions(answers) {
    return questions.filter((item) => !item.when || item.when(answers));
  }

  function selectedFeatures(answers) {
    const ids = new Set(alwaysAdded);
    for (const item of visibleQuestions(answers)) {
      const picked = answers[item.id];
      if (picked === undefined || picked === null) continue;
      const values = Array.isArray(picked) ? picked : [picked];
      for (const choice of item.choices) {
        if (values.includes(choice.value)) choice.adds.forEach((id) => ids.add(id));
      }
    }
    return [...ids];
  }

  // 掘り下げが要る選択肢。用語表に残す問いを持って返す。
  function pendingDigs(answers) {
    const digs = [];
    for (const item of visibleQuestions(answers)) {
      const picked = answers[item.id];
      if (picked === undefined || picked === null) continue;
      const values = Array.isArray(picked) ? picked : [picked];
      for (const choice of item.choices) {
        if (values.includes(choice.value) && choice.dig) {
          digs.push({ questionId: item.id, choice: choice.value, label: choice.label, ask: choice.dig });
        }
      }
    }
    return digs;
  }

  function answeredCount(answers) {
    return visibleQuestions(answers).filter((item) => {
      const picked = answers[item.id];
      return Array.isArray(picked) ? picked.length > 0 : picked !== undefined && picked !== null;
    }).length;
  }

  return { questions, alwaysAdded, has, visibleQuestions, selectedFeatures, pendingDigs, answeredCount };
});
