#!/bin/sh

mkdir binaries 2> /dev/null
mkdir binaries/machos 2> /dev/null

for file in `ls assembly/machos`; do
    nasm -f macho64 assembly/machos/$file -o binaries/machos/${file%.s}.o && \
    ld -macosx_version_min 10.10.0 -arch x86_64 -e main -lc -o binaries/machos/${file%.s} binaries/machos/${file%.s}.o && \
    rm binaries/machos/${file%.s}.o
done