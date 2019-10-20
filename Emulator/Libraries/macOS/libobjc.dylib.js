import {MachOLoader} from "../../Loaders/MachOLoader.js";
import {Library} from "../Library.js";

export class libobjc extends Library {
    _objc_alloc() {
        alert("Oh hay there.");

        // Call calloc
        // this.cpu.call("_calloc");
        // let obj_pointer = this.cpu.registers.reg("rdi");
    }
}

MachOLoader.addLibraryAlias(
    "/usr/lib/libobjc.A.dylib",
    "../Libraries/macOS/binaries/libobjc.A.dylib"
);

MachOLoader.registerLibrary("libobjc", libobjc);