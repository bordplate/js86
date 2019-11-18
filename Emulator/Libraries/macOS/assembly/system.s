BITS 64

section .data

_calloc_name: db "_calloc",0

framework_name: db "libSystem",0

_passing_through_str: db "Oh hai this is calloc",0x0a,0

section .text

dyld_stub_binder:
    ret

; returns pointer to memory in rax
_calloc:
    push rdi
    lea rdi, [rel _passing_through_str]
    int 1
    lea rdi, [rel _calloc_name]
    lea rax, [rel framework_name]
    int 6
    pop rdi
    ret

global _calloc
global dyld_stub_binder