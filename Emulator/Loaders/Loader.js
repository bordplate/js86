import {CPU} from "../Processor/CPU.js";

/**
 * Base class for executable loaders.
 * Custom loaders could be for ELF, PE, Mach-O, etc.
 */
export class Loader {
    /**
     * Constructers, obvs.
     *
     * @param preferredMemorySize Memory size one would like to have, loaders don't have to follow this if it's
     *                              too little.
     */
    constructor(preferredMemorySize) {
        this.preferredMemorySize = preferredMemorySize;

        this.entrypoint = 0;
        this.codeStartOffset = 0;
        this.visualCodeSize = preferredMemorySize;
        this.vmOffset = 0;
    }

    /**
     * Loads and processes given binary
     *
     * @param binary
     */
    async loadBinary(binary) {
        this.binary = binary;
    }

    /**
     * Function for creating and returning CPU.
     */
    getCPU() {

    }

    /**
     * Registering a shared library class so that it can be called later.
     * Used by dynamic libraries that have a JavaScript counterpart
     *
     * @param name Library name
     * @param _class Library JavaScript class (should be a subclass of `Library`)
     */
    static registerLibrary(name, _class) {
        Loader.prototype.registeredLibrary[name] = _class;
    }

    /**
     * Get a previously registered library
     *
     * @param name Name of library
     * @returns {*} JavaScript subclass of `Library`, hopefully.
     */
    static getLibrary(name) {
        return Loader.prototype.registeredLibrary[name];
    }

    /**
     * Some loaders set up virtual memory regions and stuff, this function
     *  should traslate virtual addresses to "physical" addresses.
     *
     * @param address virtual address
     * @returns int physical address
     */
    translateAddress(address) {
        return address;
    }

    /**
     * Loads binary over internet async
     *
     * @param binaryPath Relative path of binary
     * @param callback Function to call when binary has been loaded
     */
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