BITS 64

section .text

global main

main:
    jmp non_extern

non_extern:
    mov rax, 1
    jmp main
    ret

section .data

msg: db "Hello",0
