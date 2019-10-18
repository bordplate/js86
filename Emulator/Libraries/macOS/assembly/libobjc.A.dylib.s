BITS 64

section .data
_objc_alloc_str: db "_objc_alloc",0

framework_name: db "libobjc",0

section .text

_objc_alloc:
    push rdi
    push rax
    lea rdi, [rel _objc_alloc_str]
    lea rax, [rel framework_name]
    int 6
    pop rdi
    pop rax
    ret

_objc_release:
    int 3
    ret

_objc_msgSend:
    int 3
    ret