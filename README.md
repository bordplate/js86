# Emulator
Embeddable visual pseudo x86-64 emulator written in JavaScript. Made for easily embedding a CPU emulator into a web page so that it can
be easily used to make tutorials or demos. Uses interrupts to tie into JavaScript code.   

It is important to note that this emulator only implements a very limited subset of instructions and does not even 
support conditional branching of any kind just yet. 

## Compiling assemblies
Compile assemblies with `nasm -f bin <filename>`. This emulator does not support any mainstream executable formats. 

# Usage

## Minimum imports
Minimum script imports are `capstone-x86.min.js` and `Emulator.js`. Probably should include the stylesheet
`InteractiveEmulator.css` under the folder `Styles` as well.

## HTML Tag
After importing the scripts and styles, add the emulator to the HTML using the custom tag `cpu-emulator`. 

Custom attributes:  
`cpu-binary`: Path to the binary you want to load. (Required)  
`memory-size`: Size of the memory you want the emulator to have. (Optional)  
`stack-watch`: Can be either `dynamic` or a fixed address of the point in stack you want to watch. `dynamic` follows `RSP`. (Optional)   
`watched-registers`: Registers you want to "watch" (add to the UI), split by `,`. Should probably be lowercase. (Optional)
`run-speed`: Milliseconds to wait before progressing to next instruction when in continous "run"-mode. Defaults to 500ms. (Optional)
`show-console`: `true` or `false` value, whether or not to show the console. Defaults to `true` (Optional)

## Building/bundling
I recommend bundling with [rollup.js](https://rollupjs.org/guide/en) as that is the easiest when you don't want to include
a mess of `node_modules` (yes, offence). You still need NPM to install rollup.js: `npm install --global rollup`, but
then bundling is easy:
```bash
rollup Emulator/Emulator.js --file dist/emulator.bundle.js --format iife
```

# Third-party frameworks and code
[Capstone](http://www.capstone-engine.org)  
[Capstone.js](https://github.com/AlexAltea/capstone.js) by [Alexandro Sanchez](https://github.com/AlexAltea)  
[node-int64](https://github.com/broofa/node-int64) by [Robert Kieffer](https://github.com/broofa)  
[Pretty CSS buttons](https://codepen.io/derekmorash/) by Derek Morash