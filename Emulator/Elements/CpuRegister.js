/** Singular register **/
export class CpuRegister extends HTMLElement {
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