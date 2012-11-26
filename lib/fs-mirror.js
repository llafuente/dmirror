(function (exports) {
    "use strict";

    var $ = require("node-class"),
        Mirror = require("./mirror.js").Mirror,
        path = require("path"),
        fs = require('fs'),
        FS = new $.Class("FSMirror", {
            __options: null,
            online: true
        });

    $.debug = console.log;

    function rm_tree(directory, callback) {
        path.exists(directory, function (exists) {
            if (!exists) {
                return callback();
            }

            fs.readdir(directory, function (err, files) {
                if (err) {
                    return callback(err);
                }

                var fullNames = files.map(function (file) { return path.join(directory, file); });
                mapAsync(fullNames, fs.stat, function (err, stats) {
                    var files = [],
                        dirs = [],
                        i;

                    for (i = 0; i < fullNames.length; i++) {
                        if (stats[i].isDirectory()) {
                            dirs.push(fullNames[i]);
                        } else {
                            files.push(fullNames[i]);
                        }
                    }
                    serial(files, fs.unlink, function (err) {
                        if (err) {
                            return callback(err);
                        }

                        serial(dirs, exports.rmTree, function (err) {
                            if (err) {
                                return callback(err);
                            }

                            fs.rmdir(directory, callback);
                        });
                    });
                });
            });
        });
    }

    function serial(list, async, callback) {
        if (!list.length) {
            return callback(null, []);
        }
        var copy = list.concat();

        async(copy.shift(), function handler(err) {
            if (err) {
                return callback(err);
            }

            if (copy.length) {
                async(copy.shift(), handler);
            } else {
                callback(null);
            }
        });
    }

    function mapAsync(list, mapper, callback) {
        if (!list.length) {
            return callback(null, []);
        }

        var copy = list.concat(),
            map = [];

        mapper(copy.shift(), function handler(err, value) {
            map.push(value);
            if (copy.length) {
                mapper(copy.shift(), handler);
            } else {
                callback(null, map);
            }
        });
    }

    FS.extends(Mirror);

    FS.implements({
        __construct: function (options) {
            this.parent();
            $.debug("fs config", options);
            this.__options = options;
        },
        connect: function () {
            $.debug("connect done!");
        },
        disconnect: function () {
            console.log(arguments);
        },
        mv: function (source_path, destination_path, cb_fn) {
            $.debug("mv", source_path, "@", destination_path);

            fs.rename(
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
                console.log("put/read", err);
                fs.writeFile(this.__options.dir + "/" + destination_path, data, "binary", function (err, res) {
                    console.log("put/put", err);
                    if (err) { this.__manage_error(err); }

                    $.debug("put@done", source_path, "@", destination_path);
                    cb_fn();
                }.bind(this));
            }.bind(this));
        },
        rmdir: function (destination_path, cb_fn) {
            $.debug("rmdir", destination_path);

            var directory = path.join(this.__options.dir, destination_path);
            if (!path.existsSync(directory)) {
                return;
            }

            rm_tree(directory, function (err, res) {
                if (err) { this.__manage_error(err); }

                $.debug("rmdir@done", destination_path);
                cb_fn();
            }.bind(this));
        },
        rm: function (destination_path, cb_fn) {
            $.debug("rm", destination_path);

            fs.unlink(this.__options.dir + "/" + destination_path, function (err, data) {
                if (err) { this.__manage_error(err); }

                $.debug("rm@done", destination_path);
                cb_fn();
            }.bind(this));
        },
        mkdir: function (destination_path, cb_fn) {
            $.debug("mkdir", destination_path);

            fs.mkdir(this.__options.dir + "/" + destination_path, function (err, res) {
                if (err) { this.__manage_error(err); }

                $.debug("mkdir@done", destination_path);
                cb_fn();
            }.bind(this));
        }
    });

    exports.FS = FS;

}(module.exports));