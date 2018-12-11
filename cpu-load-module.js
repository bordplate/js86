import {CPU} from './Models/CPU.js';

/** Singular register **/
class CpuRegister extends HTMLElement {
    constructor(options) {
        super();

        this.name = options['name'].toUpperCase();

        this.registerNameView = document.createElement('span');
        this.registerValueView = document.createElement('span');

        this.registerNameView.innerText = this.name;
        this.registerValueView.innerText = `0x${(0).toString(16).padStart(8, "0")}`;
        this.registerNameView.setAttribute('class', 'reg-name');
        this.registerValueView.setAttribute('class', 'reg-value');

        this.appendChild(this.registerNameView);
        this.appendChild(this.registerValueView);
    }

    updateValue(value) {
        this.registerValueView.innerText = `0x${value.toString(16).padStart(8, "0")}`;
    }
}

/** Plural registers **/
class CpuRegisters extends HTMLElement {
    constructor() {
        super();

        this.registerViews = [];
    }

    addRegisterView(name) {
        let registerView = new (customElements.get('cpu-register'))({'name': name});

        this.appendChild(registerView);
        this.registerViews.push(registerView);
    }

    updateRegister(name, value) {
        this.registerViews.forEach((registerView) => {
            if (registerView.name === name.toUpperCase()) {
                registerView.updateValue(value);
            }
        });
    }
}

class CpuMemory extends HTMLElement {
    constructor() {
        super();

        this.memorySize = 0x0;
    }

    setMemory(memory) {
        this.innerHTML = "";

        var i = this.memorySize - memory.length;
        memory.forEach((byte) => {
            this.innerHTML += `
                            <div class='byte'>
                                <span class="mem-address">${i.toString(16)}</span>
                                <span class="ascii-byte">${String.fromCharCode(byte)}</span>
                                <span class="hex-byte">${byte.toString(16)}</span>
                            </div>`;
            i += 1;
        });
    }
}

class CpuAssembly extends HTMLElement {
    constructor() {
        super();

        // Got this random string generator from:
        // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
        this.uniqueName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8);
    }

    setCurrentLine(lineNum) {
        let hexedValue = `0x${lineNum.toString(16).toUpperCase()}`;
        var allLines = this.getElementsByClassName('code-line');

        Array.prototype.forEach.call(allLines, function (element) {
            element.className = "code-line";
        });

        document.getElementById(`${this.uniqueName}-line-${hexedValue.toLowerCase()}`).className = "code-line current-line";
    }

    loadAssembly(assembly) {
        this.innerHTML = assembly.flatMap((instruction) => {
            return `
                        <div class="code-line" id="${this.uniqueName}-line-0x${instruction[0]}">
                            <span class="address">0x${instruction[0].toUpperCase().padStart(2, "0")}</span>
                            <span class="arrow"></span>
                            <span class="mnemonic">${instruction[1]}</span>&#9;&#9;
                            <span class="op_str">${instruction[2]}</span>
                        </div>`
        }).join('\n');
    }
}

class CpuEmulator extends HTMLElement {
    constructor() {
        super();

        // Load attributes
        this.binaryPath = this.attributes['cpu-binary'].value;
        this.memorySize = this.attributes['memory-size'] ? parseInt(this.attributes['memory-size'].value) : 0x256;
        this.stackWatch = this.attributes['stack-watch'] ? this.attributes['stack-watch'].value : "dynamic";
            this.watchedRegisters = this.attributes['watched-registers'] ?
            this.attributes['watched-registers'].value.split(',')
            : [];

        // Create subview, append and modify
        this.assemblyView = document.createElement('cpu-assembly');
        this.registersView = document.createElement('cpu-registers');
        this.memoryView = document.createElement('cpu-memory');

        this.appendChild(this.assemblyView);
        this.appendChild(this.registersView);
        this.appendChild(this.memoryView);

        this.stepButton = document.createElement('button');
        this.stepButton.innerText = "Step";
        {const veryMuchThis = this; this.stepButton.onclick = () => {veryMuchThis.stepCPU()};}

        this.appendChild(this.stepButton);

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

    onCPULoad() {
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

    stepCPU() {
        this.cpu.nextInstruction();
    }

    static loadBinary(binaryPath, callback) {
        const request = new XMLHttpRequest();
        request.open("GET", binaryPath, true);
        request.responseType = "arraybuffer";

        request.onload = (event) => {
            const binary = request.response;
            if (!binary) {
                throw Error(`Could not load binary from path: ${binaryPath}`);
            }

            callback(new Uint8Array(binary));
        };

        request.send(null);
    }
}

customElements.define('cpu-register', CpuRegister);
customElements.define('cpu-registers', CpuRegisters);
customElements.define('cpu-memory', CpuMemory);
customElements.define('cpu-assembly', CpuAssembly);
customElements.define('cpu-emulator', CpuEmulator);