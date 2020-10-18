//ライブラリとモジュール読み込み
const fs = require('fs');
const path = require('path');
const JackTokenizer = require('./JackTokenizer');
const CompilationEngine = require('./CompilationEngine');

//定数の宣言
const inputPath='../Square'


//メイン関数
function main(targetPath){

  //指定されたフォルダ内の.jackファイル名を配列化
  const allFiles = fs.readdirSync(path.resolve(__dirname, targetPath));
  const files = allFiles.filter((file) => {
    return file.endsWith('.jack');
  });

  //.jackファイルに対して、コンパイルを実施
  for (const file of files) {
    const filePath = targetPath + '/' + file;
    exeCompile(filePath);
  }
}

//コンパイル実行関数（実行単位：1ファイル）
function exeCompile (filePath) {
  const jackTokenizer = new JackTokenizer(filePath);
  const compilationEngine = new CompilationEngine();

  while (jackTokenizer.hasMoreTokens()) {
    if(jackTokenizer.currentToken){
      compilationEngine.compileToken(jackTokenizer.tokenType(),jackTokenizer.currentToken);
    }else{
      console.log('token Error');
    }
    jackTokenizer.advance();
  }

  compilationEngine.outputCompiledFile(filePath);
}

//メイン関数の実行
main(inputPath);
