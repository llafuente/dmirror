(function (exports) {
    "use strict";

    var $ = require("node-class"),
        Mirror = require("./mirror.js").Mirror,
        path = require("path"),
        fs = require('fs'),
        FS = new $.Class("FSMirror", {
            __options: null,
            online: true
        }),
        loggin;

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
        if (!list || !list.length) {
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
            this.parent(options);

            loggin = options.loggin || console;
            loggin.log("info", "fs config", options);

            this.__options = options;
        },
        connect: function () {
            loggin.log("info", "connect done!");
        },
        disconnect: function () {
            loggin.log("info", arguments);
        },
        mv: function (source_path, destination_path, cb_fn) {
            loggin.log("info", "mv@start ", source_path, "@", destination_path);

            fs.rename(
                path.join(this.__options.dir, source_path),
                path.join(this.__options.dir, destination_path),
                function (err, res) {
                    if (err) { this.__manage_error(err, "mv", [source_path, destination_path, cb_fn]); }

                    loggin.log("info", "mv@done ", source_path, "@", destination_path);
                    cb_fn();
                }.bind(this)
            );
        },
        put: function (source_path, destination_path, cb_fn) {
            loggin.log("info", "put@start ", source_path, "@", destination_path);
            var output_file = path.join(this.__options.dir, destination_path),
                input_stats = fs.statSync(source_path);
            fs.readFile(source_path, "binary", function (err, data) {
                loggin.log("info", "put@read ", err);
                fs.writeFile(output_file, data, "binary", function (err, res) {
                    loggin.log("info", "put@put ", err);
                    if (err) { this.__manage_error(err, "put", [source_path, destination_path, cb_fn]); }

                    loggin.log("info", "put@done ", source_path, "@", destination_path);
                    fs.utimesSync(output_file, input_stats.atime, input_stats.mtime);
                    cb_fn();
                }.bind(this));
            }.bind(this));
        },
        rmdir: function (destination_path, cb_fn) {
            loggin.log("info", "rmdir@start ", destination_path);

            var directory = path.join(this.__options.dir, destination_path);
            if (!path.existsSync(directory)) {
                cb_fn();
                return;
            }

            rm_tree(directory, function (err, res) {
                if (err) { this.__manage_error(err, "rmdir", [destination_path, cb_fn]); }

                loggin.log("info", "rmdir@done ", destination_path);
                cb_fn();
            }.bind(this));
        },
        rm: function (destination_path, cb_fn) {
            loggin.log("info", "rm@start ", destination_path);

            fs.unlink(path.join(this.__options.dir, destination_path), function (err, data) {
                if (err) { this.__manage_error(err, "rm", [destination_path, cb_fn]); }

                loggin.log("info", "rm@done ", destination_path);
                cb_fn();
            }.bind(this));
        },
        mkdir: function (destination_path, cb_fn) {
            loggin.log("info", "mkdir@start ", destination_path);

            destination_path = path.join(this.__options.dir, path.normalize(destination_path));

            fs.mkdir(destination_path, function (err, res) {
                if (err) { this.__manage_error(err, "mkdir", [destination_path, cb_fn]); }

                loggin.log("info", "mkdir@done ", destination_path);
                cb_fn();
            }.bind(this));
        },
        exists: function (destination_path, cb_fn) {
            fs.exists(path.join(this.__options.dir, destination_path), cb_fn);
        },
        list: function(destination_path, stats, recursive, cb_fn) {
            stats = stats || false;
            recursive = recursive || false;

            if(recursive) {
                stats = true;
            }

            loggin.log("info", "list@start ", destination_path, "#", recursive);

            var output = [],
                final_cb = function() {
                    loggin.log("info", "list@end ", output);
                    cb_fn(output);
                }.bind(this);

            fs.readdir(destination_path, function(err, list) {
                loggin.log("info", "readdir ", destination_path, " @ ", list);

                serial(list, function (obj, cb_current_level) {
                    var filename = path.join(destination_path, obj),
                        file_stat,
                        directories = [],
                        i,
                        max,
                        output_obj = {
                            path: filename
                        };

                    if(stats) {
                        //sync for performance issues, we cannot fire hundreds of requests
                        file_stat = fs.statSync(filename);

                        output_obj.size = file_stat.size;
                        output_obj.mtime = file_stat.mtime;
                        output_obj.atime = file_stat.atime;
                        output_obj.directory = file_stat.isDirectory();

                        if (file_stat.isDirectory() && recursive) {
                            directories.push(filename);
                        }
                    }

                    output.push(output_obj);


                    if(directories.length === 0) {
                        cb_current_level();
                    } else {
                        serial(directories, function(obj, cb_recursive) {
                            this.list(obj, stats, recursive, function(list2) {
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