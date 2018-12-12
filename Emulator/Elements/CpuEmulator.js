import {CPU} from "../Processor/CPU.js";

export class CpuEmulator extends HTMLElement {
    constructor() {
        super();

        this.isRunning = false;

        // Load attributes
        this.binaryPath = this.attributes['cpu-binary'].value;
        this.memorySize = this.attributes['memory-size'] ? parseInt(this.attributes['memory-size'].value) : 0x256;
        this.stackWatch = this.attributes['stack-watch'] ? this.attributes['stack-watch'].value : "dynamic";
        this.watchedRegisters = this.attributes['watched-registers'] ?
            this.attributes['watched-registers'].value.split(',')
            : [];
        this.runSpeed = this.attributes['run-speed'] ? parseInt(this.attributes['run-speed'].value) : 500;

        this.stepButton = document.createElement('button');
        this.stepButton.innerText = "Step";
        {const veryMuchThis = this; this.stepButton.onclick = () => {veryMuchThis.stepCPU()};}

        this.runButton = document.createElement('button');
        this.runButton.innerText = "Run";
        {const veryMuchThis = this; this.runButton.onclick = () => {veryMuchThis.runCPU()};}

        this.resetButton = document.createElement('button');
        this.resetButton.innerText = "Reset";
        {const veryMuchThis = this; this.resetButton.onclick = () => {veryMuchThis.resetCPU()};}

        this.buttonContainer = document.createElement("div");
        this.buttonContainer.className = "button-container";
        this.appendChild(this.buttonContainer);

        this.buttonContainer.appendChild(this.stepButton);
        this.buttonContainer.appendChild(this.runButton);
        this.buttonContainer.appendChild(this.resetButton);

        // Create subview, append and modify
        this.assemblyView = document.createElement('cpu-assembly');
        this.registersView = document.createElement('cpu-registers');
        this.memoryView = document.createElement('cpu-memory');
        this.consoleView = document.createElement('emulator-console');

        this.appendChild(this.assemblyView);
        this.appendChild(this.consoleView);
        this.appendChild(this.registersView);
        this.appendChild(this.memoryView);

        this.configureAccessibility();

        this.consoleView.load(); // Nodes can't have children before they're added to DOM for some reason.

        this.watchedRegisters.forEach((register) => {
            this.registersView.addRegisterView(register);
        });

        this.memoryView.memorySize = this.memorySize;

        // Load CPU
        CpuEmulator.loadBinary(this.binaryPath, (binary) => {
            var hexDump = "";
            binary.forEach((byte) => {
                hexDump += byte.toString(16).padStart(2, "0") + " ";
            });

            console.log("Loading code: ");
            console.log(hexDump);

            this.cpu = new CPU(this.memorySize);
            this.cpu.loadCode(binary);

            console.log("Loaded CPU. Disassembly: \n" + this.cpu.fullDisassembledCode().join("\n"));

            this.onCPULoad();
        });
    }

    configureAccessibility() {
        this.assemblyView.setAttribute('tabindex', '-1');
        this.consoleView.setAttribute('tabindex', '-2');
        this.registersView.setAttribute('tabindex', '-3');
        this.memoryView.setAttribute('tabindex', '-4');

        //this.registersView.setAttribute('aria-live', 'polite');
        this.consoleView.textArea.setAttribute('role', 'log');
        //this.assemblyView.setAttribute('role', 'rowgroup');
    }

    onCPULoad() {
        this.consoleView.setIOBuffer(this.cpu.ioBuffer);

        this.assemblyView.loadAssembly(this.cpu.fullDisassembledCode());

        // Subscribe to memory changes
        this.cpu.memory.subscribe(() => {
            let rsp = this.stackWatch === "dynamic" ? this.cpu.registers.reg("rsp") : parseInt(this.stackWatch);

            let stack = this.cpu.memory.load(rsp, this.cpu.memory.memory.length - rsp);

            this.memoryView.setMemory(stack);
        });

        this.cpu.registers.subscribe((reg, value) => {
            if (this.watchedRegisters.includes(reg.toLowerCase())) {
                if (reg.toLowerCase() === "rip") {
                    this.assemblyView.setCurrentLine(value);
                }

                this.registersView.updateRegister(reg, value);
            }
        });

        let rsp = this.stackWatch === "dynamic" ? this.cpu.registers.reg("rsp") : parseInt(this.stackWatch);
        let stack = this.cpu.memory.load(rsp, this.cpu.memory.memory.length - rsp);
        this.memoryView.setMemory(stack);

        this.assemblyView.setCurrentLine(this.cpu.registers.reg('rip'));

        this.cpu.registers.notifyAll();
    }

    runCPU() {
        if(!this.isRunning) {
            this.runButton.className += "active-running";
            this.runButton.innerText = "Stop";
            var veryMuchThis = this;
            this.isRunning = true;
            this.runInterval = setInterval(() => {
                veryMuchThis.stepCPU()
            }, this.runSpeed);
        } else {
            this.isRunning = false;
            clearInterval(this.runInterval);
            this.runButton.className = "";
            this.runButton.innerText = "Run";
        }
    }

    stepCPU() {
        this.cpu.nextInstruction();
    }

    resetCPU() {
        this.runButton.className = "";
        clearInterval(this.runInterval);
        this.consoleView.clear();

        CpuEmulator.loadBinary(this.binaryPath, (binary) => {
            var hexDump = "";
            binary.forEach((byte) => {
                hexDump += byte.toString(16).padStart(2, "0") + " ";
            });

            console.log("Loading code: ");
            console.log(hexDump);

            this.cpu = new CPU(this.memorySize);
            this.cpu.loadCode(binary);

            console.log("Loaded CPU. Disassembly: \n" + this.cpu.fullDisassembledCode().join("\n"));

            this.onCPULoad();
        });
    }

    static loadBinary(binaryPath, callback) {
        const request = new XMLHttpRequest();
        request.open("GET", binaryPath, true);
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