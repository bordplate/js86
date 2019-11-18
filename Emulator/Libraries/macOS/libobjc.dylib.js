import {MachOLoader} from "../../Loaders/MachOLoader.js";
import {Library} from "../Library.js";

import {ObjectiveCHelper} from "./ObjectiveCHelper.js";


export class libobjc extends Library {
    _objc_alloc() {
        // Call calloc
        if (this.cpu.registers.reg("rdi") === 0) {
            this.cpu.registers.setReg("eax", 0);

            return;
        }

        this.__objc_rootAllocWithZone();
    }

    __objc_rootAllocWithZone() {
        let classRef = this.cpu.registers.reg("rdi");

        this.cpu.registers.setReg("rdi", 1);
        this.cpu.registers.setReg("rsi", 0);
        this.cpu.call("_calloc");
        let obj_pointer = this.cpu.registers.reg("rax");

        alert("obj_pointer: 0x" + obj_pointer.toString(16));
    }
}

MachOLoader.addLibraryAlias(
    "/usr/lib/libobjc.A.dylib",
    "../Libraries/macOS/binaries/libobjc.A.dylib"
);

MachOLoader.registerLibrary("libobjc", libobjc);