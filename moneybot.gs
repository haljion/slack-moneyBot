// 変数
var type = PropertiesService.getScriptProperties().getProperty('TYPE').split("!");// 種別
var OFolder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('OUTPUT_FOLDER'));// 出力フォルダ

// アップデート情報
var updateMsg = "2020/07/13：\n・精算額が0円かつ日付を指定した際、\"精算分\"列及び清算シートへの記入が行われないようにしました。\n"
+ "・\"update\"コマンドでアップデート情報を表示できるようにしました";

// Slack 応答処理
function doPost(e) {
  // Bot User OAuth Access Token
  var token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');
  // Outgoing WebHooks のToken
  var verifyToken = PropertiesService.getScriptProperties().getProperty('VERIFY_TOKEN');
  
  if (verifyToken != e.parameter.token) {
    throw new Error("invalid token.");
  }
  
  // 実行された月日を取得
  var today = new Date();
  var month = today.getMonth() + 1;
  var date = today.getDate();
  
  // Slackに応答するメッセージ
  var message = "";
  
  // 該当月のファイルが存在しない場合、新規作成する
  var fileName = "家計簿_" + month + "月";
  var files = OFolder.getFilesByName(fileName);
  var file;
  if(!files.hasNext()){
    file = createSS(fileName);
    message = month + "月のファイルを作成しました。\n"
  } else {
    file = files.next();
  }
  var ss = SpreadsheetApp.openById(file.getId());
  
  
  var datas = e.parameter.text.split("！");
  var dataLength = datas.length;
  
  // スプレッドシートにデータを入力する処理
  switch(datas[0]){
    case "支出":
      if(5 <= dataLength && dataLength <= 7
         && 1 <= datas[1] && datas[1] <= 5 
         && 1 <= datas[2] && datas[2] <= 11){
        
        var sheetNum = datas[1] - 1;
        var sheet = ss.getSheets()[sheetNum];
        var next_row = sheet.getLastRow() + 1;
        // 精算シート
        var payoff_sheet = ss.getSheets()[7];
        
        sheet.getRange("D" + next_row).setValue(type[datas[2] - 1]);// 種別
        sheet.getRange("C" + next_row).setValue(datas[3]);// 内容
        sheet.getRange("E" + next_row).setValue(datas[4]);// 値段
        sheet.getRange("B" + next_row).setValue(month + "/" + date);// 今日
        
        if(dataLength >= 6) {
          
          // 清算なし・日付指定
          if(dataLength == 7 && datas[5] == 0) {
            sheet.getRange("B" + next_row).setValue(datas[6]);// 指定された日付
          }　else {
            
            sheet.getRange("F" + next_row).setValue(datas[5]);// 精算額
            var payoff_row;
            switch(datas[1]){
              case "1":
              case "2":
              case "3":
                payoff_row = payoff_sheet.getRange(sheet.getMaxRows(), 2).getNextDataCell(SpreadsheetApp.Direction.UP).getRow() + 1;
                
                payoff_sheet.getRange("C" + payoff_row).setValue(datas[3]);// 内容
                payoff_sheet.getRange("D" + payoff_row).setValue(datas[5]);// 精算額
                
                if(dataLength == 7) {
                  sheet.getRange("B" + next_row).setValue(datas[6]);// 指定された日付
                  payoff_sheet.getRange("B" + payoff_row).setValue(datas[6]);// 指定された日付
                } else {
                  payoff_sheet.getRange("B" + payoff_row).setValue(month + "/" + date);// 今日
                }
                
                break;
              case "4":
              case "5":
                payoff_row = payoff_sheet.getRange(sheet.getMaxRows(), 6).getNextDataCell(SpreadsheetApp.Direction.UP).getRow() + 1;
                
                payoff_sheet.getRange("G" + payoff_row).setValue(datas[3]);// 内容
                payoff_sheet.getRange("H" + payoff_row).setValue(datas[5]);// 精算額
                
                if(dataLength == 7) {
                  sheet.getRange("B" + next_row).setValue(datas[6]);// 日付
                  payoff_sheet.getRange("F" + payoff_row).setValue(datas[6]);// 日付
                } else {
                  payoff_sheet.getRange("F" + payoff_row).setValue(month + "/" + date);// 日付
                }
                
                break;
            }
          }
        }
        
        message += "支出を記入しました。\n\n" + getSheetUrl(ss,sheet);
      }
      break;
      
    case "収入":
      if(dataLength == 4 && (datas[1] == 1 || datas[1] == 2)){
        
        var sheetNum = parseInt(datas[1]) + 4;
        var sheet = ss.getSheets()[sheetNum];
        var next_row = sheet.getLastRow() + 1;
        
        sheet.getRange("B" + next_row).setValue(datas[2]);// 名称
        sheet.getRange("C" + next_row).setValue(datas[3]);// 金額
        message += "収入を記入しました。\n\n" + getSheetUrl(ss,sheet);
      }
      break;
      
    case "update":
      message += updateMsg;
      break;
  }
  
  if(message == ""){
    message = PropertiesService.getScriptProperties().getProperty('HELP_MSG');
  }
  
  var slackApp = SlackApp.create(token); 
  var icon = PropertiesService.getScriptProperties().getProperty('ICON_URL');
  
  slackApp.chatPostMessage(e.parameter.channel_id, message, {
    username : "家計簿bot",
    icon_url : icon
  });
}

// シートのURLを取得する処理
function getSheetUrl(ss,sheet) {
  var ssUrl = ss.getUrl();
  var sheetId = sheet.getSheetId();
  var sheetUrl = ssUrl + "#gid=" + sheetId;
  return sheetUrl;
}

// 月ごとのスプレッドシートを作成する処理
function createSS(fileName) {
  // テンプレートファイル
  var template = DriveApp.getFileById(PropertiesService.getScriptProperties().getProperty('TEMPLATE_FILE'));
  
  // テンプレート複製
  var newFile = template.makeCopy(fileName, OFolder);
  
  return newFile;
}