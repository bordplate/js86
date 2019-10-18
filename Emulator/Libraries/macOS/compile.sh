#!/bin/sh

# Make the binaries-folder, don't care if it already exists
mkdir binaries 2> /dev/null

for file in `ls assembly`; do
    nasm -f macho64 assembly/$file -o binaries/${file%.s}.o
    ld -dylib -macosx_version_min 10.7.0 -o binaries/${file%.s} binaries/${file%.s}.o
    rm binaries/${file%.s}.o
done

