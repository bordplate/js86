BITS 64

start:
    mov rcx, qword 0x10
    mov qword [0x20], rcx
    mov rax, [0x20]
    int 3

test:
    db 0,"BCDEFGHIJKL",0,0,0,0,"QRSTU",0