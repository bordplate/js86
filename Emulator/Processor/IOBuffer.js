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

        // Capturing thrown errors
        // TODO: Only catch CPU errors, this probably catches browser crap as well?
        window.onerror = (msg, url, lineNo, columnNo, error) => {
            this.output(msg + "\n");

            return false;
        }
    }

    subscribe(type, callback) {
        if (type !== 1 && type !== 2) {
            throw Error("Must subscribe to either INPUT or OUTPUT type.");
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
                this.inputSubscribers.forEach((callback) => {
                    callback(newBuffer)
                });
                break;
            case SUB_TYPE.OUTPUT:
                this.outputSubscribers.forEach((callback) => {
                    callback(newBuffer)
                });
                break;
        }
    }

    getNextInput() {
        if (
            (this.inputIndex > this.inputBuffer.split("\n").length - 1) ||
            (this.inputBuffer.split("\n").length === 1 && this.inputBuffer.split("\n")[0] === "")
        ) {
            return false;
        }

        return this.inputBuffer.split("\n")[this.inputIndex++];
    }

    input(text) {
        this.buffer += text;
        this.inputBuffer += text;
        this.notify(SUB_TYPE.INPUT, text);
    }

    output(text) {
        this.buffer += text;
        this.notify(SUB_TYPE.OUTPUT, text);
    }
}