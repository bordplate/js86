BITS 64

main:
    call first
    int 3

first:
    call second
    ret

second:
    call third
    ret

third:
    call fourth
    ret

fourth:
    mov rax, 0x40404040
    ret