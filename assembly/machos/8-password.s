BITS 64

section .data

password_ptr: db "What in the fuck?",0

booting_msg: db "Booting system...",0
dot_msg: db ".", 0
welcome_msg: db 0x0a,"Welcome to SECSYS3000!",0x0a,0

section .text

global main

main:
    call boot_up
    call exit

boot_up:
    lea rdi, [rel booting_msg]
    call print
    call integrity_check
    lea rdi, [rel welcome_msg]
    call print
    ret

integrity_check:
    push rdi
    lea rdi, [rel password_ptr]
    mov rdi, 0x10
    call malloc
    mov rdi, rax
    call create_random_password
    lea rax, [rel password_ptr]
    mov [rax], rdi
    pop rdi
    ret

create_random_password:
    push rcx
    push rax
    mov rsi, rdi
    mov rcx, rsi
    add rcx, 0x10

    loop:
    call _rand
    mov rbx, 57
    idiv rbx
    add rdx, 65
    sub rcx, 1
    mov byte [rcx], dl
    cmp rcx, rsi
    jne loop

    pop rax
    pop rcx
    ret

read:
    int 2
    ret

print:
    int 1
    ret

printf:
    int 4
    ret

exit:
    int 3

malloc:
    call _malloc
    ret

extern _malloc
extern _rand