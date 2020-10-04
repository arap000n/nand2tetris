//ライブラリの読み込み
const fs = require('fs');
const path = require('path');

const argN1Cmds=['neg', 'not'];
const argN2Cmds=['add', 'sub', 'and', 'or'];
const comparisonCmds=['eq', 'gt', 'lt'];

class CodeWriter{
  constructor(targetPath){

    const index = targetPath.lastIndexOf('.');
    this.outputPath = __dirname + '/' + targetPath.slice(0, index) + '.asm';
    fs.writeFileSync(this.outputPath, '');

    const index2 = this.outputPath.lastIndexOf('/');
    this.fileName = this.outputPath.slice(index2 + 1);

    this.labelNum = 0;
  }

  setFileName(fileName){

  }

  writeArithmetic(command){
    if(argN1Cmds.includes(command)) {
      return this.connectCommands([
        this.writeAsmPop(),
        this.writeAsmFormula(command),        
        this.writeAsmPush(),
      ]);
    }else if (argN2Cmds.includes(command)) {
      return this.connectCommands([
        this.writeAsmPop(),
        'D=M',
        this.writeAsmPop(),
        this.writeAsmFormula(command),
        this.writeAsmPush(),
      ]);
    }else if (comparisonCmds.includes(command)){
      this.labelNum=this.labelNum+1;
      return this.connectCommands([
        this.writeAsmPop(),
        'D=M',
        this.writeAsmPop(),
        'D=M-D',
        `@TRUE_${this.labelNum}`,
        `D;${this.writeAsmMnemonic(command)}`,
        'D=0', //false
        `@NEXT_${this.labelNum}`,
        '0;JMP',
        `(TRUE_${this.labelNum})`,
        'D=-1', //True
        `(NEXT_${this.labelNum})`,
        this.writeAsmPush(),
      ]);
    }else{
      console.log('writeArithmetic Error');
    }
  }

  writePushPop(commandType,segment,index){ //commandは、C_PUSH or C_POP
    if(commandType==='C_PUSH'){
      if(segment==='constant'){
        return this.connectCommands([
          this.writeAsmConstant(index),
          this.writeAsmPush(),
        ]);
      }else if(['local', 'argument', 'this', 'that'].includes(segment)){
        return this.connectCommands([
          this.writeAsmRAMSegment(segment,index),
          'D=M',
          this.writeAsmPush(),
        ]);
      }else if(['pointer', 'temp'].includes(segment)){
        return this.connectCommands([
          this.writeAsmRegistarSegment(segment,index),
          'D=M',
          this.writeAsmPush(),
        ]);
      }else if(segment==='static'){
        return this.connectCommands([
          `@${this.fileName}.${index}`,
          'D=M',
          this.writeAsmPush(),
        ]);
      }else{
        throw new Error('segment error');
      }
    }else if(commandType==='C_POP'){
      if(segment==='constant'){
        return this.connectCommands([
          this.writeAsmConstant(index),
          this.writeAsmPop(),
        ]);
      }else if(['local', 'argument', 'this', 'that'].includes(segment)){
        return this.connectCommands([
          this.writeAsmPop(),
          'D=M',
          this.writeAsmRAMSegment(segment,index), //対象のアドレスに到達
          'M=D',
        ]);
      }else if(['pointer', 'temp'].includes(segment)){
        return this.connectCommands([
          this.writeAsmPop(),
          this.writeAsmRegistarSegment(segment,index),
          'M=D',
        ]);
      }else if(segment==='static'){
        return this.connectCommands([
          this.writeAsmPop(),
          'D=M',
          `@${this.fileName}.${index}`,
          'M=D'
        ]);
      }else{
        throw new Error('segment error');
      }
    }else{
      throw new Error('Write PushPop Error');
    }
  }

  writeAsmInit(){
    return this.connectCommands(['@256','D=A','@SP','M=D','@300','D=A','@LCL','M=D','@400','D=A','@ARG','M=D','@3000','D=A','@THIS','M=D','@3010','D=A','@THAT','M=D']); //初期値を設定
  }

  writeAsmConstant(index){
    return this.connectCommands([`@${index}`,'D=A']);
  }

  writeAsmRAMSegment(segment,index){
    let symbol=this.fetchBase(segment);
    const indexNum = Number(index);
    const nIncrements=new Array(indexNum).fill('A=A+1');
    return this.connectCommands([`@${symbol}`,'A=M', ...nIncrements]);
  }

  writeAsmRegistarSegment(segment,index){
    let baseAddress=this.fetchBase(segment);
    const indexNum = Number(index);
    const nIncrements=new Array(indexNum).fill('A=A+1');
    return this.connectCommands([`@${baseAddress}`, ...nIncrements]);
  }

  writeAsmStaticSegment(segment,index){
    let baseAddress=this.fetchBase(segment);
    const indexNum = Number(index);
    const nIncrements=new Array(indexNum).fill('A=A+1');
    return this.connectCommands([`@${baseAddress}`,'A=M', ...nIncrements]);
  }

  fetchBase(segment){
    if(segment==='local'){
      return 'LCL';
    }else if(segment=== 'argument'){
      return 'ARG';
    }else if(segment==='this'){
      return 'THIS';
    }else if(segment==='that'){
      return 'THAT';
    }else if(segment==='pointer'){
      return 3;
    }else if(segment==='temp'){
      return 5;
    }else if(segment==='static'){
      return 16;
    }else{
      console.log('fetchSymbol Error');
    }
  }

  writeAsmFormula(command){
    if(command==='add'){
      return 'D=D+M';
    }else if(command==='sub'){
      return 'D=M-D';
    }else if(command==='and'){
      return 'D=M&D'
    }else if(command==='or'){
      return 'D=M|D'
    }else if(command==='neg'){
      return 'D=-M'
    }else if(command==='not'){
      return 'D=!M'
    }else{
      console.log('writeAsmFormula Error');
    }
  }

  writeAsmMnemonic(command){
    if(command==='eq'){
      return 'JEQ';
    }else if(command==='gt'){
      return 'JGT';
    }else if(command==='lt'){
      return 'JLT';
    }else{
      console.log('writeAsmMnemonic Error');
    }
  }

  writeAsmPop(){
    return this.connectCommands([this.writeAsmDecrementSP(),'@SP','A=M']);
  }

  writeAsmPush(){
    return this.connectCommands(['@SP','A=M','M=D',this.writeAsmIncrementSP()]);    
  }

  writeAsmIncrementSP(){
    return this.connectCommands(['@SP','M=M+1']);
  }

  writeAsmDecrementSP(){
    return this.connectCommands(['@SP','M=M-1']);
  }

  connectCommands(cmds){
    return cmds.join('\n');
  }

  close(){

  }

}

module.exports = CodeWriter;