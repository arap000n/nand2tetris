// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input.
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel;
// the screen should remain fully black as long as the key is pressed. 
// When no key is pressed, the program clears the screen, i.e. writes
// "white" in every pixel;
// the screen should remain fully clear as long as no key is pressed.

// Put your code here.

(RESET)
  //ポジションの初期化
  @16384
  D=A
  @position
  M=D //16384を初期値で設定

  //色の初期化
  @color
  M=0 //初期値は白

  //キーボードの判定
  @24576
  D=M
  @LOOP
  D;JEQ //D=0ならWHITE処理
  @BLACK_SET
  D;JNE //D<>0ならBLACK処理

  (BLACK_SET)
  @color
  M=-1

  (LOOP)
  @position
  D=M
  @24576
  D=D-A
  @END
  D;JGE

  @color
  D=M

  @position
  A=M
  M=D
  @position
  M=M+1
  @LOOP
  0;JMP //ループ処理を続ける

(END)
  @RESET
  0;JMP //先頭に戻ってキーを確認