#!/bin/sh 

# Supposed to automatically bundle all dependencies into one JS file. Good luck

rollup Emulator/Emulator.js --file dist/emulator.js --format iife
cat Emulator/capstone-x86.min.js > dist/emulator.bundle.js
echo ";" >> dist/emulator.bundle.js  # Capstone.js doesn't like semicolons apparently
cat dist/emulator.js >> dist/emulator.bundle.js

rm dist/emulator.js

echo "Done"
