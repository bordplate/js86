BITS 64

main:
    mov rax, 0x12345678
    call callme
    int 3

callme:
    mov rax, 0x24071995
    ret