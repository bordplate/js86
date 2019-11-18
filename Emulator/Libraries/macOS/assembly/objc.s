BITS 64

section .data
_objc_alloc_str: db "_objc_alloc",0
__objc_rootAllocWithZone_str: db "__objc_rootAllocWithZone",0

framework_name: db "libobjc",0

_objc_release_str: db "Oh no, this is _objc_release",0x0a, 0
_objc_msgSend_str: db "Oh no, this is _objc_msgSend",0x0a, 0

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

__objc_rootAllocWithZone:
    push rdi
    push rax
    lea rdi, [rel __objc_rootAllocWithZone_str]
    lea rax, [rel framework_name]
    int 6
    pop rdi
    pop rax
    ret

_objc_release:
    lea rdi, [rel _objc_release_str]
    int 1
    int 3
    ret

_objc_msgSend:
    lea rdi, [rel _objc_msgSend_str]
    int 1
    int 3
    ret

force_load:
    call _calloc

global _objc_alloc
global _objc_release
global _objc_msgSend
global __objc_rootAllocWithZone

extern _calloc