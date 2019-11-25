export class CpuMemory extends HTMLElement {
    constructor() {
        super();

        this.memorySize = 0x0;
    }

    setMemory(memory) {
        this.innerHTML = "";

        for (var i = this.memorySize - memory.length; i < memory.length; i++) {
            let byte = memory[i];
            this.innerHTML += `
                            <div class='byte'>
                                <span class="mem-address">${i.toString(16)}</span>
                                <span class="ascii-byte">${String.fromCharCode(byte)}</span>
                                <span class="hex-byte">${byte.toString(16).padStart(2, "0")}</span>
                            </div>`;
        }
    }
}