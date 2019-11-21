import {Metadata} from '../Processor/Metadata.js';

export class CpuAssembly extends HTMLElement {
    constructor() {
        super();

        this.codeSize = false;

        // Got this random string generator from:
        // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
        this.uniqueName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8);
    }

    setCurrentLine(lineNum) {
        let hexedValue = `0x${lineNum.toString(16).toUpperCase()}`;
        var allLines = this.getElementsByClassName('code-line');

        Array.prototype.forEach.call(allLines, function (element) {
            if (element.classList.contains("breakpoint")) {
                element.className = "code-line breakpoint";
            } else {
                element.className = "code-line";
            }
        });

        try {
            document.getElementById(`${this.uniqueName}-line-${hexedValue.toLowerCase()}`).classList.add("current-line");
        } catch (exception) {
            // Ignore the shit out of that
        }
    }

    /**
     * Wether or not the specified address is in the assembly view.
     *
     * @param address
     * @returns {boolean}
     */
    isAddressInView(address) {
        var isInView = false;

        for (var i = 0; i < this.assembly.length; i++) {
            let instruction = this.assembly[i];

            let instructionAddress = parseInt(instruction[0], 16);

            if (instructionAddress === address) {
                isInView = true;
                break;
            }
        }

        return isInView && address <= this.codeSize;
    }

    loadAssembly(assembly, loader) {
        this.assembly = assembly;

        let metadata = new Metadata(assembly, loader);
        metadata.analyze();

        if (isNaN(this.codeSize)) {
            this.codeSize = metadata.codeSize + parseInt(assembly[0][0], 16);
        }

        var processedFirstLine = false;  // If we're processing the first line of the code, the label shouldn't be large
        this.innerHTML = assembly.flatMap((instruction) => {
            if (parseInt(instruction[0], 16) > this.codeSize) {
                return;
            }

            var op_str = instruction[2];

            var html = "";

            let addressMetadata = metadata.informationForAddress(instruction[0]);

            if (addressMetadata !== undefined) {
                if (addressMetadata.label) {
                    html += `
                    <div tabindex="-30" role="row" class="code-label">
                        <span class="address"></span>
                        <span class="arrow"></span>
                        <span class="${processedFirstLine ? "label-name" : "label-entrypoint"}">${addressMetadata.labelName}:</span>
                        <span class="op_str"></span>
                    </div>`;
                }

                if (addressMetadata.processOpStr !== undefined) {
                    op_str = addressMetadata.processOpStr(op_str);
                }
            }

            html += `
                        <div tabindex="-30" role="row" class="code-line" data-instruction="${instruction[0]}" id="${this.uniqueName}-line-0x${instruction[0]}">
                            <span class="address">0x${instruction[0].toUpperCase().padStart(2, "0")}</span>
                            <span class="arrow"></span>
                            <span class="mnemonic">${instruction[1]}</span>&#9;&#9;
                            <span class="op_str">${op_str}</span>
                        </div>`;

            processedFirstLine = true;

            return html;
        }).join('\n');

        Array.from(document.getElementsByClassName("code-line")).forEach((element) => {
            let addressElement = element.getElementsByClassName("address").item(0);
            {const veryMuchThis = this; addressElement.onclick = () => {veryMuchThis.addBreakpoint(element.getAttribute("data-instruction"))};}
        });
    }

    addBreakpoint(instruction) {
        return;  // Disabled because it doesn't actually do anything

        let item = document.getElementById(`${this.uniqueName}-line-0x${instruction}`);

        item.classList.add("breakpoint")
    }
}