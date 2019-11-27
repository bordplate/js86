import {Loader} from '../Loaders/Loader.js'

export class Metadata {
    constructor(assembly, loader) {
        this.assembly = assembly;
        this.loader = loader;

        this.addressInformation = {};
    }

    informationForAddress(address) {
        return this.addressInformation[address];
    }

    /**
     *
     * @param mnemonic string
     * @returns {boolean}
     */
    static isJumpInstruction(mnemonic) {
        let jumpMnemonics = [
            "je", "jne", "jmp", "call"
        ];

        return jumpMnemonics.includes(mnemonic)
    }

    static registerNames() {
        return [
            'RAX', 'EAX', 'AX', 'AH', 'AL',
            'RBX', 'EBX', 'BX', 'BH', 'BL',
            'RCX', 'ECX', 'CX', 'CH', 'CL',
            'RDX', 'EDX', 'DX', 'DH', 'DL',
            'RSI', 'ESI', 'SI', 'SIL',
            'RSP', 'ESP', 'SP', 'SPL',
            'RBP', 'EBP', 'BP', 'BPL',
            'RIP', 'EIP', 'IP',
            'RDI', 'EDI', 'DI',
            "R14"
        ];
    }

    processOpStr(op_str) {
        return this.opStrFunctions.map((func) => {
            // We've got to make sure we don't process things multiple times, otherwise weird things happen
            //  in the UI.
            // So we parse the HTML and avoid processing things where there is already an HTML node.
            let element = document.createElement("span");
            element.innerHTML = op_str;

            element.childNodes.forEach((node) => {
                if (!node.hasChildNodes()) {
                    let newElement = document.createElement("span");
                    newElement.innerHTML = func(node.textContent);

                    let nextSibling = node.nextSibling;

                    element.replaceChild(newElement.childNodes[0], node);

                    while (newElement.childNodes.length > 0) {
                        element.insertBefore(newElement.childNodes[0], nextSibling);
                    }
                }
            });

            op_str = element.innerHTML;

            return op_str;
        }).pop();
    }

    symbolName(address) {
        if (!this.loader) {
            return false;
        }

        for (let i = 0; i <= this.loader.symbolList.length; i++) {
            let symbol = this.loader.symbolList[i];

            if (symbol === undefined) {
                continue;
            }

            if (symbol.address === address) {
                return symbol;
            }
        }

        return false;
    }

    /**
     *
     * @returns {boolean}
     */
    analyze() {
        if (this.loader.visualCodeSize > 0) {
            this.codeSize = this.loader.visualCodeSize;
        }

        for (let i in this.assembly) {
            let instruction = this.assembly[i];

            let [address, mnemonic, op_str, size] = instruction;
            address = parseInt(address, 16);

            let addressInformation = this.addressInformation[address.toString(16)] !== undefined ?
                this.addressInformation[address.toString(16)] :
                {};


            addressInformation.processOpStr = this.processOpStr;
            addressInformation.opStrFunctions = addressInformation.opStrFunctions instanceof Array ?
                addressInformation.opStrFunctions :
                [];

            addressInformation.processedStrings = addressInformation.processedStrings instanceof Array ?
                addressInformation.processedStrings :
                [];

            // Push processing function that processes and styles all registers
            // When this is the first function in the opStrFunctions array, it will fire last
            addressInformation.opStrFunctions.push((op_str) => {
                let registerNames = Metadata.registerNames();
                for (let i in registerNames) {
                    let registerName = registerNames[i];
                    let occurences = op_str.split(registerName.toLowerCase()).length - 1;

                    for (let i = 0; i <= occurences; i++) {
                        op_str = op_str.replace(
                            registerName.toLowerCase(),
                            registerName.toUpperCase()
                        )
                    }
                }

                for (let i in registerNames) {
                    let registerName = registerNames[i];
                    let occurences = op_str.split(registerName).length - 1;

                    for (let i = 0; i <= occurences; i++) {
                        op_str = op_str.replace(
                            registerName.toUpperCase(),
                            `<span class="op_str-register">${registerName.toLowerCase()}</span>`
                        )
                    }
                }

                return op_str;
            });

            // Sets label for entrypoint
            if (address === this.loader.entrypoint) {
                addressInformation.label = true;
                addressInformation.labelName = "entrypoint";
                addressInformation.entrypoint = true;
            }

            // Sets label for symbols defined in binary (only applicable if using loaders, raw binaries do not have symbols)
            let symbol = this.symbolName(address);
            if (symbol !== false) {
                addressInformation.label = true;
                addressInformation.labelName = symbol.name;
                addressInformation.hasSymbol = true;
            }

            // Sets a label name for an address if the current mnemonic is some sort of jump instruction
            //   and there is no symbol name defined for this address.
            if (Metadata.isJumpInstruction(mnemonic)) {
                let destination = parseInt(op_str, 16);

                let destinationAddressInformation = this.addressInformation[destination.toString(16)] !== undefined ?
                    this.addressInformation[destination.toString(16)] :
                    {};

                if (!destinationAddressInformation.label) {
                    destinationAddressInformation.label = true;

                    // See if there might be a symbol at this address
                    let symbol = this.symbolName(destination);
                    if (symbol !== false) {
                        destinationAddressInformation.labelName = symbol.name;
                    } else {
                        destinationAddressInformation.labelName = `loc_${destination.toString(16)}`;
                    }
                }

                addressInformation.processOpStr = this.processOpStr;
                addressInformation.opStrFunctions = addressInformation.opStrFunctions instanceof Array ?
                    addressInformation.opStrFunctions :
                    [];

                addressInformation.opStrFunctions.push((op_str) => {
                    return op_str.replace(
                            "0x" + destination.toString(16),
                            `<span class="op_str-label">${destinationAddressInformation.labelName}</span>`
                        );
                });

                this.addressInformation[destination.toString(16)] = destinationAddressInformation;
            }

            addressInformation.opStrFunctions.push((op_str) => {
                let components = op_str.split(" ");

                for (let i in components) {
                    let component = components[i];
                    if (parseInt(component)) {
                        // Hack for int values where int is surrounded by [ and ] (for memload operations)
                        let comp = component.replace("[", "").replace("]","");
                        op_str = op_str.replace(comp, `<span class="op_str-number">${comp}</span>`);
                    }
                }

                return op_str;
            });

            // Resolve label for data resources like strings and objects
            addressInformation.opStrFunctions.unshift((op_str) => {
                let components = op_str.split("[");
                if (components.length > 1) {
                    let addressStr = components.slice(-1)[0].split("]")[0];
                    let addr = 0;

                    // We'll just cheat with the RIP relative addressing
                    if (addressStr.startsWith("rip + ")) {
                        addr = address + size + parseInt(addressStr.split(" ").slice(-1)[0], 16);
                    } else {
                        addr = parseInt(addressStr, 16);
                    }

                    let symbol = this.symbolName(addr);
                    if (symbol !== false) {
                        let str = `<span class="op_str-label">${symbol.name}</span>`;

                        // Stops other code from trying to process the same string again
                        addressInformation.processedStrings.push(str);

                        op_str = op_str.replace(addressStr, str);
                    }
                }

                return op_str;
            });

            this.addressInformation[address.toString(16)] = addressInformation;
        }

        return true;
    }
}