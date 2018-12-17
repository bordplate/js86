BITS 64

main:
    sub rsp, 0x18
    call printprompt
    call getname
    int 3

printprompt:
    push rdi
    mov rdi, prompt
    call print
    pop rdi
    ret

getname:
    push rbp
    mov rbp, rsp
    sub rsp, 0x10
    mov rdi, rsp
    mov rsi, 0x38
    int 2
    mov rsp, rbp
    pop rbp
    ret

print:
    int 1
    ret

prompt:
    db "Please type your name: ",0x0a,0x00

hckd:
    db "This is ROP.",0x0a,0x00