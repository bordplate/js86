import {CPU} from "../Processor/CPU.js";
import {Loader} from "../Loaders/Loader.js";

export class CpuEmulator extends HTMLElement {
    constructor() {
        super();

        this.isRunning = false;

        this.innerHTML = "";

        // Load attributes
        this.binaryPath = this.attributes['cpu-binary'].value;
        this.memorySize = this.attributes['memory-size'] ? parseInt(this.attributes['memory-size'].value) : 0x256;
        this.stackWatch = this.attributes['stack-watch'] ? this.attributes['stack-watch'].value : "dynamic";
        this.watchedRegisters = this.attributes['watched-registers'] ?
            this.attributes['watched-registers'].value.split(',')
            : [];
        this.runSpeed = this.attributes['run-speed'] ? parseInt(this.attributes['run-speed'].value) : 500;
        this.showConsole = this.attributes['show-console'] ? this.attributes['show-console'].value === "true" : true;
        this.codeSize = this.attributes['code-size'] ? this.attributes['code-size'].value : "dynamic";
        this.loaderName = this.attributes['loader'] ? this.attributes['loader'].value : "Raw";

        this.leftContainer = document.createElement("div");
        this.leftContainer.className = "left-container";

        this.rightContainer = document.createElement('div');
        this.rightContainer.className = "right-container";

        this.stepButton = document.createElement('button');
        this.stepButton.innerText = "Step";
        {const veryMuchThis = this; this.stepButton.onclick = () => {veryMuchThis.stepCPU()};}

        this.runButton = document.createElement('button');
        this.runButton.innerText = "Run";
        {const veryMuchThis = this; this.runButton.onclick = () => {veryMuchThis.runCPU()};}

        this.resetButton = document.createElement('button');
        this.resetButton.innerText = "Reset";
        {const veryMuchThis = this; this.resetButton.onclick = () => {veryMuchThis.resetCPU()};}

        this.appendChild(this.leftContainer);
        this.appendChild(this.rightContainer);

        this.buttonContainer = document.createElement("div");
        this.buttonContainer.className = "button-container";
        this.leftContainer.appendChild(this.buttonContainer);

        this.buttonContainer.appendChild(this.stepButton);
        this.buttonContainer.appendChild(this.runButton);
        this.buttonContainer.appendChild(this.resetButton);

        // Create subview, append and modify
        this.assemblyView = document.createElement('cpu-assembly');
        this.registersView = document.createElement('cpu-registers');
        this.memoryView = document.createElement('cpu-memory');
        this.consoleView = document.createElement('emulator-console');

        this.leftContainer.appendChild(this.assemblyView);
        this.showConsole ? this.rightContainer.appendChild(this.consoleView) : null;
        this.rightContainer.appendChild(this.registersView);
        this.rightContainer.appendChild(this.memoryView);

        this.assemblyView.codeSize = parseInt(this.codeSize);

        this.configureAccessibility();

        this.consoleView.load(); // Nodes can't have children before they're added to DOM for some reason.

        for (let i = 0; i < this.watchedRegisters.length; i++) {
            let register = this.watchedRegisters[i];
            this.registersView.addRegisterView(register);
        }

        this.memoryView.memorySize = this.memorySize;

        // Load CPU
        CpuEmulator.loadBinary(this.binaryPath, async (binary) => {
            let hexDump = "";
            for (let i = 0; i < binary.length; i++) {
                let byte = binary[i];
                hexDump += byte.toString(16).padStart(2, "0") + " ";
            }

            console.log("Loading CPU.");

            // Support for custom loaders (ELFs, PEs, MachOs, etc)
            let loaderName = this.loaderName + "Loader";

            let loaderModule = await import(`../Loaders/${loaderName}.js`);

            this.loader = new loaderModule[loaderName](this.memorySize);
            await this.loader.loadBinary(binary);

            this.cpu = this.loader.getCPU();

            console.log("Loaded CPU.");

            this.onCPULoad();
        });
    }

    configureAccessibility() {
        this.assemblyView.setAttribute('tabindex', '-1');
        this.consoleView.setAttribute('tabindex', '-2');
        this.registersView.setAttribute('tabindex', '-3');
        this.memoryView.setAttribute('tabindex', '-4');

        this.consoleView.textArea.setAttribute('role', 'log');
    }

    onCPULoad() {
        this.consoleView.setIOBuffer(this.cpu.ioBuffer);

        this.assemblyView.loadAssembly(this.cpu.disassembly(this.loader.codeStartOffset, this.loader.visualCodeSize, this.loader.codeStartOffset), this.loader);

        // Subscribe to memory changes
        this.cpu.memory.subscribe(() => {
            let rsp = this.stackWatch === "dynamic" ? this.cpu.registers.reg("rsp") : parseInt(this.stackWatch);

            let stack = this.cpu.memory.load(rsp, this.cpu.memory.memory.length - rsp);

            this.memoryView.setMemory(stack);
        });

        this.cpu.registers.subscribe((reg, value) => {
            if (reg === "RIP") {
                this.assemblyView.setCurrentLine(value);
            }

            if (reg === "RSP") {
                let rsp = this.stackWatch === "dynamic" ? this.cpu.registers.reg("rsp") : parseInt(this.stackWatch);

                let stack = this.cpu.memory.load(rsp, this.cpu.memory.memory.length - rsp);

                this.memoryView.setMemory(stack);
            }

            if (this.watchedRegisters.includes(reg.toLowerCase())) {
                this.registersView.updateRegister(reg, value);
            }
        });

        this.cpu.onEnd((reason) => {
            this.isRunning = false;

            if (reason === "restart") {
                this.resetCPU();

                this.runCPU();
            } else {
                this.runButton.className = "disabled-running";
            }
        });

        let rsp = this.stackWatch === "dynamic" ? this.cpu.registers.reg("rsp") : parseInt(this.stackWatch);
        let stack = this.cpu.memory.load(rsp, this.cpu.memory.memory.length - rsp);
        this.memoryView.setMemory(stack);

        this.assemblyView.setCurrentLine(this.cpu.registers.reg('rip'));

        this.cpu.registers.notifyAll();
    }

    async runCPU() {
        if (this.runButton.className === "disabled-running") {
            return;
        }

        if(!this.isRunning) {
            this.runButton.className += "active-running";
            this.runButton.innerText = "Stop";
            let veryMuchThis = this;
            this.isRunning = true;
            this.runInterval = setInterval(() => {
                veryMuchThis.stepCPU();

                // Process 50 instructions at the time if we have no speed limit
                // We can't just run a while true-loop because it blocks the UI.
                if (veryMuchThis.runSpeed <= 0) {
                    for(let i = 0; i<50;i++) {
                        veryMuchThis.stepCPU();
                    }
                }

            }, this.runSpeed);
        } else {
            this.isRunning = false;
            clearInterval(this.runInterval);
            this.runButton.className = "";
            this.runButton.innerText = "Run";
        }
    }

    /**
     * Single-steps CPU
     *
     * If the next instruction is outside of what is shown in assembly view, it keeps stepping until we are back
     *  into the assembly view, or the emulator stops.
     */
    stepCPU() {
        let instructionPointer = this.cpu.nextInstruction();

        if (!this.assemblyView.isAddressInView(instructionPointer) && !this.cpu.done && !this.cpu.ioWait) {
            this.stepCPU();
        }
    }

    resetCPU() {
        this.runButton.className = "";
        this.runButton.innerText = "Run";
        this.isRunning = false;
        clearInterval(this.runInterval);
        this.consoleView.clear();

        CpuEmulator.loadBinary(this.binaryPath, async (binary) => {
            let hexDump = "";
            for (let i = 0; i < binary.length; i++) {
                let byte = binary[i];
                hexDump += byte.toString(16).padStart(2, "0") + " ";
            }

            console.log("Loading CPU.");

            // Support for custom loaders (ELFs, PEs, MachOs, etc)
            let loaderName = this.loaderName + "Loader";

            let loaderModule = await import(`../Loaders/${loaderName}.js`);

            this.loader = new loaderModule[loaderName](this.memorySize);
            await this.loader.loadBinary(binary);

            this.cpu = this.loader.getCPU();

            console.log("Loaded CPU.");

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