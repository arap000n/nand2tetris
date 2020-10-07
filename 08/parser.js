//ライブラリの読み込み
const fs = require('fs');
const path = require('path');

//定数宣言
const arithmeticCmds=['add','sub','neg','eq','gt','lt','and','or','not'];
const arg0Cmds=[...arithmeticCmds,'return'];
const arg1Cmds=['label','goto','if-goto'];
const arg2Cmds=['push','pop'];
const argNCmds=['function','call'];
const arg0CmdType=['C_ARITHMETIC','C_RETURN'];
const arg1CmdType=['C_LABEL','C_GOTO','C_IF'];
const arg2CmdType=['C_PUSH','C_POP'];
const argNCmdType=['C_FUNCTION','C_CALL'];

//クラス定義
class Parser{
  constructor(inputFilePath){
    let fileText = fs.readFileSync(path.resolve(__dirname, inputFilePath), {encoding: "utf-8"});//ファイル内のテキストをすべて読み込み
    const texts = fileText.split(/\r\n/); //行単位＝コマンド単位に分割し、配列に格納

    //コマンドの配列を生成
    this.vmInstructions = texts.filter(text => {
      return text !== '' && text.indexOf("//") !== 0; //空行ではなく、コメントだけ（=//から始まる）行でもない
    });

    this.currentCmdCnt=0; //現在のコマンドのカウント
    this.currentCmd=this.vmInstructions[this.currentCmdCnt]; //現在のコマンドの内容
  }

  //さらにコマンドが存在するかどうかをbooleanで返すメソッド
  hasMoreCommands(){
    return this.vmInstructions.length > this.currentCmdCnt;
  }

  //次のコマンドを読み込み、現コマンドにセットするメソッド（hasMoreCommandsメソッドの返り値がtrueの場合のみ実行）
  advance(){
    if(this.hasMoreCommands()){
      this.currentCmdCnt++;
      this.currentCmd=this.vmInstructions[this.currentCmdCnt];
      if(this.currentCmd){
        this.currentCmd=this.currentCmd.split('//')[0]; //コメントは削除しておく
      }
    }
  }

  //VMコマンドの種類を返す
  commandType(){
    if(arithmeticCmds.includes(this.currentCmd.split(' ')[0])){
      return 'C_ARITHMETIC';
    }else if(this.currentCmd.indexOf('push')===0){
      return 'C_PUSH';
    }else if(this.currentCmd.indexOf('pop')===0){
      return 'C_POP';
    }else if(this.currentCmd.indexOf('label')===0){
      return 'C_LABEL';
    }else if(this.currentCmd.indexOf('goto')===0){
      return 'C_GOTO';
    }else if(this.currentCmd.indexOf('if-goto')===0){
      return 'C_IF';
    }else if(this.currentCmd.indexOf('function')===0){
      return 'C_FUNCTION';
    }else if(this.currentCmd.indexOf('return')===0){
      return 'C_RETURN';
    }else if(this.currentCmd.indexOf('call')===0){
      return 'C_CALL';
    }else{    
      console.log('Error:Command Type Error：' + this.currentCmd +'!');
    }
  }

  //1つめの引数もしくは、コマンド自体を返す
  arg1(){
    if (this.commandType() === 'C_ARITHMETIC') {
      return this.currentCmd.split(' ')[0]; //コマンド自体を返す
    }else if (this.commandType() !== 'C_RETURN') {
      return this.currentCmd.split(' ')[1];//1つめの引数を返す
    }
  }

  //2つめの引数を返す
  arg2(){
    if(arg2CmdType.includes(this.commandType()) || argNCmdType.includes(this.commandType())){ //2つめの引数が存在するコマンドの場合のみ呼ぶ
      return this.currentCmd.split(' ')[2]; //2つめの引数を返す
    }
  }
}

module.exports = Parser;