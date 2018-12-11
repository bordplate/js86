export class CpuMemory extends HTMLElement {
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