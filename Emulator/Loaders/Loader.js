import {CPU} from "../Processor/CPU.js";

export class Loader {
    constructor(preferredMemorySize) {
        this.preferredMemorySize = preferredMemorySize;

        this.entrypoint = 0;
        this.codeStartOffset = 0;
        this.visualCodeSize = preferredMemorySize;
        this.vmOffset = 0;
    }

    async loadBinary(binary) {
        this.binary = binary;
    }

    getCPU() {

    }

    static registerLibrary(name, _class) {
        Loader.prototype.registeredLibrary[name] = _class;
    }

    static getLibrary(name) {
        return Loader.prototype.registeredLibrary[name];
    }

    translateAddress(address) {
        return address;
    }

    static loadBinary(binaryPath, callback) {
        let url = import.meta.url.substr(0, import.meta.url.lastIndexOf("/")) + "/" + binaryPath;

        const request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        request.onload = (event) => {
            const binary = request.response;

            if (!binary) {
                throw CPUError(`Could not load binary from path: ${binaryPath}`);
            }

            callback(new Uint8Array(binary));
        };

        request.send(null);
    }
}

Loader.prototype.registeredLibrary = {};