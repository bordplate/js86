export class CpuMemory extends HTMLElement {
    constructor() {
        super();

        this.memorySize = 0x0;
    }

    setMemory(memory) {
        if (memory.length <= 0) {
            return;
        }

        this.innerHTML = "";

        var html = "";

        for (var i = 0; i < memory.length; i++) {
            let byte = memory[i];
            let address = this.memorySize - memory.length + i;
            html += `
                            <div class='byte'>
                                <span class="mem-address">${address.toString(16)}</span>
                                <span class="ascii-byte">${String.fromCharCode(byte)}</span>
                                <span class="hex-byte">${byte.toString(16).padStart(2, "0")}</span>
                            </div>`;
        }

        this.innerHTML = html;
    }
}