#!/bin/sh

# You probably need a Mac with Xcode installed to compile this.

# I don't understand Makefiles, so simple shell scripting is easier for the time being.

# Make the binaries-folder, don't care if it already exists
mkdir binaries 2> /dev/null

# Changing working directory to one above because of how linking works
cd ..

## build libSystem
nasm -f macho64 macOS/assembly/system.s -o macOS/binaries/libsystem.o
ld -dylib -macosx_version_min 10.7.0 -o macOS/binaries/libSystem.B.dylib macOS/binaries/libsystem.o
rm macOS/binaries/libsystem.o

## build libobjc
nasm -f macho64 macOS/assembly/objc.s -o macOS/binaries/libobjc.o
ld -dylib -macosx_version_min 10.7.0 -L macOS/binaries -lSystem.B -o macOS/binaries/libobjc.A.dylib macOS/binaries/libobjc.o
rm macOS/binaries/libobjc.o

## build Foundation
nasm -f macho64 macOS/assembly/Foundation.s -o macOS/binaries/Foundation.o
ld -dylib -macosx_version_min 10.7.0 -o macOS/binaries/Foundation macOS/binaries/Foundation.o
rm macOS/binaries/Foundation.o

## build test macho
nasm -f macho64 macOS/assembly/simple_macho.s -o macOS/binaries/simple_macho.o
ld -macosx_version_min 10.10.0 -arch x86_64 -e main -lc -o macOS/binaries/simple_macho macOS/binaries/simple_macho.o
rm macOS/binaries/simple_macho.o
