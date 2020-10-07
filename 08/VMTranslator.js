//ライブラリの読み込み
const fs = require('fs');
const path = require('path');
const Parser = require('./parser');
const CodeWriter = require('./writeCode');

//定数の宣言
const targetPath='../FunctionCalls/StaticsTest'//process.argv[2];
const allFiles = fs.readdirSync(path.resolve(__dirname, targetPath));
const files = allFiles.filter((file) => {
  return file.endsWith('.vm');
});

const outputAsmFilePath='./output.asm'
const codeWriter = new CodeWriter(outputAsmFilePath);

//変数の宣言
let asmCode;
let asmCodes=[];

asmCode=codeWriter.writeInit();
asmCodes.push(asmCode);

main();

function main(){
  for (const file of files) {
    const filePath = targetPath + '/' + file;
    VmTranslate(file, filePath, codeWriter);
  }
}

function VmTranslate (fileName, filePath, codeWriter) {
  const parser = new Parser(filePath);
  codeWriter.setFileName(fileName);
  

  while (parser.hasMoreCommands()) {
    if (parser.commandType() === 'C_ARITHMETIC') {
      asmCode = codeWriter.writeArithmetic(parser.arg1());
      asmCodes.push(asmCode);
    } else if (parser.commandType() === 'C_PUSH' || parser.commandType() === 'C_POP') {
      asmCode =codeWriter.writePushPop(parser.commandType(),parser.arg1(),parser.arg2());
      asmCodes.push(asmCode);
    } else if (parser.commandType() ==='C_LABEL'){
      asmCode =codeWriter.writeLabel(parser.arg1());
      asmCodes.push(asmCode);
    } else if (parser.commandType() ==='C_GOTO'){
      asmCode =codeWriter.writeGoto(parser.arg1());
      asmCodes.push(asmCode);
    } else if (parser.commandType() ==='C_IF'){
      asmCode =codeWriter.writeIf(parser.arg1());
      asmCodes.push(asmCode);
    } else if (parser.commandType() ==='C_CALL'){
      asmCode =codeWriter.writeCall(parser.arg1(),parser.arg2());
      asmCodes.push(asmCode);
    } else if (parser.commandType() ==='C_RETURN'){
      asmCode =codeWriter.writeReturn();
      asmCodes.push(asmCode);
    } else if (parser.commandType() ==='C_FUNCTION'){
      asmCode =codeWriter.writeFunction(parser.arg1(),parser.arg2());
      asmCodes.push(asmCode);
    }else{
      console.log('parse error');
    }
    parser.advance();
  }
  fs.writeFileSync(outputAsmFilePath, asmCodes.join('\n'));
}

