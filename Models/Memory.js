import {Int64} from './Int64.js'

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

    notify() {
        this.subscribers.forEach((subscriber) => {
            subscriber();
        });
    }

    store(offset, data) {
        this.memory.set(data, offset);

        // Notify subscribers that memory has changed.
        this.notify();
    }

    load(offset, size) {
        if ((offset + size) > this.memory.length) {
            throw new OutOfBoundsLoad(`❌: Can not load memory at address ${(offset+size).toString(16)}. Memory out of bounds.`);
        }

        return this.memory.subarray(offset, offset + size);
    }

    loadUInt(offset, size) {
        var uintarray = this.load(offset, size);

        /*var uint = BigInt(0x00);
        var i = 1;
        uintarray.forEach((number) => {
            uint ^= (BigInt(number) * BigInt((Math.pow(0x100, i))));
            i += 1;
        });*/

        var uint = new Int64(uintarray);

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

            if (value == character) {
                stop = true;
            } else {
                retVal.push(value);
            }
        });

        return retVal;
    }

    loadString(offset, stringTerminator) {
        let messageArray = this.loadUntil(offset, stringTerminator);

        var message = "";
        messageArray.forEach((byte) => {
            message += String.fromCharCode(byte);
        });

        return message;
    }
}