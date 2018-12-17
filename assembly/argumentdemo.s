BITS 64

main:
    mov rdi, string
    int 1
    int 3

string:
    db "Hello, world!",0x0a,0x00