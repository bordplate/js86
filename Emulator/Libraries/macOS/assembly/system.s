BITS 64

section .data

_strncmp_name: db "_strncmp",0
_calloc_name: db "_calloc",0
_malloc_name: db "_malloc",0
_rand_name: db "_rand",0

framework_name: db "libSystem",0

_passing_through_str: db "Oh hai this is calloc",0x0a,0

heap_start_ptr: dq 0
heap_end_ptr: dq 0

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

; returns pointer to memory in rax
_malloc:
    push rdi
    push rax
    lea rdi, [rel _malloc_name]
    lea rax, [rel framework_name]
    int 6
    ret

_rand:
    push rdi
    push rax
    lea rdi, [rel _rand_name]
    lea rax, [rel framework_name]
    int 6
    ret

_strncmp:
    push rdi
    push rax
    lea rdi, [rel _strncmp_name]
    lea rax, [rel framework_name]
    int 6
    ret

__get_heap_start_ptr:
    lea rdi, [rel heap_start_ptr]
    ret

__get_heap_end_ptr:
    lea rdi, [rel heap_end_ptr]
    ret

__force_symbol:
    call __get_heap_start_ptr
    call __get_heap_end_ptr

global _rand
global _calloc
global dyld_stub_binder
global _malloc
global _strncmp
global __get_heap_start_ptr
global __get_heap_end_ptr