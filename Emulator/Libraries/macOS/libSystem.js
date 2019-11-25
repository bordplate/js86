import {MachOLoader} from "../../Loaders/MachOLoader.js";
import {Library} from "../Library.js";
import {Struct} from "./js-struct/Struct.js";
import {Type} from "./js-struct/Type.js";

const MallocChunk = new Struct([
    Type.uint64('prev_foot'), // Size of previous chunk (if free).
    Type.uint64('head'),      // Size and inuse bits.
    Type.uint64('fd'),        // double links -- used only if free.
    Type.uint64('bk')
]);

export class libSystem extends Library {
    constructor(cpu) {
        if (libSystem.prototype.shared !== undefined) {
            return libSystem.prototype.shared;
        }

        super(cpu);

        this.heapStart = 0;
        this.heapEnd = 0;

        this.mcount = 0;

        libSystem.prototype.shared = this;

        this.cpu.onEnd(() => {
            // Delete "singleton" when CPU resets
            libSystem.prototype.shared = undefined;
        });
    }

    /**
     * Initialize the memory allocator.
     * We're using a (probably horribe) implementaion of Doug Lea's malloc.
     * I've used ptmalloc's source code documentation to implement this
     */
    initializeMemoryAllocator() {
        this.heapStart = this.cpu.loader.binary.length;
        this.heapEnd = this.cpu.memory.size() - 0x100;

        if (this.heapStart > this.heapEnd) {
            alert("Not enough memory to initialize heap. Weird shit might happen now.");

            return;
        }

        let prevRdi = this.cpu.registers.reg("rdi");

        this.cpu.call("__get_heap_start_ptr");
        let heapStartPtr = this.cpu.registers.reg("rdi");

        this.cpu.call("__get_heap_end_ptr");
        let heapEndPtr = this.cpu.registers.reg("rdi");

        this.cpu.memory.store(heapStartPtr, this.heapStart);
        this.cpu.memory.store(heapEndPtr, this.heapEnd);

        this.cpu.registers.setReg("rdi", prevRdi);

        // Add first free chunk to memory
        let chunkSize = (this.heapEnd - this.heapStart) | 0x2;  // Set PINUSE_BIT

        this.cpu.memory.store(this.heapStart,        chunkSize);
        this.cpu.memory.store(this.heapStart + 0x8,  0);            // Forward pointer (null)
        this.cpu.memory.store(this.heapStart + 0x10, 0);            // Backwards pointer (null)
    }


    /**
     * Returns true is mem allocator is already initialized
     *
     * @returns {boolean}
     */
    memoryAllocatorIsInitialized() {
        if (this.heapStart !== 0) {
            return true;
        }

        // Store original RDI value
        let prevRdi = this.cpu.registers.reg("rdi");

        this.cpu.call("__get_heap_start_ptr");
        let heapStartPtr = this.cpu.registers.reg("rdi");

        // Restore original RDI value
        this.cpu.registers.setReg("rdi", prevRdi);

        let heapStart = this.cpu.memory.loadUInt(heapStartPtr, 8).toNumber();

        if (heapStart !== 0) {
            this.heapStart = heapStart;
            return true;
        }

        return false;
    }

    /**
     * Pointer to next free memory area
     *
     * @param size int
     */
    nextFreePointer(size) {
        if (this.cpu.memallocinfo.allocatedRegions.length === 0) {
            return this.cpu.memallocinfo.heapStart;
        }
    }

    /**
     *
     *
     * @param chunk
     * @param size
     * @returns {boolean}
     */
    allocateChunk(chunk, size, ptr) {
        size = size | 0x3;   // Set PINUSE_BIT and CINUSE_BIT
                             // Previous chunk must be in use, otherwise we would
                             //    have merged

        this.cpu.memory.store(ptr - 0x8, size);

        let originalChunkSize = (chunk.head >> 2) << 2;  // Discard PINUSE_BIT and CINUSE_BIT

        if (size < originalChunkSize) {
            // Create new free block after this one
        }
    }

    _malloc() {
        if (!this.memoryAllocatorIsInitialized()) {
            this.initializeMemoryAllocator();
        }

        let requestSize = this.cpu.registers.reg("rdi");
        let size = (requestSize - (requestSize % 8) + 8);  // Allocated sizes are always word aligned

        var pointer = 0;  // Pointer we will return to user

        let firstChunk = (new MallocChunk()).read(this.cpu.memory.load(this.heapStart - 0x8, 32), 0);

        if ((firstChunk.head & 0x1) === 0 && firstChunk.fd === 0) {
            // First chunk is free and forward pointer is null, probably means this is the first allocation
            pointer = this.heapStart + 0x10;

            this.allocateChunk(firstChunk, size, pointer);
        }

        console.log("Allocating address: " + pointer.toString(16));
        this.cpu.registers.setReg("rax", pointer);
    }

    // Not cryptographically secure. At all.
    _rand() {
        this.cpu.registers.setReg("rax", Math.floor(Math.random() * 65535));
    }

    /**
     * calloc
     *
     * @private
     */
    _calloc() {
        if (this.cpu.memallocinfo === undefined) {
            this.initializeMemoryAllocator();
        }

        let nmemb = this.cpu.registers.reg("rdi");
        let size = this.cpu.registers.reg("rsi");

        let pointer = this.nextFreePointer(size);
        this.markUsedMemory(pointer, size);

        // Set all bytes in memory to 0
        this.cpu.memory.store(pointer, new Uint8Array(size));

        this.cpu.registers.setReg("rax", pointer);
    }

    _strncmp() {
        let str1_ptr = this.cpu.registers.reg("rdi");
        let str2_ptr = this.cpu.registers.reg("rsi");
        let num = this.cpu.registers.reg("rdx");

        let str1 = this.cpu.memory.loadString(str1_ptr, "\0").slice(0, num);
        let str2 = this.cpu.memory.loadString(str2_ptr, "\0").slice(0, num);

        if (str1 === str2) {
            this.cpu.registers.setReg("rax", 0);
        } else {
            this.cpu.registers.setReg("rax", 1);
        }
    }
}

MachOLoader.addLibraryAlias(
    "/usr/lib/libSystem.B.dylib",
    "../Libraries/macOS/binaries/libSystem.B.dylib"
);

MachOLoader.registerLibrary("libSystem", libSystem);

const Inode = Struct([
    Type.uint16('mode'),
    Type.uint16('uid'),
    Type.uint32('size'),
    Type.uint16('gid'),
    Type.uint32('flags')
]);