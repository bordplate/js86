BITS 64

section .text

global main

main:
    xor eax, eax
    mov rdi, [RAX + 0x10]
    lea rdi, [rel msg]
    call printf
    call exit

printf:
    int 1
    ret

exit:
    int 3


section .data

msg: db "Hello", 0x0