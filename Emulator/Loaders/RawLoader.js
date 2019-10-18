import {Loader} from './Loader.js';
import {CPU} from "../Processor/CPU.js";

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