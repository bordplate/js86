/**
 *  TODO: RWX protections for memory regions.
 *  Don't know particularly how protections are implemented in real world though.
 */
export class Memory {
    constructor(size) {
        this.memory = new Uint8Array(size);
    }

    store(offset, data) {
        this.memory.set(data, offset);
    }

    load(offset, size) {
        return this.memory.subarray(offset, offset + size);
    }

    loadUInt(offset, size) {
        var uintarray = this.load(offset, size);

        var uint = 0x0;
        uintarray.forEach((number) => {
            uint += number;
        });

        return uint;
    }

    loadUntil(offset, character) {
        let retVal = [];

        let subarray = this.memory.subarray(offset);

        var stop = false;
        subarray.forEach((value) => {
            if (stop) {
                return;
            }

            retVal.push(value);

            if (value == character) {
                stop = true;
            }
        });

        return retVal;
    }
}