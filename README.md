# slack-moneyBot

家計簿を管理するSlackのbot。　

Google Spread Sheetと連携して、Slackからカテゴリーや金額等を入力するとシートに記載される仕組みになっている。

## 作った経緯
- 同居人がいるが、家賃と光熱費以外は各々で生計を立てている
  - 日々の食費等で「とりあえず払っておくけど後で返してね」というシチュエーションが多かった
  - レシートなどを取っておいて後から上記の返済額を計算する手間が面倒だった
  - お互いの家計簿をオープンにし、ある程度の経済状況を把握したかった

## 使用技術など
- Google Apps Script(GAS)
  - ウェブアプリケーションとして公開し、slackからアクセスできるようにしている
- Slack
  - Outgoing Webhook(GASへのアクセス用)
  - Incoming Webhooks(スプレッドシートの更新成功の通知用)
- Google Apps Script GitHub アシスタント
  - GASとGitの連携を容易にするChrome拡張機能
