import {Loader} from './Loader.js';
import {KaitaiGlue} from './kaitai/KaitaiGlue.js';
import {CPU} from "../Processor/CPU.js";

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
        this.sections = [];

        this.dyld_info = false;

        this.masterLoader = null;
        this.binaryOffset = 0;

        this.machoSymbols = {};

        KaitaiGlue.loadKaitai();
        KaitaiGlue.load("MachO");
    }

    /**
     * Libraries in Mach-Os are specified by absolute path, which doesn't
     *  work very well for most web apps. So dylibs will specify their real path
     *  as an alias.
     *
     * @param name
     * @param alias
     */
    static addLibraryAlias(name, alias) {
        MachOLoader.prototype.libraryAliases[name] = alias;
    }

    /**
     * Getting the real path of a library instead of OS absolute path.
     * For paths not registered with an alias we append "../Libraries/" to enter
     *  the libraries folder. This is our best bet for getting the correct libraries loaded.
     *
     * @param name
     * @returns {*}
     */
    static getLibrary(name) {
        return MachOLoader.prototype.libraryAliases[name] !== undefined ?
            MachOLoader.prototype.libraryAliases[name] :
            "../Libraries/" + name;
    }

    bindSymbol(dylibNum, symbol, trailingFlags, type, segment, offset, scale) {
        let dylib = this.libraries[dylibNum - 1];
        let localAddress = this.segments[segment].fileoff + offset + this.binaryOffset;

        if (dylib.loader.machoSymbols[symbol] === undefined) {
            console.log("Could not find symbol: " + symbol);
            return;
        }

        let dylibAddress = dylib.loader.machoSymbols[symbol].value + dylib.address;

        console.log(`Loading ${symbol} into 0x${localAddress.toString(16)} from 0x${dylibAddress.toString(16)} in ${dylib.loader.name}`);
        console.log(`\tIntended file offset: ${(dylib.loader.machoSymbols[symbol].value).toString(16)}`)

        this.masterLoader.symbolList.push({name: symbol, address: localAddress, type: "text"});

        let addressValue = dylibAddress.toString(16)
            .padStart(8 * 2, "0")
            .match(/.{1,2}/g)
            .map((val) => {
                    return parseInt(val, 16);
                }
            );

        // Perform binding on the master binary.
        this.masterLoader.binary.set(addressValue, localAddress);

        // Register symbol
        this.masterLoader.symbols[symbol] = dylibAddress;
    }

    /**
     * Translate virtual address to physical address.
     *
     * @param address
     * @returns {number}
     */
    translateAddress(address) {
        return address - this.pageZeroSize;
    }

    // Cheat for being able to sleep execution a bit
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Returns a library if it is already loaded.
     *
     * @param name
     * @param hash
     * @returns {null|*}
     */
    libraryAlreadyLoaded(name, hash) {
        for(let i = 0; i < this.libraries.length; i++) {
            let library = this.libraries[i];

            if (library === {}) {
                continue;
            }

            if (library.name === name) {
                return library;
            }

            if (library.hash === hash) {
                return library;
            }
        }

        return null;
    }

    /**
     * Processes load commands and dynamic linking for binary.
     *
     * @param binary
     * @returns {Promise<*>}
     */
    async loadBinary(binary) {
        this.masterLoader = this.masterLoader === null ? this : this.masterLoader;

        // Wait for Kaitai Mach-O class to load.
        while(typeof MachO === "undefined" || typeof KaitaiStream === "undefined" || KaitaiGlue.prototype.loaded["MachO"] !== true) {
            await this.sleep(100);
        }

        this.binary = binary;

        try {
            this.macho = new MachO(new KaitaiStream(binary));
        } catch (TypeError) {
            if (!document.failedLoadingLoaderBullshit) {
                document.failedLoadingLoaderBullshit = true;

                alert("A component for the emulator was not loaded properly. Refresh your browser to retry.");
            }

            return;
        }

        // Process load commands.
        // I don't think load commands should need to be in a particular order,
        //  but segments will definitely be way off if they're in a weird order in the binary.
        await this.macho.loadCommands.forEach((loadCommand) => {
            // Parse segments to figure out how much RAM we need and stuff
            if (loadCommand.type === MachO.LoadCommandType.SEGMENT_64 || loadCommand.type === MachO.LoadCommandType.SEGMENT) {
                this.minimumRam += loadCommand.body.filesize;
                this.segments.push(loadCommand.body);

                // __PAGEZERO is usually 4GB of virtual memory in 64-bit binaries,
                //  but that doesn't work with Capstone, so we just ignore it tbh.
                // It's basically used for making sure null pointer references don't
                //  do any harm. We could set it to 4KB or something, but I don't care.
                if (loadCommand.body.segname === "__PAGEZERO") {
                    this.pageZeroSize = loadCommand.body.vmsize;
                    this.vmOffset = loadCommand.body.vmsize;
                }

                loadCommand.body.sections.forEach((section) => {
                    this.sections.push(section);

                    if (section.sectName === "__text") {
                        this.codeStartOffset = section.offset;
                        this.visualCodeSize = section.size;
                    }

                    if (section.sectName === "__stubs") {
                        this.visualCodeSize += section.size;
                    }
                });

                // TODO: Load memory protections in segments (rwx, etc) when CPU supports that.
            }

            if (loadCommand.type === MachO.LoadCommandType.MAIN) {
                this.entrypoint += loadCommand.body.entryOff;
            }

            if (loadCommand.type === MachO.LoadCommandType.SYMTAB) {
                let sortedSymbols = loadCommand.body.symbols.sort((a, b) => {
                    return a.un - b.un;
                }).filter((symbol) => {
                    return symbol !== undefined && symbol.un !== 1;  // We should ignore these
                });

                let sanitizedSymbolNames = loadCommand.body.strs.items.filter((name) => {
                    return name !== " ";  // Very annoying. I believe this is a bug in the MachO-parser, but who knows
                });

                sanitizedSymbolNames.forEach((name, i) => {
                    if (sortedSymbols[i] === undefined) {
                        return;
                    }

                    this.machoSymbols[name] = sortedSymbols[i];
                });
            }

            // Load external libraries (dylibs)
            // TODO: Don't load libraries that are already loaded previously (e.g. when
            //   libSystem is loaded in main binary and libobjc)
            // It is important that libraries are loaded in the right order
            if (loadCommand.type === MachO.LoadCommandType.LOAD_DYLIB) {
                let loadedLib = this.masterLoader.libraryAlreadyLoaded(loadCommand.body.name, null);
                if (loadedLib !== null) {
                    console.log("Based on name, skipped loading " + loadCommand.body.name);

                    this.libraries.push(loadedLib);

                    return;
                }

                this.loadingLibraries += 1;

                this.libraries.push({});  // Reserve a spot for our library
                let libraryPosition = this.libraries.length - 1;

                MachOLoader.loadBinary(MachOLoader.getLibrary(loadCommand.body.name), async (library) => {
                    let loadedLib = this.masterLoader.libraryAlreadyLoaded(loadCommand.body.name, hashCode(library));
                    if (loadedLib !== null) {
                        console.log("Based on hash, skipped loading " + loadCommand.body.name);
                        this.loadingLibraries -= 1;

                        this.libraries[libraryPosition] = loadedLib;

                        return;
                    }

                    await this.addLibrary(loadCommand.body.name, library, libraryPosition);

                    this.loadingLibraries -= 1;
                });
            }

            if (loadCommand.type === MachO.LoadCommandType.DYLD_INFO_ONLY) {
                this.dyld_info = loadCommand.body;
            }
        });

        // Library binaries are loaded async, so we need to make sure
        //  they're loaded before progress.
        while(this.loadingLibraries > 0) {
            await this.sleep(100);
        }

        if (this === this.masterLoader) {
            this.resolveSymbols();

            await this.libraries.forEach((library) => {
                library.loader.resolveSymbols();
            });
        }

        return this.binary;
    }

    /**
     * Resolve symbols from other binaries
     * This is a bit of a state machine thing with opcodes and stuff,
     *  it's weird.
     * Also, it's very basic, it definitely does not resolve everything correctly.
     */
    resolveSymbols() {
        if (this.dyld_info !== false) {
            let dylibNum = 0;
            let symbol = "";
            let trailingFlags = 0;
            let type = 0;
            let segment = 0;
            let offset = 0;

            let bindFunc = (item) => {
                let scale = 1;

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

            this.dyld_info.bind.items.forEach(bindFunc);
            this.dyld_info.lazyBind.items.forEach(bindFunc);
        }
    }

    /**
     * Adds a new library to list of libraries and appends it to master binary.
     *
     * @param name
     * @param binary
     * @returns {Promise<void>}
     */
    async addLibrary(name, binary, libraryPosition) {
        let dylib = new MachOLoader(0, name);
        dylib.masterLoader = this.masterLoader;
        await dylib.loadBinary(binary);

        let dylibAddress = this.masterLoader.appendBinary(binary);
        dylib.binaryOffset = dylibAddress;

        let libraryData = {
            "loader": dylib,
            "address": dylibAddress,
            "hash": hashCode(binary)
        };

        this.libraries[libraryPosition] = libraryData;

        console.log(`Loaded library: ${name} at address 0x${libraryData.address.toString(16)}`);
    }

    /**
     * Adds a binary to the end of the current binary.
     * Returns start address of new binary.
     *
     * @param binary
     * @returns {number} Address to start of binary
     */
    appendBinary(binary) {
        let appendedBinaryStartAddress = this.binary.length;

        let newBinary = new Uint8Array(this.binary.length + binary.length);
        newBinary.set(this.binary, 0);
        newBinary.set(binary, this.binary.length);

        this.binary = newBinary;

        return appendedBinaryStartAddress;
    }

    /**
     * Generate local symbol table that fits the general
     *  API used by the CPU emulator.
     *
     * It's currently very wrong
     *
     *
     * The n_type field really contains four fields:
     *	unsigned char N_STAB:3,
     *		      N_PEXT:1,
     *		      N_TYPE:3,
     *		      N_EXT:1;
     * which are used via the following masks.
     * #define	N_STAB	0xe0  // if any of these bits set, a symbolic debugging entry
     * #define	N_PEXT	0x10  // private external symbol bit
     * #define	N_TYPE	0x0e  // mask for the type bits
     * #define	N_EXT	0x01  // external symbol bit, set for external symbols
     *
     * Only symbolic debugging entries have some of the N_STAB bits set and if any
     * of these bits are set then it is a symbolic debugging entry (a stab).  In
     * which case then the values of the n_type field (the entire field) are given
     * in <mach-o/stab.h>
     *
     * Values for N_TYPE bits of the n_type field.
     * #define	N_UNDF	0x0		// undefined, n_sect == NO_SECT
     * #define	N_ABS	0x2		// absolute, n_sect == NO_SECT
     * #define	N_SECT	0xe		// defined in section number n_sect
     * #define	N_PBUD	0xc		// prebound undefined (defined in a dylib)
     * #define N_INDR	0xa		// indirect
     *
     */
    generateSymbolList() {
        for (let i = 0; i < this.libraries.length; i++) {
            let loader = this.libraries[i].loader;

            loader.generateSymbolList();

            this.symbolList = this.symbolList.concat(loader.symbolList);
        }

        this.symbolList = this.symbolList.concat(Object.keys(this.machoSymbols).map((key) => {
            if(!this.machoSymbols.hasOwnProperty(key) || key === "") {
                return;
            }

            let sym = this.machoSymbols[key];
            let type = "text"; // Just default to text cuz idc
            let address = 0;

            if (this.sections[sym.sect-1] !== undefined) {
                type = this.sections[sym.sect-1].segName.replace("__", "").toLowerCase();  // Super cheaty way of setting symbol type
            }

            // Resolve address (we just care about section relative and absolute atm)
            // I have no idea what's going on here. Despite the code and documentation I
            //   can find, it seems like the symbols are always at absolute address????
            let n_type = sym.type & 0xe;
            if (n_type > 0) {
                if (n_type === 0xe) {  // Section relative address
                    let section = this.sections[sym.sect-1];
                    if (section === undefined) {
                        address = sym.value - this.pageZeroSize; // If section is undefined, fuck that bullshit
                    } else {
                        address = sym.value - this.pageZeroSize;
                    }
                } else if (n_type === 0x2) {
                    address = sym.value - this.pageZeroSize; // Because we ignore the whole page zero
                                                              //  at load time we need to subtract it from symbol address
                }
            }

            // External symbol
            // We've already resolved this
            if ((sym.type & 0x1) === 0x1 && this.symbols[key] !== undefined) {
                address = this.symbols[key]
            }

            return {
                name: key,
                type: type,
                address: address + this.binaryOffset
            };
        })); // Fake local symbols
    }

    /**
     * Creates CPU with enough memory, sets RIP to entrypoint.
     *
     * @returns {CPU}
     */
    getCPU() {
        this.generateSymbolList();

        let cpu = new CPU(this.preferredMemorySize > this.minimumRam ? this.preferredMemorySize : this.minimumRam);
        cpu.loader = this;
        cpu.loadCode(this.binary);
        cpu.registers.setReg("RIP", this.entrypoint);

        return cpu;
    }
}

// Used for checking if a library is already loaded
let hashCode = (array) => {
    let hash = 0;
    if (array.length === 0) {
        return hash;
    }
    for (let i = 0; i < array.length; i++) {
        let char = array[i];
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

MachOLoader.prototype.libraryAliases = {};