import {SUB_TYPE, IOBuffer} from '../Processor/IOBuffer.js';

export class Console extends HTMLElement {
    constructor() {
        super();

        this.ioBuffer = undefined;

        this.textArea = document.createElement('textarea');
        this.textArea.style.margin = "0px";
        this.textArea.style.backgroundColor = "black";
        this.textArea.style.color = "white";
        this.textArea.style.fontFamily = "monospace";
        this.textArea.style.height = "100%";
        this.textArea.style.width = "100%";
        this.textArea.className = "console-window";

        {
            const veryMuchThis = this;
            this.textArea.onkeydown = (e) => {
                let buffer = veryMuchThis.ioBuffer.buffer;

                if (veryMuchThis.textArea.selectionStart < buffer.length+1 && e.key === "Backspace") {
                    e.preventDefault();
                    return false;
                }
            };

            this.textArea.onkeypress = (e) => {
                if (e.key === "Enter") {
                    let buffer = veryMuchThis.ioBuffer.buffer;
                    let input = veryMuchThis.textArea.value.substring(buffer.length) + "\n";
                    veryMuchThis.ioBuffer.input(input);
                }
            }
        }
    }


    setIOBuffer(buffer) {
        this.ioBuffer = buffer;

        this.ioBuffer.subscribe(SUB_TYPE.OUTPUT, (text) => {
            this.textArea.value += text;
        })
    }

    load() {
        this.appendChild(this.textArea);
    }
}