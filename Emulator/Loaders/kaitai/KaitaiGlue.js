export class KaitaiGlue {
    static loadKaitai() {
        if (KaitaiGlue.prototype.loadedKaitai) {
            return;
        }

        var script = document.createElement("script");

        script.src = import.meta.url.substr(0, import.meta.url.lastIndexOf("/")) + "/KaitaiStream.js";
        script.async = "true";
        document.head.appendChild(script);

        KaitaiGlue.prototype.loadedKaitai = true;
    }

    static load(name) {
        if (KaitaiGlue.prototype.loaded[name]) {
            return;
        }

        var script = document.createElement("script");

        script.src = import.meta.url.substr(0, import.meta.url.lastIndexOf("/")) + `/${name}.js`;
        script.async = "true";
        document.head.appendChild(script);

        KaitaiGlue.prototype.loaded[name] = true;
    }
}

KaitaiGlue.prototype.loadedKaitai = false;
KaitaiGlue.prototype.loaded = {};