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
    $.debug = function() {};

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
            $.debug(arguments);
        },
        mv: function (source_path, destination_path, cb_fn) {
            $.debug("mv@start ", source_path, "@", destination_path);

            fs.rename(
                path.join(this.__options.dir, source_path),
                path.join(this.__options.dir, destination_path),
                function (err, res) {
                    if (err) { this.__manage_error(err); }

                    $.debug("mv@done ", source_path, "@", destination_path);
                    cb_fn();
                }.bind(this)
            );
        },
        put: function (source_path, destination_path, cb_fn) {
            $.debug("put@start ", source_path, "@", destination_path);
            var output_file = path.join(this.__options.dir, destination_path),
                input_stats = fs.statSync(source_path);
            fs.readFile(source_path, "binary", function (err, data) {
                $.debug("put@read ", err);
                fs.writeFile(output_file, data, "binary", function (err, res) {
                    $.debug("put@put ", err);
                    if (err) { this.__manage_error(err); }

                    $.debug("put@done ", source_path, "@", destination_path);
                    fs.utimesSync(output_file, input_stats.atime, input_stats.mtime);
                    cb_fn();
                }.bind(this));
            }.bind(this));
        },
        rmdir: function (destination_path, cb_fn) {
            $.debug("rmdir@start ", destination_path);

            var directory = path.join(this.__options.dir, destination_path);
            if (!path.existsSync(directory)) {
                return;
            }

            rm_tree(directory, function (err, res) {
                if (err) { this.__manage_error(err); }

                $.debug("rmdir@done ", destination_path);
                cb_fn();
            }.bind(this));
        },
        rm: function (destination_path, cb_fn) {
            $.debug("rm@start ", destination_path);

            fs.unlink(path.join(this.__options.dir, destination_path), function (err, data) {
                if (err) { this.__manage_error(err); }

                $.debug("rm@done ", destination_path);
                cb_fn();
            }.bind(this));
        },
        mkdir: function (destination_path, cb_fn) {
            $.debug("mkdir@start ", destination_path);

            fs.mkdir(path.join(this.__options.dir, destination_path), function (err, res) {
                if (err) { this.__manage_error(err); }

                $.debug("mkdir@done ", destination_path);
                cb_fn();
            }.bind(this));
        },
        exists: function (destination_path, cb_fn) {
            fs.exists(path.join(this.__options.dir, destination_path), cb_fn);
        },
        list: function(destination_path, recursive, cb_fn) {
            recursive = recursive || false;
            $.debug("list@start ", destination_path, "#", recursive);

            var output = [],
                final_cb = function() {
                    $.debug("list@end ", output);
                    cb_fn(output);
                };

            fs.readdir(destination_path, function(err, list) {

                serial(list, function (obj, cb_current_level) {
                    var filename = path.join(destination_path, obj),
                        d = fs.statSync(filename),
                        directories = [],
                        i,
                        max;

                    if (d !== null) {
                        output.push({
                            size: d.size,
                            mtime: d.mtime,
                            atime: d.atime,
                            path: filename,
                            directory: d.isDirectory()
                        });

                        if (d.isDirectory() && recursive) {
                            directories.push(filename);
                        }
                    }

                    if(directories.length === 0) {
                        cb_current_level();
                    } else {
                        serial(directories, function(obj, cb_recursive) {
                            this.list(obj, recursive, function(list2) {
                                var i, max;
                                for (i = 0, max = list2.length; i < max; ++i) {
                                    output.push(list2[i]);
                                }

                                cb_recursive();
                            });
                        }.bind(this), cb_current_level);
                    }
                }.bind(this), final_cb);
            }.bind(this));

            return null;
        },
        stat: function(destination_path, cb_fn) {
            fs.stat(path.join(this.__options.dir, destination_path), cb_fn);
        },
    });

    exports.FS = FS;

}(module.exports));