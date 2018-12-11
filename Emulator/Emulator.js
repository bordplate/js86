import {CpuRegister} from './Elements/CpuRegister.js';
import {CpuRegisters} from './Elements/CpuRegisters.js';
import {CpuMemory} from './Elements/CpuMemory.js';
import {CpuAssembly} from './Elements/CpuAssembly.js';
import {CpuEmulator} from './Elements/CpuEmulator.js';

customElements.define('cpu-register', CpuRegister);
customElements.define('cpu-registers', CpuRegisters);
customElements.define('cpu-memory', CpuMemory);
customElements.define('cpu-assembly', CpuAssembly);
customElements.define('cpu-emulator', CpuEmulator);