#!/bin/sh

# Make the binaries-folder, don't care if it already exists
mkdir binaries 2> /dev/null

for file in `ls assembly`; do
    nasm -f bin assembly/$file -o binaries/${file%.s}
done