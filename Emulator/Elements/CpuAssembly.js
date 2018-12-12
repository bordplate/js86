export class CpuAssembly extends HTMLElement {
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
        //document.getElementById(`${this.uniqueName}-line-${hexedValue.toLowerCase()}`).setAttribute('aria-live', 'polite');
    }

    loadAssembly(assembly) {
        this.innerHTML = assembly.flatMap((instruction) => {
            return `
                        <div tabindex="-30" role="row" class="code-line" id="${this.uniqueName}-line-0x${instruction[0]}">
                            <span class="address">0x${instruction[0].toUpperCase().padStart(2, "0")}</span>
                            <span class="arrow"></span>
                            <span class="mnemonic">${instruction[1]}</span>&#9;&#9;
                            <span class="op_str">${instruction[2]}</span>
                        </div>`
        }).join('\n');
    }
}