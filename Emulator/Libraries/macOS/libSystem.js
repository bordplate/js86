import {MachOLoader} from "../../Loaders/MachOLoader.js";
import {Library} from "../Library.js";

export class libSystem extends Library {
    /**
     * Initialize the memory allocator.
     * We're cheating with the memory allocation metadata,
     *  instead of putting the metadata in the process RAM,
     *  we're just adding it as a JavaScript object to the CPU
     *  object.
     */
    initializeMemoryAllocator() {
        let heapStart = this.cpu.loader.binary.length;
        let heapEnd = this.cpu.memory.size() - 0x100;

        if (heapStart > heapEnd) {
            alert("Not enough memory to initialize heap.");
        }

        this.cpu.memallocinfo = {
            "heapStart": heapStart,
            "heapEnd": heapEnd,
            "allocatedRegions": []
        }
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
     * @param pointer
     * @param size
     * @returns {boolean}
     */
    markUsedMemory(pointer, size) {
        if (pointer === 0) {
            return false;
        }

        this.cpu.memallocinfo.allocatedRegions.push({
            "start": pointer,
            "end": pointer + size
        });
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
}

MachOLoader.addLibraryAlias(
    "/usr/lib/libSystem.B.dylib",
    "../Libraries/macOS/binaries/libSystem.B.dylib"
);

MachOLoader.registerLibrary("libSystem", libSystem);