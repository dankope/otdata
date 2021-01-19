// require this in your onetap scripts
const Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    encode: function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = Base64._utf8_encode(input);
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }
        return output;
    },
    decode: function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        //removed redundant regex
        input = input.replace(/[^A-Za-z0-9+\/=]/g, "");
        while (i < input.length) {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 !== 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = Base64._utf8_decode(output);
        return output;
    },
    _utf8_encode: function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    },
    _utf8_decode: function (utftext) {
        var string = "";
        var i = 0;
        var c, c2, c3 = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
};

/**
* @param cordlen the length of pieces to chop the string into
* @returns Array all the equal-sized pieces of the string, and one optional remainder piece shorter than cordlen
**/
String.prototype.cordwood = function (cordlen) {
    if (cordlen === undefined || cordlen > this.length) {
        cordlen = this.length;
    }
    var pieces = [];
    for (i = 0; i < this.length / cordlen; i++) {
        pieces.push(this.slice(i * cordlen, cordlen))
    }
    return pieces;
};

const DataFileEx = {
    /**
    * @param dataFile The datafile to load.
    * @returns JSON object from the datafile.
    **/
    Load: function (dataFile) {
        DataFile.Load(dataFile);
        var meta = DataFile.GetKey(dataFile, "meta")
        // forgive the code below :/
        if (meta === undefined) {
            return {};
        } else {
            meta = JSON.parse(meta);
        }
        if (!("meta" in meta)) {
            return {};
        } else {
            meta = meta['meta'];
        }
        if (!("max" in meta)) {
            return {};
        } else {
            max = meta['max'];
        }
        var data = "";
        var id;
        for (id = 0; id < max; id++) {
            key = JSON.parse(DataFile.GetKey(dataFile, "out-" + id.toString()));
            if ('v' in key) {
                data += key['v'];
            }
        }
        return JSON.parse(Base64.decode(data));
    },
    /**
    * saves the JSON to the datafile on disk, returns true if successful.
    * @param dataFile The datafile to save to.
    * @param data The data to save.
    **/
    Save: function (dataFile, data) {
        if (data === undefined || dataFile === undefined) {
            return false;
        } else if (dataFile.length < 1) {
            return false;
        }
        var arr = Base64.encode(JSON.stringify(data)).cordwood(250);
        for (id in arr) {
            DataFile.SetKey(dataFile, "out-" + id.toString(), JSON.stringify({ id: "out-" + id.toString(), v: arr[id] }));
        }
        DataFile.SetKey(dataFile, "meta", JSON.stringify({ "meta": { "max": arr.length } }));
        DataFile.Save(dataFile);
        return true;
    }
}

exports.save = DataFileEx.Save;
exports.load = DataFileEx.Load;