const fs = require('fs');
const path = require('path');
const flowConst=['let','if','while','do','return'];
const op=['+','-','*','/','&','|','<','>','='];

class CompilationEngine{
  constructor(){
    this.outputCodes=[];
    this.compileStack=['class',];
    this.returnTokenStack=[];
    this.termStack=[];
    this.indentCnt=0;
  }

  //割り振りのメソッド
  compileToken(type,token){
    console.log(`token=${token},stack=[${this.compileStack}],type=${type},returnToken=[${this.returnTokenStack}],indent=${this.indentCnt}`);
    if(this.compileStack[this.compileStack.length-1]==='class'){
      this.compileClass(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='classVarDec'){
        this.compileClassVarDec(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='subroutineDec'){
      this.compileSubroutineDec(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='parameterList'){
        this.compileParameterList(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='subroutineBody'){
      this.compileSubroutineBody(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='varDec'){
      this.compileVarDec(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='statements'){
      this.compileStatements(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='whileStatements'){
      this.compileWhile(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='ifStatements'){
      this.compileIf(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='returnStatements'){
      this.compileReturn(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='letStatements'){
      this.compileLet(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='doStatements'){
      this.compileDo(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='expression'){
      this.compileExpression(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='term'){
      this.compileTerm(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='expressionList'){
      this.compileExpressionList(type,token);
    }else if(this.compileStack[this.compileStack.length-1]==='subroutineCall'){
      this.compileSubroutineCall(type,token);  
    }else{
      console.log('error');
    }
    return;
  }
  
  compileClass(type,token){
    if(token==='class'){
      this.compileNonTerminalTokenStart('class');
      this.compileTerminalToken(type,token);
    }else if(token==='{'){
      this.compileTerminalToken(type,token);
      this.returnTokenStack.push('}');
    }else if(token==='static' || token==='field'){
        this.compileClassVarDec(type,token); 
    }else if(token==='constructor' || token==='function' || token==='method'){
      this.compileSubroutineDec(type,token);
    }else if(token===this.returnTokenStack[this.returnTokenStack.length-1]){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenEnd('class');
      this.compileStack.pop();
      this.returnTokenStack.pop();
    }else{
      this.compileTerminalToken(type,token);
    }
  }

  compileClassVarDec(type,token){
    if(token==='static' || token==='field'){
      this.compileStack.push('classVarDec');
      this.compileNonTerminalTokenStart('classVarDec');
      this.compileTerminalToken(type,token);
    }else if(token===';'){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenEnd('classVarDec');
      this.compileStack.pop();
    }else{
      this.compileTerminalToken(type,token);
    }
  }

  compileSubroutineDec(type,token){
    if(token==='constructor' || token==='function' || token==='method'){
      this.compileStack.push('subroutineDec');
      this.compileNonTerminalTokenStart('subroutineDec');
      this.compileTerminalToken(type,token);
    }else if(token==='('){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenStart('parameterList');
      this.compileStack.push('parameterList');
      this.returnTokenStack.push(')');
    }else if(token===')'){
      this.compileTerminalToken(type,token);
      this.returnTokenStack.pop();
    }else if(token==='{'){
      this.compileNonTerminalTokenStart('subroutineBody');
      this.compileStack.push('subroutineBody');
      this.compileTerminalToken(type,token);
      this.returnTokenStack.push('}');
    }else if(token===this.returnTokenStack[this.returnTokenStack.length-1]){
      this.compileNonTerminalTokenEnd('subroutineDec');
      this.compileStack.pop();
    }else{
      this.compileTerminalToken(type,token);
    }
  }

  compileParameterList(type,token){
    if(token===this.returnTokenStack[this.returnTokenStack.length-1]){
      this.compileNonTerminalTokenEnd('parameterList');
      this.compileStack.pop();
      this.compileToken(type,token);
    }else{
      this.compileTerminalToken(type,token);
    }
  }

  compileSubroutineBody(type,token){
    if(token==='var'){
      this.compileVarDec(type,token);
    }else if(token===this.returnTokenStack[this.returnTokenStack.length-1]){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenEnd('subroutineBody');
      this.compileStack.pop();
      this.returnTokenStack.pop();
      this.compileNonTerminalTokenEnd('subroutineDec');
      this.compileStack.pop();
    }else if(flowConst.includes(token)){
      this.compileStack.push('statements');
      this.compileNonTerminalTokenStart('statements');
      this.compileStatements(type,token);
    }else{
      this.compileTerminalToken(type,token);
    }
  }

  compileVarDec(type,token){
    if(token==='var'){
      this.compileStack.push('varDec');
      this.compileNonTerminalTokenStart('varDec');
      this.compileTerminalToken(type,token);
      this.returnTokenStack.push(';');
    }else if(token===this.returnTokenStack[this.returnTokenStack.length-1]){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenEnd('varDec');
      this.compileStack.pop();
      this.returnTokenStack.pop();
    }else{
      this.compileTerminalToken(type,token);
    }
  }

  compileStatements(type,token){
    if(token==='let'){
      this.compileLet(type,token);
    }else if(token==='if'){
      this.compileIf(type,token);
    }else if(token==='while'){
      this.compileWhile(type,token);
    }else if(token==='do'){
      this.compileDo(type,token);
    }else if(token==='return'){
      this.compileReturn(type,token);
    }else if(token===this.returnTokenStack[this.returnTokenStack.length-1]){
      this.compileNonTerminalTokenEnd('statements');
      this.compileStack.pop();
      this.compileToken(type,token);
    }
  }

  compileLet(type,token){
    if(token==='let'){
      this.compileStack.push('letStatements');
      this.compileNonTerminalTokenStart('letStatement');
      this.compileTerminalToken(type,token);
    }else if(token==='['){
      this.compileTerminalToken(type,token);
      this.compileStack.push('expression');
      this.compileNonTerminalTokenStart('expression');
      this.returnTokenStack.push(']');
    }else if(token===']'){
      this.compileTerminalToken(type,token);
      this.returnTokenStack.pop();
    }else if(token==='='){
      this.compileTerminalToken(type,token);
      this.compileStack.push('expression');
      this.compileNonTerminalTokenStart('expression');
      this.returnTokenStack.push(';');
    }else if(token===this.returnTokenStack[this.returnTokenStack.length-1]){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenEnd('letStatement');
      this.compileStack.pop();
      this.returnTokenStack.pop();
    }else{ //varNameを想定
      this.compileTerminalToken(type,token);
    }
  }

  compileIf(type,token){
    if(!this.termStack[0] && token==='if'){
      this.compileStack.push('ifStatements');
      this.compileNonTerminalTokenStart('ifStatement');
      this.compileTerminalToken(type,token);  
    }else if(token==='('){
      this.compileTerminalToken(type,token);
      this.compileStack.push('expression');
      this.compileNonTerminalTokenStart('expression');
      this.returnTokenStack.push(')');
    }else if(token===')'){
      this.compileTerminalToken(type,token);
      this.returnTokenStack.pop();
    }else if(token==='{'){
      this.compileTerminalToken(type,token);
      this.compileStack.push('statements');
      this.compileNonTerminalTokenStart('statements');
      this.returnTokenStack.push('}');
    }else if(token==='}'){//次がelseなのか、ifの終わりなのかを判定する必要がある
      this.termStack.push(type);
      this.termStack.push(token);
    }else if(this.termStack[0] && token==='else'){
      this.compileTerminalToken(this.termStack[0],this.termStack[1]);
      this.termStack.pop();
      this.termStack.pop();
      this.compileTerminalToken(type,token);
    }else if(this.termStack[0] && token!=='else'){
      this.compileTerminalToken(this.termStack[0],this.termStack[1]);
      this.termStack.pop();
      this.termStack.pop();
      this.compileNonTerminalTokenEnd('ifStatement');
      this.compileStack.pop();
      this.returnTokenStack.pop();
      this.compileToken(type,token);
    }
  }

  compileWhile(type,token){
    if(token==='while'){
      this.compileStack.push('whileStatements');
      this.compileNonTerminalTokenStart('whileStatement');  
      this.compileTerminalToken(type,token);
    }else if(token==='('){
      this.compileTerminalToken(type,token);
      this.compileStack.push('expression');
      this.compileNonTerminalTokenStart('expression');
      this.returnTokenStack.push(')');
    }else if(token===')'){
      this.compileTerminalToken(type,token);
      this.returnTokenStack.pop();
    }else if(token==='{'){
      this.compileTerminalToken(type,token);
      this.compileStack.push('statements');
      this.compileNonTerminalTokenStart('statements');
      this.returnTokenStack.push('}');
    }else if(token===this.returnTokenStack[this.returnTokenStack.length-1]){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenEnd('whileStatement');
      this.compileStack.pop();
      this.returnTokenStack.pop();
    }
  }

  compileDo(type,token){
    if(token==='do'){
      this.compileStack.push('doStatements');
      this.compileNonTerminalTokenStart('doStatement');
      this.compileTerminalToken(type,token);
      this.returnTokenStack.push(';');
    }else if(token===this.returnTokenStack[this.returnTokenStack.length-1]){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenEnd('doStatement');
      this.compileStack.pop();
      this.returnTokenStack.pop();
    }else{
      this.compileStack.push('subroutineCall');
      this.compileSubroutineCall(type,token);
    }
  }

  compileReturn(type,token){
    if(token==='return'){
      this.compileStack.push('returnStatements');
      this.compileNonTerminalTokenStart('returnStatement');
      this.compileTerminalToken(type,token);
      this.returnTokenStack.push(';');
    }else if(token===';'){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenEnd('returnStatement');
      this.compileStack.pop();
      this.returnTokenStack.pop();
    }else{
      this.compileStack.push('expression');
      this.compileNonTerminalTokenStart('expression');
      this.compileToken(type,token);
    }
  }

  compileExpression(type,token){
    if(op.includes(token)){
      if(token==='-'){//-だけは場合わけの必要があり
        if(this.outputCodes[this.outputCodes.length-1].indexOf('</term>') >=0){//opとして使われるケース
          this.compileTerminalToken(type,token);
          this.compileStack.push('term');
          this.compileNonTerminalTokenStart('term');
        }else{//termの一部分（UnaryOp）として使われるケース
          this.compileStack.push('term');
          this.compileNonTerminalTokenStart('term');
          this.compileTerm(type,token);
        }
      }else{
        this.compileTerminalToken(type,token);
        this.compileStack.push('term');
        this.compileNonTerminalTokenStart('term');
      }
    }else if(token===','){
      this.compileNonTerminalTokenEnd('expression');
      this.compileStack.pop();
      this.compileToken(type,token);
    }else if(token===this.returnTokenStack[this.returnTokenStack.length-1]){
      if(this.compileStack[this.compileStack.length-2]==='term'){
        this.compileNonTerminalTokenEnd('expression');
        this.compileTerminalToken(type,token);
        this.compileStack.pop();
        this.returnTokenStack.pop();
        this.compileNonTerminalTokenEnd('term');
        this.compileStack.pop();
      }else{
        this.compileNonTerminalTokenEnd('expression');
        this.compileStack.pop();
        this.compileToken(type,token);  
      }
    }else{
      this.compileStack.push('term');
      this.compileNonTerminalTokenStart('term');
      this.compileTerm(type,token);
    }
  }

  compileTerm(type,token){  
    if(token=== 'true' ||token=== 'false' ||token=== 'null' || token==='this' ){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenEnd('term');
      this.compileStack.pop();
    }else if(!this.termStack[0] && token=== '-' ||token=== '~'){
      this.compileTerminalToken(type,token);
      this.compileStack.push('term');
      this.compileNonTerminalTokenStart('term');
    }else if(token=== '('){
      this.compileTerminalToken(type,token);
      this.compileStack.push('expression');
      this.compileNonTerminalTokenStart('expression');
      this.returnTokenStack.push(')');
    }else if(type==='integerConstant' || type==='stringConstant'){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenEnd('term');
      this.compileStack.pop();
    }else if(this.termStack[0]){//要判定
      if(token==='['){//varName[expression]のパターンだったとき
        this.compileTerminalToken(this.termStack[0],this.termStack[1]);
        this.termStack.pop();
        this.termStack.pop();
        this.compileTerminalToken(type,token);
        this.compileStack.push('expression');
        this.compileNonTerminalTokenStart('expression');
        this.returnTokenStack.push(']');
      }else if(token==='.'){//subroutineCall（classname.subroutine）のパターン
        this.compileSubroutineCall(this.termStack[0],this.termStack[1]);
        this.termStack.pop();
        this.termStack.pop();
        this.compileStack.push('subroutineCall');
        this.compileSubroutineCall(type,token);
      }else if(token==='('){//subroutineCall(subroutine)Nameのパターン
        this.compileSubroutineCall(this.termStack[0],this.termStack[1]);
        this.termStack.pop();
        this.termStack.pop();
        this.compileStack.push('subroutineCall');
        this.compileSubroutineCall(type,token);
      }else if(this.termStack[0] && (token!=='[' && token!=='.' && token!=='(')){
        this.compileTerminalToken(this.termStack[0],this.termStack[1]);
        this.termStack.pop();
        this.termStack.pop();
        this.compileNonTerminalTokenEnd('term');
        this.compileStack.pop();      
        this.compileToken(type,token);
      }
    }else if(token===']'){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenEnd('term');
      this.compileStack.pop();
      this.returnTokenStack.pop();
    }else if(token===this.returnTokenStack[this.returnTokenStack.length-1] || op.includes(token)){
      this.compileNonTerminalTokenEnd('term');
      this.compileStack.pop();
      this.compileToken(type,token);  
    }else{
      this.termStack.push(type);
      this.termStack.push(token);
    }
  }

  compileExpressionList(type,token){
    if(token===','){
      this.compileTerminalToken(type,token);
      this.compileNonTerminalTokenStart('expression');
      this.compileStack.push('expression');
    }else if(token===this.returnTokenStack[this.returnTokenStack.length-1]){
      this.compileNonTerminalTokenEnd('expressionList');
      this.compileStack.pop();
      this.compileToken(type,token);
    }else{
      this.compileStack.push('expression');
      this.compileNonTerminalTokenStart('expression');
      this.compileExpression(type,token)
    }
  }

  compileSubroutineCall(type,token){
    if(token==='.'){
      this.compileTerminalToken(type,token);
    }else if(token==='('){
      this.compileTerminalToken(type,token);
      this.compileStack.push('expressionList');
      this.compileNonTerminalTokenStart('expressionList');
      this.returnTokenStack.push(')');
    }else if(token===this.returnTokenStack[this.returnTokenStack.length-1]){
      this.compileTerminalToken(type,token);
      this.returnTokenStack.pop();
      this.compileStack.pop();
    }else{
      this.compileTerminalToken(type,token);
    }
  }
  
  compileTerminalToken(type,token){
    if(type==='stringConstant'){
      token=token.replace(/"/g,'');
    }else if(type==='symbol'){
      token=token.replace(/&/g,'&amp;');
      token=token.replace(/</g,'&lt;');
      token=token.replace(/>/g,'&gt;');  
    }

    this.outputCodes.push([Array(this.indentCnt*2+1).join(' ')+`<${type}> ${token} </${type}>`]);
  }

  compileNonTerminalTokenStart(token){
    this.outputCodes.push(Array(this.indentCnt*2+1).join(' ')+`<${token}>`);
    this.indentCnt=this.indentCnt+1;
  }

  compileNonTerminalTokenEnd(token){
    this.indentCnt=Math.max(0,this.indentCnt-1);
    this.outputCodes.push(Array(this.indentCnt*2+1).join(' ')+`</${token}>`);
  }

  outputCompiledFile(filePath){
    let splitedPath=filePath.split('/');
    let outputPath=`./${splitedPath[splitedPath.length-1].split('.')[0]}.xml`;
    console.log(outputPath);
    fs.writeFileSync(outputPath,this.outputCodes.join('\n'));
  }
}

module.exports = CompilationEngine;