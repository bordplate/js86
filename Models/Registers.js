import {Register} from './Register.js'

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
            new Register('RDI', 'EDI', 'DI', null, null)
        ];

        this.subscribers = [];
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notify(reg, value) {
        this.subscribers.forEach((callback) => {
            callback(reg, value);
        });
    }

    reg(name) {
        var retVal = undefined;

        this.registers.forEach((register) => {
            let value = register.valueOf(name);

            if (value !== undefined) {
                retVal = value;
            }
        });

        if (retVal === undefined) {
            throw Error("Tried to access nonexistent register: " + name);
        }

        return retVal;
    }

    setReg(name, value) {
        this.registers.forEach((register) => {
            register.setReg(name, value);
        });

        this.notify(name, value);
    }

    regByteLen(name) {
        var retVal = undefined;

        this.registers.forEach((register) => {
            let value = register.byteLengthOf(name);

            if (value !== undefined) {
                retVal = value;
            }
        });

        if (retVal === undefined) {
            throw Error("Tried to access nonexistent register: " + name);
        }

        return retVal;
    }
}