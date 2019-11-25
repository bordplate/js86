export class Register {
    constructor(name64, name32, name16, name8hi, name8) {
        this.value      = 0x0;

        this.name64     = name64;
        this.name32     = name32;
        this.name16     = name16;
        this.name8hi    = name8hi;
        this.name8      = name8;
    }

    hasName(name) {
        switch(name.toUpperCase()) {
            case this.name64:
            case this.name32:
            case this.name16:
            case this.name8hi:
            case this.name8:
                return true;
            default:
                return false;
        }
    }

    valueOf(name) {
        switch(name.toUpperCase()) {
            case this.name64: {
                return this.value;
            }
            case this.name32: {
                return this.value ^ 0xFFFFFFFF00000000;
            }
            case this.name16: {
                return this.value ^ 0xFFFFFFFFFFFF0000;
            }
            case this.name8hi: {
                return this.value ^ 0xFFFFFFFFFFFF00FF;
            }
            case this.name8: {
                return this.value ^ 0xFFFFFFFFFFFFFF00;
            }
        }
        return undefined;
    }

    setReg(name, value) {
        switch(name.toUpperCase()) {
            case this.name64: {
                this.value = value;
                return true;
            }
            case this.name32: {
                this.value = value ^ 0xFFFFFFFF00000000;
                return true;
            }
            case this.name16: {
                this.value = value ^ 0xFFFFFFFFFFFF0000;
                return true;
            }
            case this.name8hi: {
                this.value = value ^ 0xFFFFFFFFFFFF00FF;
                return true;
            }
            case this.name8: {
                this.value = value ^ 0xFFFFFFFFFFFFFF00;
                return true;
            }
        }
        return false;
    }

    byteLengthOf(name) {
        switch(name.toUpperCase()) {
            case this.name64: {
                return 8;
            }
            case this.name32: {
                return 4;
            }
            case this.name16: {
                return 2;
            }
            case this.name8hi: {
                return 1;
            }
            case this.name8: {
                return 1;
            }
        }
        return undefined;
    }
}