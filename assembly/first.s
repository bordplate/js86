BITS 64

main:
    mov     rbp, rsp
    sub     rbp, 0x20       ; Allocate 0x20 bytes for stack variables
    mov     eax, msg
    mov     rdi, rax
    call    alert
    call    getname
    mov     rax, rdi
    mov     ebx, sec
    mov     rdi, rbx
    call    printf
    int     3

getname:
    push    rbp
    mov     rbp, rsp
    sub     rbp, 0x20
    mov     eax, ebp
    mov     rsi, 0x200
    mov     rdi, rax
    call    input
    pop     rbp
    ret

alert:
    int     1
    ret

input:
    int     2
    ret

printf:
    int     4
    ret

wowhacked:
    mov     eax, hckd
    mov     rdi, rax
    call    alert
    ret

msg:
    db "Please type your name.",0
sec:
    db "Hello, %s, nice to meet you!",0
hckd:
    db "Oh, you sly motherfucker, you hacked it",0
