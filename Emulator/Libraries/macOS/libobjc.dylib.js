import {MachOLoader} from "../../Loaders/MachOLoader.js";
import {Library} from "../Library.js";

export class libobjc extends Library {
    _objc_alloc() {
        alert("Oh hay there.");
    }
}

MachOLoader.addLibraryAlias(
    "/usr/lib/libobjc.A.dylib",
    "../Libraries/macOS/binaries/libobjc.A.dylib"
);

MachOLoader.registerLibrary("libobjc", libobjc);