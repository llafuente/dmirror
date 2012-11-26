(function (exports) {
    "use strict";

    var $ = require("node-class"),
        Mirror = require("./mirror.js").Mirror,
        FTPClient = require("jsftp"),
        fs = require("fs"),
        FTP = new $.Class("FTPMirror", {
            __options: null,
            ftp: null,
            online: false
        });

    FTP.extends(Mirror);

    FTP.implements({
        __construct: function (options) {
            this.parent();
            $.debug("ftp config", options);
            this.ftp = new FTPClient(options);
            this.__options = options;
        },
        connect: function () {
            this.ftp.auth(this.__options.user, this.__options.pass, function (err, res) {
                console.log(err, res);

                if (res.code === 230) {
                    $.debug("connect done!");
                    this.online = true;
                }
            }.bind(this));
        },
        disconnect: function () {
            console.log(arguments);
        },
        mv: function (source_path, destination_path, cb_fn) {
            $.debug("mv", source_path, "@", destination_path);

            this.ftp.rename(
                this.__options.dir + "/" + source_path,
                this.__options.dir + "/" + destination_path,
                function (err, res) {
                    if (err) { this.__manage_error(err); }

                    $.debug("mv@done", source_path, "@", destination_path);
                    cb_fn();
                }.bind(this)
            );
        },
        put: function (source_path, destination_path, cb_fn) {
            $.debug("put", source_path, "@", destination_path);

            fs.readFile(source_path, "binary", function (err, data) {
                if (err) { this.__manage_error(err); }

                var buffer = new Buffer(data, "binary");
                this.ftp.put(this.__options.dir + "/" + destination_path, buffer, function (err, res) {
                    if (err) {
                        throw err;
                    }

                    $.debug("put@done", source_path, "@", destination_path);
                    cb_fn();
                }.bind(this));
            }.bind(this));
        },
        rmdir: function (destination_path, cb_fn) {
            $.debug("rmdir", destination_path);
            //this.rm_tree(this.__options.dir + "/" + destination_path, cb_fn);
            this.ftp.raw.rmd(this.__options.dir + "/" + destination_path, function (err, res) {
                if (err) { this.__manage_error(err); }

                $.debug("rmdir@done", destination_path);
                cb_fn();
            }.bind(this));
        },
        rm: function (destination_path, cb_fn) {
            $.debug("rm", destination_path);

            this.ftp.raw.dele(this.__options.dir + "/" + destination_path, function (err, data) {
                if (err) { this.__manage_error(err); }

                $.debug("rm@done", destination_path);
                cb_fn();
            }.bind(this));
        },
        mkdir: function (destination_path, cb_fn) {
            $.debug("mkdir", destination_path);

            this.ftp.raw.mkd(this.__options.dir + "/" + destination_path, function (err, res) {
                if (err) { this.__manage_error(err); }

                if (res.code !== 257) {
                    $.warn(arguments);
                }

                $.debug("mkdir@done", destination_path);
                cb_fn();
            }.bind(this));
        }
    });


    exports.FTP = FTP;

}(module.exports));