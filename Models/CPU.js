import {Registers} from './Registers.js'
import {Memory} from './Memory.js'


export class CPU {
    constructor(memorySize) {
        this.registers = new Registers();
        this.memory = new Memory(memorySize);
        this.codeSize = 0x0;

        this.registers.setReg("RIP", 0x0);
        this.registers.setReg("RSP", memorySize);

        this.disassembler = new cs.Capstone(cs.ARCH_X86, cs.MODE_64);
    }

    loadCode(code) {
        this.memory.store(0, code);
        this.codeSize = code.length;
    }

    fullDisassembledCode() {
        let instructions = this.disassembler.disasm(this.memory.load(0x0, this.codeSize), 0x1000);

        let disassembled = [];

        instructions.forEach((instruction) => {
            disassembled.push([instruction.address.toString(16), instruction.mnemonic, instruction.op_str]);
        });

        return disassembled;
    }

    nextInstruction() {
        let instructionPointer = this.registers.reg("RIP");

        // Disassemble one instruction off memory

        let instruction = this.disassembler.disasm(this.memory.load(instructionPointer, this.codeSize), instructionPointer, 0x1)[0];

        let ih = new InstructionHandler(this, instruction.op_str, instruction.size);

        switch(instruction.mnemonic) {
            case "mov": ih.mov(); break;
            case "jmp": ih.jmp(); break;
            case "push": ih.push(); break;
            case "pop": ih.pop(); break;
            case "call": ih.call(); break;
            case "ret": ih.ret(); break;
            case "int": ih.int(); break;
            default: throw Error("Unknown mnemonic: " + instruction.mnemonic);
        }

        if (instructionPointer === this.registers.reg("RIP")) {
            instructionPointer += instruction.size;
            this.registers.setReg("rip", instructionPointer);
        }
    }

}

class InstructionHandler {
    constructor(cpu, op_str, inst_size = 0) {
        this.cpu = cpu;
        this.op_str = op_str;
        this.inst_size = inst_size;
    }

    parseValue(val) {
        var value = 0x0;
        var valueSize = 0x0;

        if (isNaN(val)) {
            if (val.includes("ptr")) {
                var size = 0x8;

                let components = val.split(" ");

                let sizeDefinition = components[0];
                let ptr = components[1];
                var address = components[2].replace("[", "").replace("]", "");

                switch(sizeDefinition) {
                    case "qword": size = 0x8; break;
                    case "dword": size = 0x4; break;
                    case "word":  size = 0x2; break;
                    case "byte":  size = 0x1; break;
                }

                if (isNaN(address)) { // Assume it's a register
                    address = this.cpu.registers.reg(address);
                } else {
                    address = parseInt(address);
                }

                value = this.cpu.memory.loadUInt(address, size);
                valueSize = size;
            } else { // Assume val is a register
                value = this.cpu.registers.reg(val);
                valueSize = this.cpu.registers.regByteLen(val);
            }
        } else {
            value = parseInt(val);
            valueSize = 0x8;
        }

        return {"value": value, "size": valueSize};
    }

    mov() {
        let sides = this.op_str.split(",");
        let left = sides[0].trim();
        let right = sides[1].trim();

        // --- Parse right side --- //
        right = this.parseValue(right);

        // --- Parse left side --- //
        if (!left.includes("ptr")) { // Left is just a register. I hope.
            this.cpu.registers.setReg(left, right.value);
        }
    }

    jmp() {
        let address = this.parseValue(this.op_str);

        this.cpu.registers.setReg("RIP", address.value);
    }

    push() {
        let value = this.parseValue(this.op_str);

        let rsp = this.cpu.registers.reg("rsp") - value.size;
        this.cpu.registers.setReg("rsp", rsp);

            let memValue = value.value.toString(16).padStart(value.size * 2, "0").match(/.{1,2}/g).map((val) => {
                return parseInt(val, 16);
            });

        this.cpu.memory.store(rsp, memValue);
    }

    pop() {
        let register = this.op_str;
        let size = this.cpu.registers.regByteLen(this.op_str);

        let rsp = this.cpu.registers.reg("rsp");

        let memValue = this.cpu.memory.loadUInt(rsp, size);

        this.cpu.registers.setReg("rsp", rsp + size);
        this.cpu.registers.setReg(register, memValue);
    }

    call() {
        let newRip = this.cpu.registers.reg("rip") + this.inst_size;
        this.cpu.registers.setReg("rip", newRip);

        let ih = new InstructionHandler(this.cpu, "rip");
        ih.push();

        ih = new InstructionHandler(this.cpu, this.op_str);
        ih.jmp();
    }

    ret() {
        let ih = new InstructionHandler(this.cpu, "rip");
        ih.pop();

        ih = new InstructionHandler(this.cpu, this.cpu.registers.reg("rip"));
        ih.jmp();
    }

    int() {
        let value = this.parseValue(this.op_str);

        let nativeFunction = new NativeFunction(this.cpu);

        switch(value.value) {
            case 1: nativeFunction.alert(); break;
            case 2: nativeFunction.getInput(); break;
            case 3: nativeFunction.exit(); break;
        }
    }
}

class NativeFunction {
    constructor(cpu) {
        this.cpu = cpu;
    }

    alert() {
        let memoryPointer = this.cpu.registers.reg("rdi");

        let messageArray = this.cpu.memory.loadUntil(memoryPointer, 0x00);

        var message = "";
        messageArray.forEach((byte) => {
            message += String.fromCharCode(byte);
        });

        message = message.trim();

        alert(message);
    }

    getInput() {

    }

    exit() {
        console.log("Instruction end");
    }
}