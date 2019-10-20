import {Loader} from './Loader.js';
import {CPU} from "../Processor/CPU.js";

/**
 * Loads raw binaries, sets entrypoint to 0
 * Doesn't support dynamic libraries, but it's probably possible to load pure JavaScript libraries,
 *  that can be called with int 6.
 */
export class RawLoader extends Loader {
    constructor(preferredMemorySize) {
        super(preferredMemorySize);
    }

    getCPU() {
        this.cpu = new CPU(this.preferredMemorySize);
        this.cpu.loadCode(this.binary);
        this.cpu.loader = this;

        return this.cpu;
    }
}