//ライブラリの読み込み
const fs = require('fs');
const path = require('path');

//定数の宣言
const assemblyFilePath='../rect/RectL.asm';
const binaryFilePath='rectL.hack';
const compDict = {
  "0": "0101010",
  "1": "0111111",
  "-1": "0111010",
  "D": "0001100",
  "A": "0110000",
  "!D": "0001101",
  "!A": "0110001",
  "-D": "0001111",
  "-A": "0110011",
  "D+1": "0011111",
  "A+1": "0110111",
  "D-1": "0001110",
  "A-1": "0110010",
  "D+A": "0000010",
  "D-A": "0010011",
  "A-D": "0000111",
  "D&A": "0000000",
  "D|A": "0010101",
  "M": "1110000",
  "!M": "1110001",
  "-M": "1110011",
  "M+1": "1110111",
  "M-1": "1110010",
  "D+M": "1000010",
  "D-M": "1010011",
  "M-D": "1000111",
  "D&M": "1000000",
  "D|M": "1010101",
};

const jumpDict = {
  "JGT": "001",
  "JEQ": "010",
  "JGE": "011",
  "JLT": "100",
  "JNE": "101",
  "JLE": "110",
  "JMP": "111",
};


//変数の宣言
let romAddress = 0;
let ramAddress = 16;

let machineCode;
let machineCodes=[];

//クラス定義
class Parser{
  constructor(filePath){
    const fileText = fs.readFileSync(path.resolve(__dirname, filePath), {encoding: "utf-8"});
    const texts = fileText.replace(/ /g, '').split(/\r\n/); //スペースなくして、改行でsplit

    //行ごとにinstructionsに配列として格納
    this.instructions = texts.filter(text => {
      return text !== '' && text.indexOf("//") !== 0; //空行ではなく、コメントだけ（=//から始まる）行でもない
    });

    this.currentCmdCnt=0; //現在のコマンドのカウント
    this.currentCmd=this.instructions[this.currentCmdCnt]; //現在のコマンドの内容
  }

  hasMoreCommands(){
    return this.instructions.length > this.currentCmdCnt;
  }

  advance(){
    if(this.hasMoreCommands()){
      this.currentCmdCnt++;
      this.currentCmd=this.instructions[this.currentCmdCnt];
      if(this.currentCmd){
        this.currentCmd=this.currentCmd.split('//')[0];
      }
    }
  }

  commandType(){
    if(this.currentCmd.indexOf('@')===0){
      return 'A_COMMAND';
    }else if(this.currentCmd.indexOf('(')===0){
      return 'L_COMMAND';
    }else{    
      return 'C_COMMAND';
    }
  }

  symbol(){
    if (this.commandType() === 'A_COMMAND') {
      return this.currentCmd.slice(1);
    } else if (this.commandType() === 'L_COMMAND') {
      return this.currentCmd.slice(1, -1);
    }
  }

  dest(){
    if(this.commandType() ==='C_COMMAND'){
      if(this.currentCmd.indexOf(';')>=0){
        return null;
      }else{
        return this.currentCmd.slice(0,this.currentCmd.indexOf('='));
      }
    } 
  }
  

  comp(){
    if(this.commandType() ==='C_COMMAND'){
      if(this.currentCmd.indexOf('=')>=0 &&this.currentCmd.indexOf(';')>=0){ //destとcompとjumpがある
        return this.currentCmd.slice(this.currentCmd.indexOf('=')+1,this.currentCmd.indexOf(';'));
      }else if(this.currentCmd.indexOf('=')>=0 &&this.currentCmd.indexOf(';')<0){ //destとcompだけある
        return this.currentCmd.slice(this.currentCmd.indexOf('=')+1,this.currentCmd.length+1);
      }else if(this.currentCmd.indexOf('=')<0 &&this.currentCmd.indexOf(';')>=0){ //compとjumpだけある
        return this.currentCmd.slice(0,this.currentCmd.indexOf(';'));
      }else{ //compだけある
        return this.currentCmd;
      }
    }
  }

  jump(){
    if(this.commandType() ==='C_COMMAND' && this.currentCmd.indexOf(';')>=0){
      return this.currentCmd.slice(this.currentCmd.indexOf(';')+1,this.currentCmd.length+1);
    } 
  }
}

class Code{
  constructor(){
  }

  dest(destAsem){
    let d1;
    let d2;
    let d3;

    if (!destAsem) return '000';
    if (destAsem.indexOf('A') === -1) {
      d1 = '0';
    } else {
      d1 = '1';
    }
    if (destAsem.indexOf('D') === -1) {
      d2 = '0';
    } else {
      d2 = '1';
    }
    if (destAsem.indexOf('M') === -1) {
      d3 = '0';
    } else {
      d3 = '1';
    }
    return d1 + d2 + d3;
  }

  comp(compAsem){
    if (!compAsem) return '0000000';
    return compDict[compAsem];
  }

  jump(jumpAsem){
    if (!jumpAsem) return '000';
    return jumpDict[jumpAsem];
  }
}

class SymbolTable{
  constructor(){
    this.table = {
      "SP": "0x0000",
      "LCL": "0x0001",
      "ARG": "0x0002",
      "THIS": "0x0003",
      "THAT": "0x0004",
      "R0": "0x0000",
      "R1": "0x0001",
      "R2": "0x0002",
      "R3": "0x0003",
      "R4": "0x0004",
      "R5": "0x0005",
      "R6": "0x0006",
      "R7": "0x0007",
      "R8": "0x0008",
      "R9": "0x0009",
      "R10": "0x000a",
      "R11": "0x000b",
      "R12": "0x000c",
      "R13": "0x000d",
      "R14": "0x000e",
      "R15": "0x000f",
      "SCREEN": "0x4000",
      "KBD": "0x6000",
    };
  }

  addEntry(symbol, address){
    this.table[symbol] = address;
    return;
  }

  contains(symbol){
    return this.table[symbol] ? true : false;
  }

  getAddress(symbol){
    return this.table[symbol];
  }
}


//メインプログラム
const parser = new Parser(assemblyFilePath);
const code = new Code();
const symbolTable = new SymbolTable();

while (parser.hasMoreCommands()) {
  if (parser.commandType() === 'A_COMMAND' || parser.commandType() === 'C_COMMAND') {
    romAddress = romAddress + 1;
  } else if (parser.commandType() === 'L_COMMAND') {
    const symbol = parser.symbol();
    if (!symbolTable.contains(symbol)) {
      let address = ('000000' + romAddress.toString(16)).slice(-6);
      symbolTable.addEntry(symbol, address);
    }
  } else {
    throw new Error('invalid commandType');
  }
  parser.advance();
}

parser.currentCmdCnt = 0;
parser.currentCmd = parser.instructions[0];

while (parser.hasMoreCommands()) {
  if (parser.commandType() === 'C_COMMAND') {
    const destMnemonic = parser.dest();
    const compMnemonic = parser.comp();
    const jumpMnemonic = parser.jump();

    const dest = code.dest(destMnemonic);
    const comp = code.comp(compMnemonic);
    const jump = code.jump(jumpMnemonic);

    machineCodes.push('111' + comp + dest + jump);

  } else if (parser.commandType() === 'A_COMMAND') {
    const symbol = parser.symbol();
    if (isNaN(symbol)) {
      let address;
      if (symbolTable.contains(symbol)) {
        address = symbolTable.getAddress(symbol);
      } else {
        address = '0x' + ('0000' + ramAddress.toString(16)).slice(-4);
        symbolTable.addEntry(symbol, address);
        ramAddress = ramAddress + 1;
      }
      machineCode = ('0000000000000000' + parseInt(address, 16).toString(2)).slice(-16);
    } else {
      machineCode = ('0000000000000000' + parseInt(symbol).toString(2)).slice(-16);
    }

    machineCodes.push(machineCode);
  }

  parser.advance();
}

fs.writeFileSync(binaryFilePath, machineCodes.join('\n'));