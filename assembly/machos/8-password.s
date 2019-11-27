BITS 64

section .data

password_ptr: db "What in the fuck?",0

booting_msg: db "Booting system...",0x0a,0
welcome_msg: db "Welcome to SECSYS3000!",0
enter_pass_msg: db 0x0a,"Please enter your password: ",0
_loggedin_msg: db "Successfully logged in!",0x0a,"Flag: {vetle_iz_da_bezt}",0x0a,0
wrong_pass_msg: db "Wrong password!",0x0a,0

section .text

global main

main:
    call boot_up
    call exit

say_success:
    lea rdi, [rel _loggedin_msg]
    call print
    call exit

say_wrong:
    lea rdi, [rel wrong_pass_msg]
    call print
    ret

enter_password:
    lea rdi, [rel enter_pass_msg]
    call print
    sub rsp, 0x10
    mov rdi, rsp
    mov rsi, 0x20
    call read
    lea rsi, [rel password_ptr]
    mov rsi, [rsi]
    mov rdx, 0x10
    call strncmp
    add rsp, 0x10
    ret

boot_up:
    lea rdi, [rel booting_msg]
    call print
    call integrity_check
    lea rdi, [rel welcome_msg]
    call print
    password_loop:
    call enter_password
    cmp rax, 0
    je say_success
    call say_wrong
    jmp password_loop
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

strncmp:
    call _strncmp
    ret

malloc:
    call _malloc
    ret

extern _malloc
extern _rand
extern _strncmp