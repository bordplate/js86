BITS 64

main:
    sub rsp, 0x10
    mov rdi, rsp
    mov rsi, 0x10
    int 2
    int 3