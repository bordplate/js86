BITS 64

main:
    mov rax, 0x1213141516171000
    mov rbx, 0x2122232425262000
    push rax
    push rbx
    sub rsp, 0x10
    mov rdi, rsp
    mov rsi, 0x20
    int 2
    add rsp, 0x10
    pop rax
    int 3