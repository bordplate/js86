export class ObjectiveCHelper {
    loadStruct(struct, memory) {

    }
}

export class Struct {
    constructor(descriptor) {
        this.descriptor = descriptor;
    }
}

ObjectiveCHelper.prototype.struct_objc = {
    metclass: 'uint64',
    superclass: 'uint64',
    cache: 'uint64',
    vtable: 'uint64',
    data: 'uint64'
};