(function (exports) {
    "use strict";

    var path = require("path"),
        fs = require("fs"),
        $ = require("node-class"),
        Mirror,
        loggin;

    function sort_by_path_level(pathname, pathname2) {
        var x = pathname.split(path.sep),
            y = pathname2.split(path.sep);

        return x.length - y.length;
    }

    Mirror = new $.Class("Mirror", {
    });

    Mirror.extends($.Events);

    Mirror.abstract({
        connect: function () {},
        disconnect: function () {},
        mv: function (source_path, destination_path, cb_fn) {},
        put: function (source_path, destination_path, cb_fn) {},
        rmdir: function (relative_path, cb_fn) {},
        rm: function (destination_path, cb_fn) {},
        mkdir: function (destination_path, cb_fn) {},
        exists: function (destination_path, cb_fn) {},
        list: function(destination_path, recursive, cb_fn) {},
        stat: function(destination_path, cb_fn) {}
    });

    Mirror.final({
        __manage_error: function (err, fn_name, args) {
            if (this.has_listener("error")) {
                return this.emit("error", [err]);
            }
            console.log(err, fn_name, args);
            throw err;
        }
    });

    Mirror.implements({
        __construct: function (options) {
            this.parent();

            loggin = options.loggin || console;
        },
        __sort_directories: function (directories) {
            var i,
                max;

            for(i = 0, max = directories.length; i < max; ++i) {
                directories[i] = path.normalize(directories[i]);
            }

            directories.sort(sort_by_path_level);

            return directories;
        },
        mkdirlist: function(directories, cb_fn) {
            loggin.log("info", "mkdirlist@start", directories);
            if(directories.length === 0) {
                return cb_fn();
            }

            var seq = new $.Sequence(),
                i = directories.length,
                max;

            directories = this.__sort_directories(directories);

            for (i = 0, max = directories.length; i < max; ++i) {
                (function() {
                    var directory = directories[i],
                        idx = i;
                    seq.push(function (work) {
                        this.mkdir("/" + directory, function () {
                            work.done();
                        });
                    }.bind(this));
                }.bind(this))();
            }

            // the last one in the sequence call the callback
            seq.push(function (work) {
                work.done();

                loggin.log("info", "mkdirlist@done");
                cb_fn();
            }).fire();
        },
        rmdirlist: function(directories, cb_fn) {
            loggin.log("info", "mkdirlist@start", directories);
            if(directories.length === 0) {
                return cb_fn();
            }

            var seq = new $.Sequence(),
                i = directories.length,
                max;

            directories = this.__sort_directories(directories).reverse();

            for (i = 0, max = directories.length; i < max; ++i) {
                (function() {
                    var directory = directories[i];
                    seq.push(function (work) {
                        this.rmdir(directory, function () {
                            work.done();
                        });
                    }.bind(this));
                }.bind(this))();
            }

            // the last one in the sequence call the callback
            seq.push(function (work) {
                work.done();

                loggin.log("info", "mkdirlist@done");
                cb_fn();
            }).fire();
        },
        rmlist: function (files, cb_fn) {
            loggin.log("info", "rmlist", files);

            if(files.length === 0) {
                return cb_fn();
            }

            var seq = new $.Sequence(),
                i = files.length;

            while (i--) {
                (function () {
                    var file = files[i];
                    seq.push(function (work) {
                        this.rm(file, function () {
                            work.done();
                        });
                    }.bind(this));
                }.bind(this))();
            }

            // the last one in the sequence call the callback
            seq.push(function (work) {
                work.done();

                loggin.log("info", "rmlist@done");
                cb_fn();
            }).fire();
        },
        putlist: function (files, cb_fn) {
            loggin.log("info", "putlist", files);

            if(files.length === 0) {
                return cb_fn();
            }

            var seq = new $.Sequence(),
                i;

            i = files.length;
            while (i--) {
                (function () {
                    var file = files[i];
                    seq.push(function (work) {
                        this.put(file[0], file[1], function () {
                            work.done();
                        });
                    }.bind(this));
                }.bind(this))();
            }

            // the last one in the sequence call the callback
            seq.push(function (work) {
                work.done();

                loggin.log("info", "putlist@done");
                cb_fn();
            }).fire();
        }
    });

    exports.Mirror = Mirror;

}(module.exports));