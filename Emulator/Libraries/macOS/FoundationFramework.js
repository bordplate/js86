import {MachOLoader} from "../../Loaders/MachOLoader.js";
import {Library} from "../Library.js";

export class FoundationFramework extends Library {

}

MachOLoader.addLibraryAlias(
    "/System/Library/Frameworks/Foundation.framework/Versions/C/Foundation",
    "../Libraries/macOS/binaries/Foundation"
);

MachOLoader.registerLibrary("Foundation", FoundationFramework);