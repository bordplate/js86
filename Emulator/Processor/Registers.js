import {Register} from './Register.js'
import {CPUError} from "./CPU.js";

export class Registers {
    constructor() {
        this.registers = [
            new Register('RAX', 'EAX', 'AX', 'AH', 'AL'),
            new Register('RBX', 'EBX', 'BX', 'BH', 'BL'),
            new Register('RCX', 'ECX', 'CX', 'CH', 'CL'),
            new Register('RDX', 'EDX', 'DX', 'DH', 'DL'),
            new Register('RSI', 'ESI', 'SI', null, 'SIL'),
            new Register('RSP', 'ESP', 'SP', null, 'SPL'),
            new Register('RBP', 'EBP', 'BP', null, 'BPL'),
            new Register('RIP', 'EIP', 'IP', null, null),
            new Register('RDI', 'EDI', 'DI', null, null),
            new Register('R14', null, null, null, null),
            new Register("RFLAGS", "EFLAGS", "FLAGS", null, null)
        ];

        this.regCache = {};

        this.subscribers = [];
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notify(reg, value) {
        for(let i = 0; i < this.subscribers.length; i++) {
            let callback = this.subscribers[i];

            try {
                callback(reg, value);
            } catch (exception) {
                console.log(exception);
            }
        }
    }

    notifyAll() {
        this.subscribers.forEach((callback) => {
            this.registers.forEach((register) => {
                try {
                    callback(register.name64, register.value);
                } catch (exception) {
                    console.log(exception);
                }
            });
        });
    }

    reg(name) {
        let reg = this.regCache[name.toUpperCase()];

        if (reg === undefined) {
            for (let i = 0; i < this.registers.length; i++) {
                if (this.registers[i].hasName(name)) {
                    reg = this.registers[i];
                    this.regCache[name.toUpperCase()] = this.registers[i];

                    break;
                }
            }

            if (reg === undefined) {
                throw new CPUError("Tried to access nonexistent register: " + name);
            }
        }

        return reg.valueOf(name);
    }

    setReg(name, value) {
        let reg = this.regCache[name.toUpperCase()];

        if (reg === undefined) {
            for (let i = 0; i < this.registers.length; i++) {
                if (this.registers[i].hasName(name)) {
                    reg = this.registers[i];
                    this.regCache[name.toUpperCase()] = this.registers[i];

                    break;
                }
            }

            if (reg === undefined) {
                throw new CPUError("Tried to access nonexistent register: " + name);
            }
        }

        if (reg.setReg(name, value) === true) {
            this.notify(reg.name64, value);
            this.notify(reg.name32, value);
            this.notify(reg.name16 ? reg.name16 : "", value);
            this.notify(reg.name8hi ? reg.name8hi : "", value);
            this.notify(reg.name8 ? reg.name8 : "", value);
        }
    }

    regByteLen(name) {
        let retVal = undefined;

        this.registers.forEach((register) => {
            let value = register.byteLengthOf(name);

            if (value !== undefined) {
                retVal = value;
            }
        });

        if (retVal === undefined) {
            throw CPUError("Tried to access nonexistent register: " + name);
        }

        return retVal;
    }

    static flagMask(flagName) {
        switch(flagName) {
            case "CF": return 0x0001;       // Carry flag
            case "R1": return 0x0002;       // Reserved
            case "PF": return 0x0004;       // Parity flag
            case "R2": return 0x0008;       // Reserved
            case "AF": return 0x0010;       // Adjust flag
            case "R3": return 0x0020;       // Reserved
            case "ZF": return 0x0040;       // Zero flag
            case "SF": return 0x0080;       // Sign flag
            case "TF": return 0x0100;       // Trap flag
            case "IF": return 0x0200;       // Interrupt enable flag
            case "DF": return 0x0400;       // Direction flag
            case "OF": return 0x0800;       // Overflow flag
            case "IOPL": return 0x3000;     // I/O Privilege flag
            case "NT": return 0x4000;       // Nested task flag
            case "R4": return 0x8000;       // Reserved

            // EFLAGS
            case "RF": return 0x00010000;   // Resume flag
            case "VM": return 0x00020000;   // Virtual 8086 mode flag
            case "AC": return 0x00040000;   // Alignment check
            case "VIF": return 0x00080000;  // Virtual interrupt flag
            case "VIP": return 0x00100000;  // Virtual interrupt pending
            case "ID": return 0x00200000;   // Able to use CPUID instruction

            default: return 0x0;
        }
    }

    setFlag(name, value) {
        let current = this.reg("EFLAGS");
        let mask = Registers.flagMask(name);

        if (this.flag(name) === value) {
            return;
        }

        this.setReg("EFLAGS", value ? current | mask : current - mask);
    }

    flag(name, value) {
        let mask = Registers.flagMask(name);
        return !!(this.reg("EFLAGS") & mask);  // Force boolean
    }
}