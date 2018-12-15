BITS 64

main:
    call getinput
    int 3

getinput:
    mov rbp, rsp
    sub rsp, 0x10
    mov rdi, rsp
    mov rsi, 0x18
    int 2
    add rsp, 0x10
    mov rsp, rbp
    ret

nothing:
    mov eax, 0x12345678
    int 3