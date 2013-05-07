(function (exports) {
    "use strict";

    exports.Mirror = require("./lib/mirror.js").Mirror;
    exports.Sync = require("./lib/sync.js").Sync;
    exports.FTP = require("./lib/ftp-mirror.js").FTP;
    exports.FS = require("./lib/fs-mirror.js").FS;
    exports.Raid = require("./lib/dmirror.js").Raid;

}(module.exports));