//ライブラリの読み込み
const fs = require('fs');
const Parser = require('./parser');
const CodeWriter = require('./writeCode');

//定数の宣言
const targetPath='../VMFiles/StaticTest.vm'//process.argv[2];
const outputAsmFilePath='output.asm';


//変数の宣言
let asmCode;
let asmCodes=[];

//メインプログラム
function main(){
  const parser = new Parser(targetPath);
  const code = new CodeWriter(targetPath);
  code.setFileName(parser.fileName);

  asmCode=code.writeAsmInit();
  asmCodes.push(asmCode);

  while (parser.hasMoreCommands()) {
    if (parser.commandType() === 'C_ARITHMETIC') { //コマンドが算術コマンドのとき
      const cmd = parser.arg1();
      asmCode = code.writeArithmetic(cmd);
      asmCodes.push(asmCode);
    } else if (parser.commandType() === 'C_PUSH' || parser.commandType() === 'C_POP') { //コマンドがPUSH or POPコマンドのとき
      const segment = parser.arg1();
      const index = parser.arg2();
      asmCode =code.writePushPop(parser.commandType(),segment,index)
      asmCodes.push(asmCode);
    } else {
      console.log('write coding error');
    }
    parser.advance();
  }
  fs.writeFileSync(outputAsmFilePath, asmCodes.join('\n'));
}

//実行
main();
