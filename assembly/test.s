BITS 64
; Just testing that I made the right assumptions about the stack pointer
main:
    mov rax, 0x4141414141414141
    int 3