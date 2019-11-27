import {CPUError} from "./CPU.js";

export const SUB_TYPE = {
    INPUT: 1,
    OUTPUT: 2
};

export class IOBuffer {
    constructor() {
        this.buffer = "";
        this.inputBuffer = "";
        this.inputIndex = 0;

        this.inputSubscribers = [];
        this.outputSubscribers = [];
    }

    subscribe(type, callback) {
        if (type !== 1 && type !== 2) {
            throw CPUError("Must subscribe to either INPUT or OUTPUT type.");
        }

        switch (type) {
            case SUB_TYPE.INPUT:
                this.inputSubscribers.push(callback);
                break;
            case SUB_TYPE.OUTPUT:
                this.outputSubscribers.push(callback);
                break;
        }
    }

    notify(type, newBuffer) {
        switch (type) {
            case SUB_TYPE.INPUT:
                for (let i = 0; i < this.inputSubscribers.length; i++) {
                    let callback = this.inputSubscribers[i];
                    callback(newBuffer)
                }
                break;
            case SUB_TYPE.OUTPUT:
                for (let i = 0; i < this.outputSubscribers.length; i++) {
                    let callback = this.outputSubscribers[i];
                    callback(newBuffer)
                }
                break;
        }
    }

    getNextInput() {
        let input = this.inputBuffer.split("\n").slice(0, this.inputIndex+1);

        if (
            (this.inputIndex > this.inputBuffer.split("\n").length - 1) ||
            (input[input.length - 1] === "")
        ) {
            return false;
        }

        this.inputIndex++;

        return input[input.length - 1];
    }

    input(text, escaped = undefined) {
        this.buffer += escaped !== undefined ? escaped : text;
        this.inputBuffer += text;
        this.notify(SUB_TYPE.INPUT, text);
    }

    output(text) {
        this.buffer += text;
        this.notify(SUB_TYPE.OUTPUT, text);
    }
}