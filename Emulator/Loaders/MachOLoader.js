import {Loader} from './Loader.js';
import {KaitaiGlue} from './kaitai/KaitaiGlue.js';
import {CPU} from "../Processor/CPU.js";
import {Int64} from '../Processor/Int64.js';

export class MachOLoader extends Loader {
    constructor(preferredMemorySize, name = "main") {
        super(preferredMemorySize);
        this.name = name;

        this.macho = undefined;
        this.minimumRam = 0;

        this.pageZeroSize = 0;

        this.loadingLibraries = 0;
        this.libraries = [];
        this.segments = [];

        this.dyld_info = false;

        this.symbols = {};

        KaitaiGlue.loadKaitai();
        KaitaiGlue.load("MachO");
    }

    static addLibraryAlias(name, alias) {
        MachOLoader.prototype.libraryAliases[name] = alias;
    }

    static getLibrary(name) {
        return MachOLoader.prototype.libraryAliases[name];
    }

    bindSymbol(dylibNum, symbol, trailingFlags, type, segment, offset, scale) {
        let dylib = this.libraries[dylibNum - 1];
        let localAddress = this.segments[segment].fileoff + offset;

        if (dylib.loader.symbols[symbol] === undefined) {
            console.log("Could not find symbol: " + symbol);
            return;
        }

        let dylibAddress = dylib.loader.symbols[symbol].value + dylib.address;

        console.log(`Loading ${symbol} into 0x${localAddress.toString(16)} from 0x${dylibAddress.toString(16)} in ${dylib.loader.name}`);

        let addressValue = dylibAddress.toString(16)
            .padStart(8 * 2, "0")
            .match(/.{1,2}/g)
            .map((val) => {
                    return parseInt(val, 16);
                }
            );

        this.binary.set(addressValue, localAddress);
    }

    translateAddress(address) {
        return address - this.pageZeroSize;
    }

    timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async loadBinary(binary) {
        while(typeof MachO === "undefined") {
            await this.timeout(100);
        }

        this.binary = binary;

        this.macho = new MachO(new KaitaiStream(binary));

        await this.macho.loadCommands.forEach((loadCommand) => {
            // Parse segments to figure out how much RAM we need and stuff
            if (loadCommand.type === MachO.LoadCommandType.SEGMENT_64 || loadCommand.type === MachO.LoadCommandType.SEGMENT) {
                this.minimumRam += loadCommand.body.filesize;
                this.segments.push(loadCommand.body);

                if (loadCommand.body.segname === "__PAGEZERO") {
                    this.pageZeroSize = loadCommand.body.vmsize;
                    this.vmOffset = loadCommand.body.vmsize;
                }

                if (loadCommand.body.segname === "__TEXT") {
                    loadCommand.body.sections.forEach((section) => {
                        if (section.sectName === "__text") {
                            this.codeStartOffset = section.offset;
                            this.visualCodeSize = 0x1000;
                        }
                    });
                }
            }

            if (loadCommand.type === MachO.LoadCommandType.MAIN) {
                this.entrypoint += loadCommand.body.entryOff;
            }

            if (loadCommand.type === MachO.LoadCommandType.SYMTAB) {
                loadCommand.body.strs.items.forEach((name, i) => {
                    this.symbols[name] = loadCommand.body.symbols[i];
                });
            }

            // Load external libraries (dylibs)
            if (loadCommand.type === MachO.LoadCommandType.LOAD_DYLIB) {
                this.loadingLibraries += 1;

                Loader.loadBinary(MachOLoader.getLibrary(loadCommand.body.name), async (library) => {
                    let dylib = new MachOLoader(0, loadCommand.body.name);
                    await dylib.loadBinary(library);

                    let newBinary = new Uint8Array(this.binary.length + library.length);
                    newBinary.set(this.binary, 0);
                    newBinary.set(library, this.binary.length);
                    this.binary = newBinary;

                    let libraryData = {"loader": dylib, "address": this.binary.length - dylib.binary.length};
                    this.libraries.push(libraryData);

                    console.log(`Loaded library: ${loadCommand.body.name} at address 0x${libraryData.address.toString(16)}`);

                    this.loadingLibraries -= 1;
                });
            }

            if (loadCommand.type === MachO.LoadCommandType.DYLD_INFO_ONLY) {
                this.dyld_info = loadCommand.body;
            }
        });

        while(this.loadingLibraries > 0) {
            await this.timeout(100);
        }

        // Resolve symbols from other binaries
        if (this.dyld_info !== false) {
            var dylibNum = 0;
            var symbol = "";
            var trailingFlags = 0;
            var type = 0;
            var segment = 0;
            var offset = 0;

            let bindFunc = (item) => {
                var scale = 1;

                switch(item.opcode) {
                    case MachO.DyldInfoCommand.BindOpcode.SET_DYLIB_ORDINAL_IMMEDIATE:
                        dylibNum = item.immediate;
                        break;
                    case MachO.DyldInfoCommand.BindOpcode.SET_SYMBOL_TRAILING_FLAGS_IMMEDIATE:
                        symbol = item.symbol;
                        trailingFlags = item.immediate;
                        break;
                    case MachO.DyldInfoCommand.BindOpcode.SET_TYPE_IMMEDIATE:
                        type = item.immediate;
                        break;
                    case MachO.DyldInfoCommand.BindOpcode.SET_SEGMENT_AND_OFFSET_ULEB:
                        segment = item.immediate;
                    case MachO.DyldInfoCommand.BindOpcode.ADD_ADDRESS_ULEB:
                        offset = item.uleb.value;
                        break;
                    case MachO.DyldInfoCommand.BindOpcode.DO_BIND_ADD_ADDRESS_IMMEDIATE_SCALED:
                        scale = item.immediate;
                    case MachO.DyldInfoCommand.BindOpcode.DO_BIND:
                        this.bindSymbol(dylibNum, symbol, trailingFlags, type, segment, offset, scale);
                        offset += 8;
                        break;
                }
            };

            await this.dyld_info.bind.items.forEach(bindFunc);
            await this.dyld_info.lazyBind.items.forEach(bindFunc);
        }

        return binary;
    }

    getCPU() {
        let alloc = new Int64(this.binary.subarray(8192, 8192 + 8));
        console.log(`_objc_alloc should be at: ${alloc.toString(16)}`);

        let cpu = new CPU(this.preferredMemorySize > this.minimumRam ? this.preferredMemorySize : this.minimumRam);
        cpu.loader = this;
        cpu.loadCode(this.binary);
        cpu.registers.setReg("RIP", this.entrypoint);
        return cpu;
    }
}

MachOLoader.prototype.libraryAliases = {};