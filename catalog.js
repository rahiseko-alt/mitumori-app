(function attachEstimateCatalog(root, factory) {
  const data = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  if (root) root.EstimateCatalog = data;
})(typeof window !== "undefined" ? window : null, function createCatalog() {
  const layers = {
    planning: "企画・設計",
    frontend: "フロントエンド",
    backend: "バックエンド",
    data: "データ",
    security: "認証・セキュリティ",
    mobile: "モバイル・メディア",
    integration: "外部連携",
    infra: "インフラ",
    qa: "テスト・品質",
    management: "管理・運用",
  };

  const roles = {
    planning: "打合せ・業務整理",
    design: "画面の使いやすさ",
    frontend: "画面を作る",
    backend: "計算・処理を作る",
    data: "情報の保存・整理",
    infra: "公開・安定運用",
    qa: "動作確認",
    pm: "進行管理",
  };

  const h = (planning, design, frontend, backend, data, infra, qa, pm) => ({
    planning, design, frontend, backend, data, infra, qa, pm,
  });

  const f = (id, layer, name, description, hours, dependencies = [], tags = []) => ({
    id, layer, name, description, hours, dependencies, tags,
  });

  const features = [
    f("requirements", "planning", "要件定義", "目的、利用者、業務ルール、対象範囲、受入条件を整理します。", h(48, 0, 0, 0, 0, 0, 8, 12), [], ["必須", "上流"]),
    f("domain-research", "planning", "業務・法令調査", "業界ルール、法令、既存帳票、競合サービスを調査します。", h(40, 0, 0, 0, 0, 0, 8, 8), ["requirements"], ["業務", "調査"]),
    f("architecture", "planning", "システム構成設計", "画面、API、データ、外部サービスの役割と境界を設計します。", h(28, 0, 0, 20, 12, 12, 4, 8), ["requirements"], ["設計", "基盤"]),
    f("information-architecture", "planning", "情報設計", "メニュー、画面階層、名称、情報のまとまりを設計します。", h(20, 20, 4, 0, 0, 0, 4, 4), ["requirements"], ["画面", "UX"]),
    f("wireframes", "planning", "ワイヤーフレーム", "主要画面の構成と操作の流れを簡易図で確認します。", h(8, 36, 4, 0, 0, 0, 4, 4), ["information-architecture"], ["画面", "UX"]),
    f("design-system", "planning", "デザインシステム", "色、文字、余白、入力部品などの共通ルールを整備します。", h(4, 32, 24, 0, 0, 0, 8, 4), ["wireframes"], ["UI", "共通化"]),

    f("responsive-shell", "frontend", "レスポンシブ画面基盤", "PC、タブレット、スマートフォンで使える画面枠を作ります。", h(2, 12, 36, 0, 0, 0, 12, 4), ["design-system"], ["Web", "スマホ"]),
    f("list-detail-ui", "frontend", "一覧・詳細画面", "データの一覧、並び替え、詳細確認を行う基本画面です。", h(4, 12, 36, 12, 4, 0, 12, 4), ["responsive-shell", "api-foundation", "schema-design"], ["CRUD", "一覧"]),
    f("form-ui", "frontend", "入力フォーム", "入力、必須チェック、エラー表示、保存確認を行います。", h(4, 12, 32, 12, 4, 0, 12, 4), ["responsive-shell", "api-foundation", "schema-design"], ["入力", "CRUD"]),
    f("advanced-search-ui", "frontend", "検索・絞り込み画面", "複数条件、キーワード、保存条件などでデータを探します。", h(6, 12, 32, 20, 8, 0, 16, 4), ["list-detail-ui", "search-index"], ["検索"]),
    f("dashboard-ui", "frontend", "ダッシュボード", "件数、状況、期限などを一画面で把握します。", h(8, 20, 44, 20, 12, 0, 16, 6), ["responsive-shell", "analytics-store", "charts-ui"], ["集計", "可視化"]),
    f("charts-ui", "frontend", "グラフ・チャート", "推移、割合、比較などをグラフで表示します。", h(4, 16, 36, 12, 8, 0, 12, 4), ["responsive-shell", "api-foundation"], ["可視化"]),
    f("calendar-ui", "frontend", "カレンダー画面", "日・週・月単位で予定や期限を表示・操作します。", h(6, 16, 44, 16, 8, 0, 16, 4), ["responsive-shell", "api-foundation"], ["日程"]),
    f("rich-editor-ui", "frontend", "リッチテキスト編集", "見出し、表、画像、装飾を含む文章を編集します。", h(4, 12, 32, 8, 4, 0, 16, 4), ["form-ui"], ["文章"]),
    f("customer-portal-ui", "frontend", "顧客・取引先ポータル", "社外利用者が自分に関係する情報だけを確認する画面です。", h(12, 24, 60, 20, 8, 0, 24, 8), ["responsive-shell", "external-portal-access"], ["社外", "ポータル"]),
    f("admin-ui", "frontend", "管理画面", "マスタ、利用者、権限、設定を運営者が管理します。", h(12, 20, 60, 28, 12, 0, 24, 8), ["list-detail-ui", "form-ui", "role-permissions"], ["管理"]),
    f("accessibility-ui", "frontend", "アクセシビリティ対応", "キーボード操作、読み上げ、色の識別などへ対応します。", h(8, 16, 28, 0, 0, 0, 24, 4), ["responsive-shell"], ["品質", "公共"]),
    f("i18n-ui", "frontend", "多言語対応", "画面文言、日付、数値、翻訳管理を複数言語に対応します。", h(12, 12, 32, 24, 12, 0, 24, 8), ["responsive-shell", "master-data"], ["多言語"]),
    f("theme-ui", "frontend", "ブランド・テーマ切替", "会社別のロゴ、色、帳票表記などを切り替えます。", h(8, 20, 32, 12, 8, 0, 16, 4), ["design-system", "master-data"], ["ブランド"]),

    f("api-foundation", "backend", "API基盤", "画面とデータ処理をつなぐ共通API、入力検証、エラー処理を作ります。", h(8, 0, 0, 48, 8, 8, 16, 6), ["architecture"], ["基盤", "必須"]),
    f("business-rules", "backend", "業務ルール計算", "金額、期限、状態遷移などの業務ロジックを一元化します。", h(16, 0, 8, 52, 12, 0, 24, 8), ["api-foundation", "schema-design"], ["計算", "業務"]),
    f("workflow-engine", "backend", "ワークフロー・状態管理", "下書き、確認中、承認済み、完了などの状態を管理します。", h(20, 4, 16, 60, 20, 0, 28, 10), ["business-rules", "history-versioning"], ["業務", "状態"]),
    f("approval-flow", "backend", "申請・承認", "申請者、承認者、差戻し、承認履歴を管理します。", h(20, 8, 24, 56, 16, 0, 28, 10), ["workflow-engine", "role-permissions", "notification-center"], ["承認"]),
    f("notification-center", "backend", "通知センター", "未読、既読、通知種別、通知先をアプリ内で管理します。", h(10, 8, 24, 40, 12, 8, 20, 6), ["user-accounts", "queue-worker"], ["通知"]),
    f("estimate-invoice", "backend", "見積・請求・税計算", "明細、数量、単価、税、値引き、利益、合計を計算して保存します。", h(24, 12, 32, 72, 28, 0, 36, 12), ["business-rules", "master-data", "pdf-generator"], ["金額", "帳票"]),
    f("booking-flow", "backend", "予約・受付", "空き枠、予約、変更、キャンセル、締切を管理します。", h(24, 12, 32, 72, 28, 0, 36, 12), ["workflow-engine", "calendar-ui", "notification-center"], ["予約"]),
    f("product-catalog", "backend", "商品・サービス台帳", "商品、サービス、価格、カテゴリ、公開状態を管理します。", h(16, 8, 24, 48, 20, 0, 24, 8), ["master-data", "admin-ui"], ["商品", "マスタ"]),
    f("inventory", "backend", "在庫管理", "入出庫、現在庫、引当、棚卸、在庫不足を管理します。", h(24, 8, 28, 76, 36, 0, 40, 12), ["product-catalog", "history-versioning"], ["在庫"]),
    f("ecommerce", "backend", "注文・EC", "カート、注文、支払、配送状態を管理します。", h(28, 20, 52, 96, 36, 8, 48, 16), ["product-catalog", "inventory", "payment-integration", "customer-portal-ui"], ["EC", "注文"]),
    f("subscription", "backend", "継続課金・契約プラン", "プラン、契約期間、更新、解約、請求周期を管理します。", h(28, 12, 36, 92, 32, 12, 48, 16), ["payment-integration", "scheduled-jobs", "user-accounts"], ["課金", "SaaS"]),
    f("crm", "backend", "顧客・案件管理", "顧客、担当者、商談、対応履歴、案件を管理します。", h(24, 12, 44, 72, 32, 0, 36, 12), ["list-detail-ui", "master-data", "history-versioning"], ["顧客", "案件"]),
    f("report-generator", "backend", "帳票・レポート生成", "テンプレートへデータを差し込み、報告書を作成します。", h(20, 16, 24, 64, 20, 8, 32, 10), ["business-rules", "file-storage"], ["帳票"]),
    f("pdf-generator", "backend", "PDF出力", "見積書、報告書などを印刷可能なPDFに変換します。", h(8, 12, 12, 36, 8, 8, 24, 6), ["report-generator"], ["PDF"]),
    f("scheduled-jobs", "backend", "定期処理", "期限通知、集計、データ同期などを指定時刻に実行します。", h(12, 0, 0, 40, 12, 16, 20, 6), ["queue-worker"], ["バッチ"]),
    f("import-export", "backend", "CSV・Excel入出力", "既存データの取込と一覧データの出力を行います。", h(12, 8, 20, 48, 32, 4, 28, 8), ["api-foundation", "schema-design", "file-upload"], ["CSV", "Excel"]),

    f("db-foundation", "data", "データベース基盤", "永続データを安全に保存する基本環境を用意します。", h(4, 0, 0, 16, 40, 12, 12, 4), ["architecture"], ["DB", "基盤"]),
    f("schema-design", "data", "データ設計", "テーブル、項目、関係、制約、検索方法を設計します。", h(16, 0, 0, 12, 40, 0, 12, 6), ["db-foundation"], ["DB", "設計"]),
    f("master-data", "data", "マスタデータ管理", "選択肢、分類、単価、設定値を管理画面から変更可能にします。", h(12, 4, 16, 36, 24, 0, 20, 6), ["schema-design", "form-ui"], ["マスタ"]),
    f("history-versioning", "data", "変更履歴・版管理", "誰がいつ何を変更したか、過去版を含めて保存します。", h(16, 0, 8, 44, 28, 0, 24, 8), ["schema-design", "user-accounts"], ["履歴"]),
    f("file-storage", "data", "ファイル保管", "画像や文書を保存し、権限付きURLで取得します。", h(8, 0, 0, 28, 16, 24, 20, 6), ["web-deploy", "security-baseline"], ["ファイル"]),
    f("search-index", "data", "全文検索基盤", "大量データを高速に検索できる索引を作ります。", h(8, 0, 0, 32, 32, 16, 24, 6), ["schema-design"], ["検索"]),
    f("analytics-store", "data", "集計・分析データ", "ダッシュボード用の集計値と履歴を蓄積します。", h(16, 0, 0, 28, 44, 8, 24, 8), ["schema-design", "scheduled-jobs"], ["分析"]),
    f("backup-restore", "data", "バックアップ・復元", "誤操作や障害時にデータを復元できる運用を整えます。", h(12, 0, 0, 8, 20, 36, 20, 8), ["db-foundation", "monitoring"], ["運用"]),
    f("data-migration", "data", "既存データ移行", "既存Excelや旧システムのデータを検査・変換して取り込みます。", h(24, 0, 8, 40, 64, 8, 40, 12), ["schema-design", "import-export", "uat-support"], ["移行"]),

    f("security-baseline", "security", "セキュリティ基本設計", "通信、入力検証、秘密情報、アクセス制御の基本方針を整えます。", h(16, 0, 0, 20, 8, 16, 20, 6), ["architecture"], ["セキュリティ", "必須"]),
    f("user-accounts", "security", "利用者アカウント", "利用者ID、状態、プロフィール、退会・停止を管理します。", h(12, 4, 20, 52, 20, 4, 28, 8), ["api-foundation", "schema-design", "security-baseline"], ["認証"]),
    f("session-security", "security", "ログイン状態・セッション", "ログイン維持、期限切れ、ログアウト、端末管理を行います。", h(8, 0, 12, 36, 8, 4, 24, 6), ["user-accounts"], ["認証"]),
    f("email-login", "security", "メール・パスワード認証", "登録、ログイン、パスワード再設定、メール確認を行います。", h(10, 8, 24, 44, 12, 4, 28, 8), ["session-security", "email-integration"], ["認証"]),
    f("social-login", "security", "Google等の外部ログイン", "外部アカウントを使って登録・ログインします。", h(8, 4, 16, 36, 8, 4, 24, 6), ["session-security", "external-api"], ["認証", "外部連携"]),
    f("mfa", "security", "多要素認証", "確認コードや認証アプリを使い、ログインを強化します。", h(12, 4, 16, 40, 12, 8, 28, 8), ["session-security", "notification-center"], ["認証"]),
    f("role-permissions", "security", "役割・権限管理", "管理者、担当者、取引先などの閲覧・更新範囲を制御します。", h(24, 8, 32, 72, 28, 4, 44, 14), ["user-accounts", "schema-design"], ["権限"]),
    f("organization-tenancy", "security", "会社・組織分離", "複数企業のデータが混ざらないよう組織単位で分離します。", h(28, 8, 28, 84, 40, 8, 52, 16), ["role-permissions", "audit-log"], ["SaaS", "複数社"]),
    f("external-portal-access", "security", "社外利用者アクセス", "招待、公開期限、対象データ制限を含む社外向けアクセスです。", h(20, 8, 24, 60, 20, 8, 36, 12), ["role-permissions", "audit-log"], ["社外"]),
    f("audit-log", "security", "監査ログ", "重要操作、送付、承認、金額変更などの証跡を保存します。", h(16, 0, 12, 48, 24, 4, 28, 8), ["user-accounts", "schema-design"], ["証跡"]),
    f("security-review", "security", "セキュリティレビュー", "設計・実装・設定を第三者視点で確認し、是正します。", h(16, 0, 4, 16, 8, 16, 48, 8), ["security-baseline", "security-tests"], ["レビュー"]),

    f("file-upload", "mobile", "ファイル添付", "文書や画像を選択し、進捗・容量・失敗を表示して保存します。", h(8, 8, 28, 36, 8, 8, 24, 6), ["form-ui", "file-storage", "api-foundation"], ["添付"]),
    f("image-upload", "mobile", "画像添付・複数写真", "複数画像の選択、プレビュー、並び替え、削除を行います。", h(8, 12, 36, 28, 8, 8, 28, 6), ["file-upload", "image-processing"], ["写真"]),
    f("image-processing", "mobile", "画像圧縮・サムネイル", "大きな画像を圧縮し、一覧表示用画像を自動生成します。", h(6, 0, 4, 36, 8, 20, 24, 6), ["file-storage", "queue-worker"], ["写真"]),
    f("camera-capture", "mobile", "カメラ撮影", "スマートフォンから撮影し、そのまま案件等へ登録します。", h(8, 12, 36, 16, 4, 0, 28, 6), ["image-upload", "responsive-shell"], ["現場", "写真"]),
    f("video-upload", "mobile", "動画添付", "大容量動画のアップロード、変換、再生を行います。", h(12, 12, 36, 48, 12, 32, 36, 10), ["file-upload", "cdn"], ["動画"]),
    f("pwa", "mobile", "PWA・ホーム画面追加", "Webアプリを端末のホーム画面から起動できるようにします。", h(8, 8, 28, 8, 0, 12, 20, 6), ["responsive-shell", "web-deploy"], ["スマホ"]),
    f("offline-sync", "mobile", "オフライン保存・再同期", "通信が不安定でも入力し、復旧後に競合を処理して同期します。", h(28, 12, 72, 68, 32, 16, 56, 18), ["pwa", "api-foundation", "history-versioning", "queue-worker"], ["現場", "高難度"]),
    f("native-app", "mobile", "iOS・Androidアプリ", "ストア配布するネイティブまたはクロスプラットフォームアプリです。", h(24, 32, 120, 32, 8, 40, 64, 20), ["api-foundation", "design-system", "cicd"], ["アプリ", "高難度"]),
    f("push-notification", "mobile", "プッシュ通知", "端末へ期限、更新、承認依頼などを通知します。", h(12, 4, 20, 44, 12, 20, 28, 8), ["notification-center", "queue-worker", "pwa"], ["通知"]),
    f("geolocation", "mobile", "位置情報・地図", "現在地、住所検索、地図表示、距離などを扱います。", h(12, 12, 36, 28, 12, 4, 28, 8), ["responsive-shell", "maps-integration"], ["地図"]),

    f("external-api", "integration", "外部API連携基盤", "外部サービスの認証、失敗、再試行、利用制限を共通管理します。", h(16, 0, 4, 52, 12, 16, 28, 10), ["api-foundation", "security-baseline", "monitoring"], ["外部連携"]),
    f("webhooks", "integration", "Webhook送受信", "他サービスからの通知を受け、または更新を通知します。", h(10, 0, 0, 36, 8, 12, 24, 6), ["external-api", "queue-worker"], ["外部連携"]),
    f("email-integration", "integration", "メール送信", "招待、期限、帳票案内などのメールを送信・再送します。", h(8, 4, 8, 32, 8, 12, 20, 6), ["queue-worker"], ["通知"]),
    f("sms-integration", "integration", "SMS送信", "確認コードや重要通知を電話番号宛てに送信します。", h(8, 4, 8, 32, 8, 12, 24, 6), ["external-api", "queue-worker"], ["通知"]),
    f("messaging-integration", "integration", "チャット・メッセージ連携", "利用中の連絡サービスへ通知や共有URLを送ります。", h(12, 4, 12, 40, 8, 12, 28, 8), ["external-api", "queue-worker"], ["通知", "外部連携"]),
    f("payment-integration", "integration", "オンライン決済", "決済、返金、失敗、入金状態、決済通知を処理します。", h(24, 12, 36, 84, 28, 12, 52, 16), ["external-api", "audit-log", "security-review", "webhooks"], ["決済", "高難度"]),
    f("accounting-integration", "integration", "会計ソフト連携", "請求・入金・取引先データを会計サービスと同期します。", h(20, 4, 16, 64, 28, 12, 40, 12), ["external-api", "scheduled-jobs", "audit-log"], ["会計"]),
    f("maps-integration", "integration", "地図サービス連携", "住所検索、地図、経路、座標を外部サービスから取得します。", h(12, 4, 20, 36, 12, 8, 24, 8), ["external-api"], ["地図"]),
    f("calendar-integration", "integration", "外部カレンダー連携", "予定を外部カレンダーと同期し、重複や変更を処理します。", h(16, 4, 20, 52, 16, 12, 32, 10), ["external-api", "scheduled-jobs", "calendar-ui"], ["日程"]),
    f("esign-integration", "integration", "電子契約・電子署名", "文書送信、署名依頼、完了通知、署名済み文書を管理します。", h(24, 8, 24, 72, 20, 12, 44, 14), ["external-api", "audit-log", "file-storage", "webhooks"], ["契約"]),

    f("web-deploy", "infra", "Web公開環境", "アプリ、API、ドメイン、暗号化通信を本番公開します。", h(4, 0, 0, 8, 4, 36, 16, 6), ["architecture"], ["公開", "基盤"]),
    f("staging", "infra", "検証環境", "本番へ出す前に顧客と確認できる別環境を用意します。", h(4, 0, 0, 8, 8, 28, 16, 6), ["web-deploy"], ["環境"]),
    f("cicd", "infra", "自動ビルド・デプロイ", "変更時に検査し、承認された版を自動で配備します。", h(4, 0, 4, 8, 4, 36, 24, 8), ["staging", "unit-tests"], ["自動化"]),
    f("monitoring", "infra", "稼働監視", "停止、遅延、失敗、容量を監視して通知します。", h(8, 0, 0, 8, 4, 32, 20, 8), ["web-deploy"], ["運用"]),
    f("error-tracking", "infra", "エラー追跡", "画面・APIのエラーを利用状況とともに記録します。", h(4, 0, 8, 8, 0, 16, 16, 4), ["monitoring"], ["運用"]),
    f("cdn", "infra", "CDN・高速配信", "画像やファイルを利用者に近い場所から高速配信します。", h(4, 0, 0, 8, 0, 24, 16, 4), ["web-deploy", "monitoring"], ["性能"]),
    f("queue-worker", "infra", "非同期処理・再試行", "重い処理や外部送信を待ち行列へ入れ、失敗時に再試行します。", h(12, 0, 0, 44, 12, 28, 28, 8), ["web-deploy", "monitoring"], ["安定性"]),
    f("scalable-infra", "infra", "負荷分散・拡張構成", "利用増加に合わせて処理能力を増減できるようにします。", h(16, 0, 0, 20, 12, 56, 36, 12), ["cdn", "queue-worker", "monitoring"], ["性能", "高難度"]),
    f("disaster-recovery", "infra", "災害・障害復旧", "復旧時間と復旧可能なデータ時点を定め、復旧手順を検証します。", h(16, 0, 0, 12, 16, 52, 32, 12), ["backup-restore", "staging"], ["運用"]),

    f("unit-tests", "qa", "単体テスト", "金額計算、権限、入力検証などを機械的に検査します。", h(4, 0, 4, 12, 4, 0, 36, 4), ["architecture"], ["テスト", "必須"]),
    f("integration-tests", "qa", "結合テスト", "画面、API、データ、外部処理の接続を検査します。", h(6, 0, 8, 12, 8, 4, 48, 6), ["api-foundation", "db-foundation", "staging"], ["テスト"]),
    f("e2e-tests", "qa", "画面操作テスト", "利用者の一連の操作をブラウザで自動検査します。", h(6, 0, 8, 8, 4, 4, 52, 6), ["responsive-shell", "staging"], ["テスト"]),
    f("qa-baseline", "qa", "標準QA一式", "単体、結合、主要画面操作を標準の品質確認として実施します。", h(8, 0, 4, 8, 4, 4, 32, 8), ["unit-tests", "integration-tests", "e2e-tests"], ["テスト", "推奨"]),
    f("performance-tests", "qa", "性能・負荷テスト", "応答時間、同時利用、ファイル容量、処理限界を確認します。", h(8, 0, 4, 8, 8, 16, 44, 8), ["scalable-infra", "staging"], ["テスト", "性能"]),
    f("accessibility-tests", "qa", "アクセシビリティ試験", "読み上げ、キーボード、コントラスト等を確認します。", h(4, 4, 4, 0, 0, 0, 28, 4), ["accessibility-ui", "e2e-tests"], ["テスト"]),
    f("security-tests", "qa", "セキュリティ試験", "権限、入力、通信、依存ライブラリ、設定を検査します。", h(12, 0, 4, 12, 8, 12, 48, 8), ["security-baseline", "staging"], ["テスト"]),
    f("uat-support", "qa", "受入テスト支援", "顧客確認用シナリオ、説明、修正管理を行います。", h(12, 4, 8, 8, 4, 0, 40, 16), ["staging", "documentation-training"], ["受入"]),

    f("project-management", "management", "プロジェクト管理", "進捗、課題、変更、品質、会議、意思決定を管理します。", h(12, 0, 0, 0, 0, 0, 4, 56), ["requirements"], ["管理", "必須"]),
    f("documentation-training", "management", "操作説明・マニュアル", "管理者向け説明、利用手順、運用ルールを整備します。", h(12, 8, 8, 8, 4, 4, 16, 20), ["requirements"], ["導入"]),
    f("release-management", "management", "リリース管理", "公開判定、変更内容、切戻し、周知を管理します。", h(8, 0, 4, 4, 4, 12, 16, 24), ["cicd", "uat-support"], ["公開"]),
    f("support-operation", "management", "保守・問い合わせ運用", "問い合わせ、障害、改善要望、定期点検の流れを整えます。", h(16, 0, 8, 8, 4, 8, 16, 32), ["monitoring", "documentation-training"], ["保守"]),
  ];

  // DATABANK「価格表 機能別マスタ」（作成日 2026-06-29）との対応表。
  // 原本に直接対応する34項目は提示単価を維持する。
  const priceMasterMeta = {
    name: "価格表 機能別マスタ",
    createdAt: "2026-06-29",
    maintenanceRate: 10,
  };

  const priceMasterByFeature = {
    requirements: { priceSize: "S", fixedPrice: 50000, priceSourceName: "企画・要件定義" },
    "information-architecture": { priceSize: "S", fixedPrice: 40000, priceSourceName: "情報設計（IA）" },
    wireframes: { priceSize: "S", fixedPrice: 50000, priceSourceName: "ワイヤーフレーム" },
    "design-system": { priceSize: "M", fixedPrice: 100000, priceSourceName: "デザインシステム" },
    "responsive-shell": { priceSize: "M", fixedPrice: 80000, priceSourceName: "レスポンシブ対応" },
    "theme-ui": { priceSize: "S", fixedPrice: 50000, priceSourceName: "ダークモード対応" },
    "accessibility-ui": { priceSize: "M", fixedPrice: 70000, priceSourceName: "アクセシビリティ対応" },
    "i18n-ui": { priceSize: "M", fixedPrice: 100000, priceSourceName: "多言語UI対応" },
    "list-detail-ui": { priceSize: "S", fixedPrice: 60000, priceSourceName: "情報表示・一覧" },
    "notification-center": { priceSize: "S", fixedPrice: 40000, priceSourceName: "お知らせ配信" },
    "form-ui": { priceSize: "S", fixedPrice: 40000, priceSourceName: "お問い合わせフォーム" },
    "email-login": { priceSize: "M", fixedPrice: 120000, priceSourceName: "会員登録・ログイン" },
    "social-login": { priceSize: "M", fixedPrice: 80000, priceSourceName: "SNSログイン連携" },
    "db-foundation": { priceSize: "M", fixedPrice: 150000, priceSourceName: "データベース連携" },
    "advanced-search-ui": { priceSize: "M", fixedPrice: 100000, priceSourceName: "検索・絞り込み" },
    "customer-portal-ui": { priceSize: "M", fixedPrice: 100000, priceSourceName: "マイページ・プロフィール" },
    "payment-integration": { priceSize: "M", fixedPrice: 200000, priceSourceName: "決済機能" },
    subscription: { priceSize: "M", fixedPrice: 250000, priceSourceName: "サブスク課金" },
    "booking-flow": { priceSize: "M", fixedPrice: 200000, priceSourceName: "予約・注文フロー" },
    "push-notification": { priceSize: "M", fixedPrice: 80000, priceSourceName: "プッシュ通知" },
    "admin-ui": { priceSize: "M", fixedPrice: 250000, priceSourceName: "管理画面（運営用）" },
    "image-upload": { priceSize: "M", fixedPrice: 100000, priceSourceName: "画像添付" },
    "video-upload": { priceSize: "L", fixedPrice: 180000, priceSourceName: "動画添付" },
    "import-export": { priceSize: "M", fixedPrice: 80000, priceSourceName: "ダウンロード（CSV）" },
    "pdf-generator": { priceSize: "M", fixedPrice: 120000, priceSourceName: "ダウンロード（PDF）" },
    geolocation: { priceSize: "L", fixedPrice: 250000, priceSourceName: "位置情報連携" },
    "role-permissions": { priceSize: "L", fixedPrice: 200000, priceSourceName: "複雑な権限管理" },
    "external-api": { priceSize: "L", fixedPrice: 300000, dependencyPrice: 120000, pricingClass: "foundation", priceSourceName: "外部システム多数連携" },
    "native-app": { priceSize: "M×2", fixedPrice: 300000, priceSourceName: "iOS対応＋Android対応" },
    pwa: { priceSize: "M", fixedPrice: 120000, priceSourceName: "Webアプリ対応（PWA）" },
    "security-baseline": { priceSize: "M", fixedPrice: 150000, priceSourceName: "セキュリティ対策" },
    "web-deploy": { priceSize: "M", fixedPrice: 150000, priceSourceName: "インフラ構築" },
    "qa-baseline": { priceSize: "M", fixedPrice: 120000, pricingClass: "bundle", bundleIncludes: ["unit-tests", "integration-tests", "e2e-tests"], priceSourceName: "テスト・QA" },
    "release-management": { priceSize: "S", fixedPrice: 50000, priceSourceName: "ストア申請・公開対応" },
  };

  const assessed = (priceSize, fixedPrice, closest, priceBasis, priceIntent, extra = {}) => ({
    priceSize,
    fixedPrice,
    priceStatus: "assessed",
    priceSourceName: `査定単価（類似：${closest}）`,
    priceBasis,
    priceIntent,
    pricingClass: "atomic",
    ...extra,
  });

  // 3者検証（相場調査・全項目査定・依存監査）に基づく補完単価。
  // 原本価格ではないため、priceStatus=assessed として画面・CSVで区別する。
  const assessedPriceByFeature = {
    "domain-research": assessed("S", 50000, "企画・要件定義", "調査・整理を行う上流作業が近く、S帯中央値と一致。", "要件定義に追加する業界・法令調査枠として計上する。"),
    architecture: assessed("S", 60000, "企画・要件定義", "共通設計作業であり、公開料金の設計帯とS上限を参照。", "複数機能から使う全体構成だけを計上し、個別実装との重複を避ける。", { pricingClass: "foundation" }),
    "dashboard-ui": assessed("M", 100000, "管理画面", "集計画面の公開価格帯8〜15万円と既存管理画面25万円を参照。", "集計基盤とグラフは別項目とし、配置・表示ロジックだけを計上する。"),
    "charts-ui": assessed("M", 70000, "情報表示・一覧", "一覧6万円より描画・軸・凡例対応が増えるためM下限。", "API基盤を別計上し、グラフ表示固有の追加分に限定する。"),
    "calendar-ui": assessed("M", 80000, "検索・絞り込み", "標準UIの8〜12万円帯と日付操作の複雑さを参照。", "予約ロジックを含めず、日・週・月の表示操作だけを計上する。"),
    "rich-editor-ui": assessed("M", 80000, "UIコンポーネント設計", "再利用UI部品8万円と同水準。", "エディタ組込み・画像・表・装飾・保存形式対応を対象にする。"),
    "api-foundation": assessed("S", 60000, "データベース連携", "多数機能から共用される基盤のため、単独API価格より低いS上限。", "個別API処理は各機能側で計上し、共通検証・エラー処理だけを一度計上する。", { pricingClass: "foundation" }),
    "business-rules": assessed("M", 100000, "検索・絞り込み", "標準的な業務ロジックの公開価格帯10〜20万円の下側。", "金額・期限・判定の実装と試験を対象にし、APIとデータ設計は別計上する。"),
    "workflow-engine": assessed("M", 120000, "予約・注文フロー", "状態遷移は標準業務機能の12〜20万円帯。", "履歴・計算基盤を別計上し、状態遷移管理そのものに限定する。"),
    "approval-flow": assessed("M", 150000, "複雑な権限管理", "差戻し・承認履歴を伴うため標準ワークフローより上。", "状態管理・権限・通知の依存価格と重ならない承認固有処理を計上する。"),
    "estimate-invoice": assessed("M", 180000, "決済機能", "税・値引き・明細計算は金額誤りリスクが高くM上位。", "PDF・マスタ・計算基盤を別計上し、見積請求ロジックに価格を置く。"),
    "product-catalog": assessed("M", 100000, "検索・絞り込み", "商品CRUDは標準業務画面の10万円帯。", "管理画面とマスタ管理を別計上し、商品・価格・公開状態の処理に限定する。"),
    inventory: assessed("L", 180000, "予約・注文フロー", "引当・棚卸・入出庫の整合性管理はL下限相当。", "商品台帳と履歴を別計上し、在庫固有の整合性処理を評価する。"),
    ecommerce: assessed("L", 300000, "マッチングロジック", "カート・注文・配送状態をまたぐ大規模業務機能でL中央値。", "商品・在庫・決済・顧客画面を明細化した上で注文固有部分を計上する。"),
    crm: assessed("M", 200000, "管理画面", "顧客・商談・履歴の関係管理はM上位。", "共通画面と履歴機構を除いた顧客案件業務の複雑さを評価する。"),
    "report-generator": assessed("M", 150000, "PDF出力", "帳票公開価格10万円〜に差込み・改ページ・表配置を加味。", "PDF変換単体を別計上し、テンプレート生成固有の作業を計上する。"),
    "scheduled-jobs": assessed("M", 70000, "プッシュ通知", "単純バッチの公開価格15万円〜を、共通キュー別計上で抑制。", "スケジュール登録と実行管理に限定しM下限とする。"),
    "schema-design": assessed("S", 60000, "データベース連携", "多数機能から自動追加される共通設計のためS上限。", "DB環境と個別ロジックを別計上し、テーブル・関係・制約設計だけを一度計上する。", { pricingClass: "foundation" }),
    "master-data": assessed("M", 80000, "管理画面", "選択肢・単価管理は標準CRUDの8〜12万円帯。", "フォームと管理画面を別計上し、マスタ処理固有部分に限定する。"),
    "history-versioning": assessed("M", 100000, "セキュリティ対策", "差分保存・変更者・復元は標準データ機能より高い。", "認証とデータ設計を別計上し、履歴・版管理固有の処理を評価する。"),
    "file-storage": assessed("M", 70000, "画像添付", "保管処理は添付UI10万円より軽くM下限。", "添付画面・公開環境・セキュリティを別計上し、権限付き保管だけを計上する。", { pricingClass: "foundation" }),
    "search-index": assessed("M", 80000, "検索・絞り込み", "索引生成は検索機能10万円の基盤部分。", "検索画面を別計上し、索引の作成・更新処理に限定する。"),
    "analytics-store": assessed("M", 90000, "データベース連携", "集計履歴と分析用構造は標準DB機能の中位。", "DB基盤・定期処理・表示画面を別計上する。"),
    "backup-restore": assessed("M", 80000, "インフラ構築", "公開事業者の単純設定5.5万円と復元確認を考慮。", "DB・監視・DRを別計上し、バックアップ設定と復元確認に限定する。", { pricingClass: "foundation" }),
    "data-migration": assessed("M", 160000, "CSVダウンロード", "検査・変換・欠損対応・照合が必要なため入出力8万円の2倍。", "標準的なデータ量を前提とし、件数・品質で別途補正する。"),
    "user-accounts": assessed("M", 70000, "会員登録・ログイン", "登録・停止・退会データ処理は認証12万円の基盤部分。", "ログインUIとセッションを別計上し、アカウント管理だけを評価する。", { pricingClass: "foundation" }),
    "session-security": assessed("S", 40000, "会員登録・ログイン", "複数認証方式から共用されるためS帯。", "期限切れ・ログアウト・端末管理の共通部分だけを一度計上する。", { pricingClass: "foundation" }),
    mfa: assessed("M", 80000, "SNSログイン連携", "認証方式を1つ追加する既存単価8万円と同水準。", "通知とセッションを別計上し、多要素認証固有部分を計上する。"),
    "organization-tenancy": assessed("L", 250000, "複雑な権限管理", "データ混在が重大事故になるためL中位。", "会社境界の設計・実装・境界試験へ重点配分する。"),
    "external-portal-access": assessed("M", 150000, "複雑な権限管理", "招待・期限・対象データ制限が必要なM上位。", "権限管理と監査ログを別計上し、社外アクセス固有部分を評価する。"),
    "audit-log": assessed("M", 90000, "セキュリティ対策", "証跡保存・検索・改ざん防止を含む標準セキュリティ機能。", "複数機能から共用されるためM中位に抑え一度だけ計上する。", { pricingClass: "foundation" }),
    "security-review": assessed("M", 100000, "セキュリティ対策", "公開価格と専門レビュー工程の標準帯。", "基本設計と試験を別計上し、第三者確認と是正に限定する。"),
    "file-upload": assessed("M", 70000, "画像添付", "汎用文書添付は画像プレビュー・並替えより軽い。", "保管とAPIを別計上し、アップロードUIと失敗処理に限定する。"),
    "image-processing": assessed("S", 60000, "画像添付", "画像添付から自動追加される補助処理としてS上限。", "保管・非同期基盤を別計上し、圧縮とサムネイル生成だけを評価する。"),
    "camera-capture": assessed("S", 60000, "画像添付", "カメラ起動と登録導線は画像添付の追加機能。", "画像添付とレスポンシブを別計上し、撮影導線だけを計上する。"),
    "offline-sync": assessed("L", 300000, "外部システム多数連携", "競合解決・再送・端末保存・障害試験を伴う高難度L機能。", "通信不安定時のデータ損失リスクを価格へ反映する。"),
    webhooks: assessed("M", 70000, "外部システム多数連携", "単一連携の署名検証・冪等性・再送はM下限。", "外部API共通基盤とキューを別計上しWebhook固有部分に限定する。"),
    "email-integration": assessed("S", 40000, "お知らせ配信", "テンプレート送信・再送は既存お知らせ4万円と同水準。", "キューと通知管理を別計上し、単一メールサービス接続に限定する。"),
    "sms-integration": assessed("S", 50000, "プッシュ通知", "単一SMSサービス接続はS中央値。", "外部API共通基盤とキューを別計上し、SMS固有処理に限定する。"),
    "messaging-integration": assessed("M", 80000, "プッシュ通知", "単一チャットサービスへの通知は既存通知8万円と同水準。", "多数連携ではなく1サービスの通知・共有URL送付を前提にする。"),
    "accounting-integration": assessed("L", 180000, "外部システム多数連携", "金額データの同期・照合を伴うためL下限。", "単一会計サービス前提とし、多数連携は別補正する。"),
    "maps-integration": assessed("M", 80000, "位置情報連携", "住所検索・座標取得のAPI部分は位置情報25万円より軽い。", "位置情報画面と外部API共通基盤を別計上する。"),
    "calendar-integration": assessed("M", 150000, "外部システム多数連携", "双方向同期・重複・変更処理の複雑さをM上位で評価。", "単一カレンダーサービスを標準条件とする。"),
    "esign-integration": assessed("L", 220000, "外部システム多数連携", "証跡・文書・Webhookを伴う重要連携でL中位。", "単一電子契約サービス前提で、法的証跡リスクを反映する。"),
    staging: assessed("S", 40000, "インフラ構築", "本番環境に追加する補助環境としてS帯。", "本番公開基盤を別計上し、追加設定分だけを計上する。", { pricingClass: "foundation" }),
    cicd: assessed("M", 70000, "インフラ構築", "ビルド・検査・配備自動化は公開料金の8〜15万円帯。", "検証環境と単体テストを別計上し、パイプライン構築に限定する。", { pricingClass: "foundation" }),
    monitoring: assessed("S", 50000, "インフラ構築", "公開クラウド基本設定5.5万円と同水準。", "複数項目から共用する基本アラート設定を一度だけ計上する。", { pricingClass: "foundation" }),
    "error-tracking": assessed("S", 30000, "インフラ構築", "監視導入済み前提の追加設定としてS下限。", "エラー収集・通知・原因追跡の追加分だけを計上する。", { pricingClass: "foundation" }),
    cdn: assessed("S", 40000, "インフラ構築", "単純CDN設定はS帯。", "公開環境と監視を別計上し、キャッシュ方針の追加分だけを評価する。", { pricingClass: "foundation" }),
    "queue-worker": assessed("S", 60000, "インフラ構築", "多数機能から共用される非同期基盤のためS上限。", "個別ジョブ処理は各機能側へ置き、再試行基盤だけを一度計上する。", { pricingClass: "foundation" }),
    "scalable-infra": assessed("L", 180000, "インフラ構築", "負荷分散・拡張設計・検証を含むためL下限。", "CDN・キュー・監視を別計上し、拡張構成固有の作業を評価する。"),
    "disaster-recovery": assessed("L", 180000, "インフラ構築", "RTO/RPO・切替・復旧訓練を含むためL下限。", "バックアップと検証環境を別計上し、復旧計画・訓練を対象にする。"),
    "unit-tests": assessed("S", 40000, "テスト・QA", "標準QA12万円の一構成要素としてS帯。", "単独採用時の価格を持たせ、QA一式採用時は内包して重複請求しない。"),
    "integration-tests": assessed("S", 60000, "テスト・QA", "API・DB接続確認は標準QAの一部としてS上限。", "単独採用時の価格を持たせ、QA一式採用時は内包する。"),
    "e2e-tests": assessed("S", 60000, "テスト・QA", "主要操作シナリオの自動化は標準QAの一部。", "単独採用時の価格を持たせ、QA一式採用時は内包する。"),
    "performance-tests": assessed("M", 80000, "テスト・QA", "専用シナリオ・負荷投入・分析が必要なM帯。", "拡張インフラを別計上し、性能検証工程だけを対象にする。"),
    "accessibility-tests": assessed("S", 30000, "アクセシビリティ対応", "実装対応7万円とは別の確認工程としてS下限。", "読み上げ・キーボード・コントラスト試験だけを計上する。"),
    "security-tests": assessed("M", 80000, "セキュリティ対策", "権限・入力・ライブラリ・設定試験はM帯。", "基本設計を別計上し、検査と報告に限定する。"),
    "uat-support": assessed("M", 70000, "テスト・QA", "顧客向けシナリオ・説明・指摘管理はM下限。", "実試験と環境を別計上し、受入支援に限定する。"),
    "project-management": assessed("M", 80000, "企画・要件定義", "小中規模案件の固定PM枠としてM下限。", "基本進行管理の参考額とし、大規模案件では開発小計10〜15%で再校正する。"),
    "documentation-training": assessed("M", 70000, "静的ページ", "文書作成に説明会・運用ルール整備を加えM下限。", "操作マニュアルと管理者説明の導入作業を対象にする。"),
    "support-operation": assessed("M", 70000, "インフラ構築", "問い合わせ・障害対応フローの初期設計はM下限。", "年間保守10%とは分離し、初期の運用設計だけを計上する。", { pricingClass: "service-setup" }),
  };

  features.forEach((feature) => {
    const masterPrice = priceMasterByFeature[feature.id];
    const assessedPrice = assessedPriceByFeature[feature.id];
    Object.assign(feature, masterPrice || assessedPrice);
    if (!feature.priceStatus) feature.priceStatus = "master";
    if (!feature.pricingClass) feature.pricingClass = "atomic";
    if (!feature.priceBasis) feature.priceBasis = `DATABANK原本「${feature.priceSourceName}」の提示単価。`;
    if (!feature.priceIntent) feature.priceIntent = "ユーザー提示の原本価格を変更せず、そのまま採用する。";
  });

  // 難易度指数は価格とは独立した比較指標。fixedPrice / priceSize は変更しない。
  const mandatoryFeatureIds = [
    "requirements",
    "architecture",
    "security-baseline",
    "qa-baseline",
    "project-management",
    "release-management",
  ];
  const mandatoryReasons = {
    requirements: "目的・範囲・受入条件を決める工程です。",
    architecture: "全体構成とデータの考え方を決める工程です。",
    "security-baseline": "入力・通信・アクセスの基本的な安全対策です。",
    "qa-baseline": "完成条件を確認する標準の品質保証工程です。",
    "project-management": "進捗・課題・変更・顧客確認を管理する工程です。",
    "release-management": "公開判定・変更内容・切戻しを管理する工程です。",
  };

  // QAとリリース管理は横断工程であり、選択済みの機能を確認・公開する。
  // これ自体を固定しただけで、画面・DB・CI/CD等を強制しない。
  const qaBaseline = features.find((feature) => feature.id === "qa-baseline");
  const releaseManagement = features.find((feature) => feature.id === "release-management");
  if (qaBaseline) {
    qaBaseline.dependencies = [];
    qaBaseline.bundleIncludes = ["unit-tests", "integration-tests", "e2e-tests"];
  }
  if (releaseManagement) releaseManagement.dependencies = [];

  features.forEach((feature) => {
    const totalHours = Object.values(feature.hours || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    const difficultyIndex = totalHours <= 70 ? 1 : totalHours <= 110 ? 2 : totalHours <= 160 ? 3 : totalHours <= 230 ? 4 : 5;
    feature.difficultyIndex = difficultyIndex;
    feature.difficultyLabel = ({ 1: "基本", 2: "標準", 3: "高度", 4: "複雑", 5: "最難" })[difficultyIndex];
    feature.difficultyReason = `参考工数${totalHours}時間、状態数・整合性・外部連携・失敗時影響を比較した指数です。価格は変更しません。`;
  });

  const plainLayers = {
    planning: "何を作るか決める", frontend: "利用者が見る・入力する", backend: "仕事の流れや計算を動かす",
    data: "情報を保存・探す", security: "安全にログイン・使い分ける", mobile: "現場やスマホで使う",
    integration: "他のサービスとつなぐ", infra: "公開後も止めずに動かす", qa: "正しく動くか確かめる",
    management: "導入して使い続ける",
  };

  const plainNames = {
    "requirements": "やりたいことと対象範囲を整理する", "domain-research": "業界ルールや法律を確認する",
    "architecture": "全体の作り方を決める", "information-architecture": "画面とメニューの並びを決める",
    "wireframes": "画面の下書きを作る", "design-system": "色・文字・ボタンの見た目をそろえる",
    "responsive-shell": "パソコンとスマホの両方で使う", "list-detail-ui": "情報を一覧で見て詳細を開く",
    "form-ui": "画面から情報を入力・修正する", "advanced-search-ui": "条件を指定して情報を探す",
    "dashboard-ui": "状況をひと目で確認する", "charts-ui": "数字をグラフで見る",
    "calendar-ui": "予定をカレンダーで見る", "rich-editor-ui": "写真や表を含む文章を作る",
    "customer-portal-ui": "お客様・協力会社専用の画面を用意する", "admin-ui": "管理者だけが使う設定画面を用意する",
    "accessibility-ui": "見やすさ・操作しやすさに配慮する", "i18n-ui": "複数の言語で使う",
    "theme-ui": "会社ごとにロゴや色を変える", "api-foundation": "画面と保存した情報をつなぐ",
    "business-rules": "金額・期限・判定を自動計算する", "workflow-engine": "下書き・確認中・完了を管理する",
    "approval-flow": "申請・承認・差戻しを行う", "notification-center": "アプリ内でお知らせを受け取る",
    "estimate-invoice": "見積・請求・税・値引きを計算する", "booking-flow": "予約・変更・キャンセルを受け付ける",
    "product-catalog": "商品・サービスと価格を登録する", "inventory": "在庫の増減と残数を管理する",
    "ecommerce": "商品を選び注文する", "subscription": "月額・年額で継続課金する",
    "crm": "顧客・案件・対応履歴をまとめる", "report-generator": "登録内容から報告書を作る",
    "pdf-generator": "見積書や報告書をPDFにする", "scheduled-jobs": "決まった時刻に通知・集計する",
    "import-export": "Excel・CSVを取り込む・書き出す", "db-foundation": "入力した情報を保存する",
    "schema-design": "保存する項目と関係を決める", "master-data": "分類・単価・選択肢を後から変更する",
    "history-versioning": "変更前の内容と変更者を残す", "file-storage": "写真・文書を安全に保管する",
    "search-index": "大量の文章から素早く探す", "analytics-store": "集計用の情報をためる",
    "backup-restore": "消えた情報を戻せるようにする", "data-migration": "今使っているデータを移す",
    "security-baseline": "安全に使うための基本ルールを決める", "user-accounts": "利用者を登録・停止する",
    "session-security": "ログイン状態を安全に保つ", "email-login": "メールアドレスでログインする",
    "social-login": "Googleなどのアカウントでログインする", "mfa": "確認コードで本人確認を強める",
    "role-permissions": "役割ごとに見える情報を変える", "organization-tenancy": "会社ごとに情報を分ける",
    "external-portal-access": "社外の人には関係する情報だけ見せる", "audit-log": "重要な操作の記録を残す",
    "security-review": "外部の目で安全性を確認する", "file-upload": "文書や写真を添付する",
    "image-upload": "複数の写真を選び並べ替える", "image-processing": "写真を自動で軽く・見やすくする",
    "camera-capture": "その場で写真を撮って登録する", "video-upload": "動画を添付して再生する",
    "pwa": "ホーム画面からアプリのように開く", "offline-sync": "通信がなくても入力し、後で送る",
    "native-app": "アプリストアで配布する", "push-notification": "スマホへ通知を出す",
    "geolocation": "現在地・住所・地図を使う", "external-api": "他サービスと情報をやり取りする準備をする",
    "webhooks": "他サービスの更新をすぐ受け取る", "email-integration": "メールを自動送信する",
    "sms-integration": "SMSを自動送信する", "messaging-integration": "普段使うチャットへ通知する",
    "payment-integration": "クレジットカード等で支払う", "accounting-integration": "会計ソフトへ請求・入金を渡す",
    "maps-integration": "住所検索・地図・経路を使う", "calendar-integration": "外部カレンダーと予定を合わせる",
    "esign-integration": "契約書を送り電子署名してもらう", "web-deploy": "インターネット上で使えるように公開する",
    "staging": "公開前にお客様が確認する場所を用意する", "cicd": "更新版を安全に公開する",
    "monitoring": "停止や遅れを見つけて知らせる", "error-tracking": "エラーの原因を追えるようにする",
    "cdn": "写真やファイルを速く表示する", "queue-worker": "時間がかかる処理を順番に実行する",
    "scalable-infra": "利用者が増えても動くようにする", "disaster-recovery": "障害が起きても決めた時間で復旧する",
    "unit-tests": "計算や入力チェックを自動で確かめる", "integration-tests": "画面から保存まで正しくつながるか確かめる",
    "e2e-tests": "実際の操作手順を自動で確かめる", "qa-baseline": "基本的な動作確認を一通り行う",
    "performance-tests": "大勢で使っても遅くならないか確かめる", "accessibility-tests": "見やすさ・操作しやすさを確かめる",
    "security-tests": "不正な操作や設定漏れがないか確かめる", "uat-support": "お客様の確認作業を支援する",
    "project-management": "進み具合・課題・変更を管理する", "documentation-training": "操作説明とマニュアルを用意する",
    "release-management": "公開する版と切戻し手順を管理する", "support-operation": "公開後の問い合わせ・障害に対応する",
  };

  features.forEach((feature) => { feature.plainName = plainNames[feature.id] || feature.name; });

  const questions = [
    {
      id: "audience",
      title: "誰が使いますか？",
      help: "使う人をすべて選んでください。人によって見せる内容や入口が変わります。",
      choices: [
        { id: "staff", label: "社内スタッフ", features: ["responsive-shell", "email-login", "role-permissions"] },
        { id: "partners", label: "取引先・協力会社", features: ["customer-portal-ui", "external-portal-access"] },
        { id: "customers", label: "一般顧客", features: ["customer-portal-ui", "email-login"] },
        { id: "many-companies", label: "複数企業へ提供", features: ["organization-tenancy", "theme-ui"] },
      ],
    },
    {
      id: "device",
      title: "どこで使いますか？",
      help: "事務所、屋外、移動中など、実際に使う場所を選んでください。",
      choices: [
        { id: "web", label: "PC・スマホのブラウザ", features: ["responsive-shell", "web-deploy"] },
        { id: "field", label: "屋外・現場", features: ["pwa", "camera-capture"] },
        { id: "offline", label: "通信が切れても使う", features: ["offline-sync"] },
        { id: "store", label: "アプリストアで配布", features: ["native-app", "push-notification"] },
      ],
    },
    {
      id: "data",
      title: "入力した情報をどう使いたいですか？",
      help: "情報を入力した後、どのように探し、残し、引き継ぎたいかを選んでください。",
      choices: [
        { id: "records", label: "入力して、一覧や詳細を見たい", features: ["list-detail-ui", "form-ui"] },
        { id: "search", label: "条件を指定してすぐ探したい", features: ["advanced-search-ui"] },
        { id: "history", label: "誰が何を変えたか後から確認したい", features: ["history-versioning", "audit-log"] },
        { id: "excel", label: "今あるExcel・CSVの内容を引き継ぎたい", features: ["import-export", "data-migration"] },
      ],
    },
    {
      id: "media",
      title: "写真や書類をどう扱いたいですか？",
      help: "現場での撮影、複数枚の保存、動画の有無を選んでください。",
      choices: [
        { id: "files", label: "文書を添付", features: ["file-upload"] },
        { id: "photos", label: "写真を複数添付", features: ["image-upload"] },
        { id: "camera", label: "その場で撮影", features: ["camera-capture"] },
        { id: "video", label: "動画を添付", features: ["video-upload"] },
      ],
    },
    {
      id: "workflow",
      title: "仕事の進み方を管理しますか？",
      help: "仕事が始まってから完了するまで、管理したい流れを選んでください。",
      choices: [
        { id: "status", label: "下書き・対応中・完了", features: ["workflow-engine"] },
        { id: "approval", label: "上司や顧客の承認", features: ["approval-flow"] },
        { id: "schedule", label: "予約・日程管理", features: ["booking-flow"] },
        { id: "project", label: "顧客・案件・対応履歴", features: ["crm"] },
      ],
    },
    {
      id: "money",
      title: "金額や取引を扱いますか？",
      help: "見積、支払い、継続契約など、お金に関するやりたいことを選んでください。",
      choices: [
        { id: "estimate", label: "見積・請求書", features: ["estimate-invoice"] },
        { id: "payment", label: "オンライン決済", features: ["payment-integration"] },
        { id: "subscription", label: "月額・年額の継続課金", features: ["subscription"] },
        { id: "order", label: "商品・在庫・注文", features: ["ecommerce"] },
      ],
    },
    {
      id: "output",
      title: "作った内容をどう見せたいですか？",
      help: "お客様に渡す書類、写真付き報告、集計画面などを選んでください。",
      choices: [
        { id: "pdf", label: "印刷できる書類として保存したい", features: ["pdf-generator"] },
        { id: "report", label: "写真付きの報告書を渡したい", features: ["report-generator", "image-upload"] },
        { id: "dashboard", label: "数字のまとめや変化を画面で見たい", features: ["dashboard-ui"] },
        { id: "export", label: "集めた情報をExcel・CSVで渡したい", features: ["import-export"] },
      ],
    },
    {
      id: "communication",
      title: "必要な連絡をどう届けたいですか？",
      help: "相手と連絡する方法や、日程をいつものカレンダーと合わせるかを選んでください。",
      choices: [
        { id: "email", label: "メールで連絡したい", features: ["notification-center", "email-integration"] },
        { id: "push", label: "スマホの画面にお知らせを出したい", features: ["push-notification"] },
        { id: "message", label: "いつものチャットに連絡したい", features: ["messaging-integration"] },
        { id: "calendar", label: "いつものカレンダーに日程を反映したい", features: ["calendar-integration"] },
      ],
    },
    {
      id: "governance",
      title: "安心して使うために何が必要ですか？",
      help: "管理者に任せたいこと、後から確認したいこと、問題時の備えを選んでください。",
      choices: [
        { id: "admin", label: "管理者が利用者や選択肢を変えたい", features: ["admin-ui", "master-data"] },
        { id: "audit", label: "誰がいつ何をしたか後から確認したい", features: ["audit-log"] },
        { id: "security", label: "不正利用や情報漏えいを防げるか確かめたい", features: ["security-review"] },
        { id: "recovery", label: "問題が起きても情報を戻して再開したい", features: ["disaster-recovery"] },
      ],
    },
    {
      id: "delivery",
      title: "使い始める前後にどんな支援が必要ですか？",
      help: "使い始める前の確認、使い方の説明、開始後の相談対応から選んでください。",
      choices: [
        { id: "standard-qa", label: "主な操作が正しく動くか確かめたい", features: ["qa-baseline"] },
        { id: "performance", label: "多くの人が使っても待たずに使いたい", features: ["performance-tests"] },
        { id: "manual", label: "使い方の説明会と手順書を用意したい", features: ["documentation-training", "uat-support"] },
        { id: "support", label: "使い始めた後も相談や修正を依頼したい", features: ["support-operation", "release-management"] },
      ],
    },
  ];

  const presets = [
    { id: "business-web", name: "社内業務管理", features: ["project-management", "list-detail-ui", "form-ui", "advanced-search-ui", "email-login", "role-permissions", "admin-ui", "qa-baseline", "release-management"] },
    { id: "customer-service", name: "顧客向けWebサービス", features: ["project-management", "customer-portal-ui", "email-login", "notification-center", "email-integration", "admin-ui", "qa-baseline", "security-review", "release-management"] },
    { id: "field-photo", name: "現場写真・報告", features: ["project-management", "pwa", "camera-capture", "offline-sync", "workflow-engine", "report-generator", "pdf-generator", "role-permissions", "qa-baseline", "release-management"] },
    { id: "booking", name: "予約サービス", features: ["project-management", "booking-flow", "customer-portal-ui", "email-login", "payment-integration", "admin-ui", "qa-baseline", "release-management"] },
    { id: "saas", name: "複数社向けSaaS", features: ["project-management", "organization-tenancy", "subscription", "admin-ui", "dashboard-ui", "security-review", "performance-tests", "release-management"] },
  ];

  const rateProfiles = {
    company: {
      name: "中小規模システム会社",
      contingency: 0,
      rates: { planning: 0, design: 0, frontend: 0, backend: 0, data: 0, infra: 0, qa: 0, pm: 0 },
    },
  };

  // 見積画面の操作用ツリー。技術的な必須依存（features.dependencies）とは分離する。
  // 親を外すと配下を一括解除でき、末端機能は個別に増減できる。
  const featureHierarchy = [
    { id: "planning", name: "何を作るか決める", groups: [
      { id: "planning-research", name: "目的・範囲・ルールを整理する", features: ["requirements", "domain-research"] },
      { id: "planning-design", name: "画面と全体の形を決める", features: ["architecture", "information-architecture", "wireframes", "design-system"] },
    ] },
    { id: "frontend", name: "利用者が見る・入力する", groups: [
      { id: "frontend-basic", name: "情報を見て入力・検索する", features: ["responsive-shell", "list-detail-ui", "form-ui", "advanced-search-ui"] },
      { id: "frontend-visual", name: "状況・予定・文章を見やすくする", features: ["dashboard-ui", "charts-ui", "calendar-ui", "rich-editor-ui"] },
      { id: "frontend-portal", name: "利用者ごとの専用画面を用意する", features: ["customer-portal-ui", "admin-ui"] },
      { id: "frontend-coverage", name: "より多くの人・会社で使えるようにする", features: ["accessibility-ui", "i18n-ui", "theme-ui"] },
    ] },
    { id: "backend", name: "仕事の流れや計算を動かす", groups: [
      { id: "backend-core", name: "計算・進み具合・承認を自動化する", features: ["api-foundation", "business-rules", "workflow-engine", "approval-flow", "notification-center"] },
      { id: "backend-transaction", name: "予約・販売・顧客対応を管理する", features: ["estimate-invoice", "booking-flow", "product-catalog", "inventory", "ecommerce", "subscription", "crm"] },
      { id: "backend-output", name: "書類・集計・データ入出力を自動化する", features: ["report-generator", "pdf-generator", "scheduled-jobs", "import-export"] },
    ] },
    { id: "data", name: "情報を保存・探す", groups: [
      { id: "data-core", name: "入力した情報と変更履歴を残す", features: ["db-foundation", "schema-design", "master-data", "history-versioning"] },
      { id: "data-search", name: "写真・文書・集計情報を保管して探す", features: ["file-storage", "search-index", "analytics-store"] },
      { id: "data-operation", name: "今のデータを移し、消えても戻せるようにする", features: ["backup-restore", "data-migration"] },
    ] },
    { id: "security", name: "安全にログイン・使い分ける", groups: [
      { id: "security-login", name: "利用者を登録して本人確認する", features: ["security-baseline", "user-accounts", "session-security", "email-login", "social-login", "mfa"] },
      { id: "security-access", name: "人・役割・会社ごとに見せる範囲を変える", features: ["role-permissions", "organization-tenancy", "external-portal-access"] },
      { id: "security-audit", name: "重要な操作を残し、安全性を確認する", features: ["audit-log", "security-review"] },
    ] },
    { id: "mobile", name: "現場やスマホで使う", groups: [
      { id: "mobile-file", name: "文書・写真・動画を登録する", features: ["file-upload", "image-upload", "image-processing", "camera-capture", "video-upload"] },
      { id: "mobile-app", name: "屋外や移動中でも使えるようにする", features: ["pwa", "offline-sync", "native-app", "push-notification", "geolocation"] },
    ] },
    { id: "integration", name: "他のサービスとつなぐ", groups: [
      { id: "integration-core", name: "メール・SMS・チャットで知らせる", features: ["external-api", "webhooks", "email-integration", "sms-integration", "messaging-integration"] },
      { id: "integration-business", name: "決済・会計・地図・契約とつなぐ", features: ["payment-integration", "accounting-integration", "maps-integration", "calendar-integration", "esign-integration"] },
    ] },
    { id: "infra", name: "公開後も止めずに動かす", groups: [
      { id: "infra-release", name: "確認してから安全に公開する", features: ["web-deploy", "staging", "cicd"] },
      { id: "infra-operation", name: "停止・エラー・重い処理に対応する", features: ["monitoring", "error-tracking", "queue-worker"] },
      { id: "infra-scale", name: "利用増加や障害に備える", features: ["cdn", "scalable-infra", "disaster-recovery"] },
    ] },
    { id: "qa", name: "正しく動くか確かめる", groups: [
      { id: "qa-standard", name: "基本的な操作と計算を確かめる", features: ["unit-tests", "integration-tests", "e2e-tests", "qa-baseline"] },
      { id: "qa-special", name: "速度・安全性・使いやすさを確かめる", features: ["performance-tests", "accessibility-tests", "security-tests", "uat-support"] },
    ] },
    { id: "management", name: "導入して使い続ける", groups: [
      { id: "management-delivery", name: "進行・説明・公開後の対応を行う", features: ["project-management", "documentation-training", "release-management", "support-operation"] },
    ] },
  ];

  return { layers, plainLayers, plainNames, roles, features, questions, presets, rateProfiles, featureHierarchy, priceMasterMeta, mandatoryFeatureIds, mandatoryReasons };
});
