import {MachOLoader} from "../../Loaders/MachOLoader.js";
import {Library} from "../Library.js";

export class libSystem extends Library {

}

MachOLoader.addLibraryAlias(
    "/usr/lib/libSystem.B.dylib",
    "../Libraries/macOS/binaries/libSystem.B.dylib"
);

MachOLoader.registerLibrary("libSystem", libSystem);