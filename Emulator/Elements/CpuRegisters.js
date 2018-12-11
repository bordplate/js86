/** Plural registers **/
export class CpuRegisters extends HTMLElement {
    constructor() {
        super();

        this.registerViews = [];
    }

    addRegisterView(name) {
        let registerView = new (customElements.get('cpu-register'))({'name': name});

        this.appendChild(registerView);
        this.registerViews.push(registerView);
    }

    updateRegister(name, value) {
        this.registerViews.forEach((registerView) => {
            if (registerView.name === name.toUpperCase()) {
                registerView.updateValue(value);
            }
        });
    }
}