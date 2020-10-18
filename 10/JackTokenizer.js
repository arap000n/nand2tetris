//ライブラリの読み込み
const fs = require('fs');
const path = require('path');

//定数宣言
const keyWords=['class','constructor','function','method','field','static','var','int','char','boolean','void','true','false','null','this','let','do','if','else','while','return',];
const symbols=['{' , '}' , '(' , ')' , '[' , ']' , '.' , ',' , ';' , '+' , '-' , '*' , '/' , '&' , '|' , '<' , '>' ,'=' , '~',];


//クラス定義
class JackTokenizer{
  constructor(inputFilePath){
    console.log(inputFilePath);
    let fileText = fs.readFileSync(path.resolve(__dirname, inputFilePath), {encoding: "utf-8"});//ファイル内のテキストをすべて読み込み
    console.log(fileText);
    // コメントを取り除く処理
    let texts=fileText.replace(/\/\/.*\r\n/g,'\r\n',)
    console.log(texts);
    texts = texts.replace(/\/\*.*\*\//g,'\r\n',)
    texts = texts.replace(/;/g,' ; ');
    texts = texts.replace(/:/g,' : ');
    texts = texts.replace(/".*?"/g,spaceReplace); //ダブルクォーテーション内の空白を一旦\0に置き換え
    texts = texts.replace(/\//g,' / ');
    texts = texts.replace(/\(/g,' ( ');
    texts = texts.replace(/\)/g,' ) ');
    texts = texts.replace(/\[/g,' [ ');
    texts = texts.replace(/\]/g,' ] ');
    texts = texts.replace(/\{/g,' { ');
    texts = texts.replace(/\}/g,' } ');
    texts = texts.replace(/\./g,' . ');
    texts = texts.replace(/\,/g,' , ');
    texts = texts.replace(/\+/g,' + ');
    texts = texts.replace(/\-/g,' - ');
    texts = texts.replace(/\*/g,' * ');
    texts = texts.replace(/\&/g,' & ');
    texts = texts.replace(/\|/g,' | ');
    texts = texts.replace(/\</g,' < ');
    texts = texts.replace(/\>/g,' > ');
    texts = texts.replace(/\~/g,' ~ ');
    texts = texts.split(/\r\n|\s+/);
    texts = texts.map(text=>text.replace(/#####/g,' '));

    //トークンの配列を生成
    this.tokens = texts.filter(text => {
      return text !== ''; //ブランクを除外
    });

    console.log(this.tokens);

    this.currentTokenCnt=0; //現在のトークンのカウント
    this.currentToken=this.tokens[this.currentTokenCnt]; //現在のトークン
  }

  hasMoreTokens(){
    return this.tokens.length > this.currentTokenCnt;
  }

  advance(){
    if(this.hasMoreTokens()){
      this.currentTokenCnt++;
      this.currentToken=this.tokens[this.currentTokenCnt];
    }
  }

  tokenType(){
    if(this.currentToken){
      if(keyWords.includes(this.currentToken)){
        return 'keyword';
      }else if(symbols.includes(this.currentToken)){
        return 'symbol';
      }else if(!isNaN(this.currentToken)){
        return 'integerConstant';
      }else if(this.currentToken.indexOf(`"`)===0){
        return 'stringConstant';
      }else{
        return 'identifier';
      }
    }else{
      console.log('currentToken is undefined');
    }
  }

}

function spaceReplace(str){
  let replacedStr;
  replacedStr=str.replace(/\s+/g,'#####');
  return replacedStr;
}

//クラスのエクスポート
module.exports = JackTokenizer;