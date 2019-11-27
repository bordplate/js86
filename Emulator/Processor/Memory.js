import {Int64} from './Int64.js'
import {CPUError} from "./CPU.js";

export class OutOfBoundsLoad extends Error {}

/**
 *  TODO: RWX protections for memory regions.
 *  Don't know particularly how protections are implemented in real world though.
 */
export class Memory {
    constructor(size) {
        this.memory = new Uint8Array(size);
        this.subscribers = [];
    }

    /**
     * Subscribe to changes in memory
     */
    subscribe(callback) {
        this.subscribers.push(callback);
    }

    size() {
        return this.memory.length;
    }

    notify() {
        for (let i in this.subscribers) {
            this.subscribers[i]();
        }
    }

    store(offset, data, size = 8) {
        if (!isNaN(data)) {
            // Convert integer to Uint8Array, basically. 
            data = data
                .toString(16)
                .padStart(size * 2, "0")
                .match(/.{1,2}/g)
                .map((val) => {
                        return parseInt(val, 16);
                    }
                );
        }

        try {
            this.memory.set(data, offset);
        } catch (error) {
            if (error instanceof RangeError) {
                throw new CPUError("Data too large to store in memory.");
            }
        }

        // Notify subscribers that memory has changed.
        this.notify();
    }

    load(offset, size) {
        if ((offset + size) > this.memory.length) {
            throw new CPUError(`Can not load memory at address ${(offset+size).toString(16)}. Memory out of bounds.`);
        }

        return this.memory.subarray(offset, offset + size);
    }

    loadUInt(offset, size) {
        let uintarray = this.load(offset, size);

        /*var uint = BigInt(0x00);
        var i = 1;
        uintarray.forEach((number) => {
            uint ^= (BigInt(number) * BigInt((Math.pow(0x100, i))));
            i += 1;
        });*/

        let uint = new Int64(uintarray);

        return uint;
    }

    loadUntil(offset, character) {
        let retVal = [];

        let subarray = this.memory.subarray(offset);

        let stop = false;
        for (let i in subarray) {
            let value = subarray[i];
            if (stop) {
                break;
            }

            if (value == character) {
                stop = true;
            } else {
                retVal.push(value);
            }
        }

        return retVal;
    }

    loadString(offset, stringTerminator) {
        let messageArray = this.loadUntil(offset, stringTerminator);

        let message = "";
        for (let i in messageArray) {
            let byte = messageArray[i];
            message += String.fromCharCode(byte);
        }

        return message;
    }
}