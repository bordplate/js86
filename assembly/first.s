BITS 64

main:
    call    getalert
    int     3

getalert:
    push    rbp
    mov     rbp, rsp
    mov     eax, msg
    mov     rdi, rax
    call    alert
    mov     eax, sec
    mov     rdi, rax
    call    alert
    pop     rbp
    ret

alert:
    int     1
    ret

wowhacked:
    mov     eax, hckd
    mov     rdi, rax
    call    alert
    ret

msg:
    db "Hello, World!",0
sec:
    db "Second message, just to test",0
hckd:
    db "Oh, you sly motherfucker, you hacked it",0
