BITS 64

start:
    mov rax, 0x20
    sub rax, 0x20
    jz zero
    int 3

zero:
    mov rdi, zerotext
    int 1
    add rax, 0x01
    jnz notzero
    int 3

notzero:
    mov rdi, notzerotext
    int 1
    cmp rax, 0x01
    jne quit
    je compare
    int 3

compare:
    mov rdi, comparetext
    int 1

ignorejumps:
    add rax, 0x01
    jz quit
    sub rax, 0x02
    jnz quit
    cmp rax, 0x1337
    je quit
    mov rdi, ignoredtext
    int 1

quit:
    int 5

zerotext:
    db "Jump if zero",0x0a,0

notzerotext:
    db "Jump if not zero",0x0a,0

ignoredtext:
    db "Properly ignored jumps",0x0a,0

comparetext:
    db "Compare works",0x0a,0