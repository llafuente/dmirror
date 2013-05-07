(function (exports) {
    "use strict";

    var path = require("path"),
        fs = require("fs"),
        $ = require("node-class"),
        Mirror;

    function sort_by_path_is_inside(pathname, pathname2) {
        var relative = path.relative(pathname, pathname2);

        return relative.substring(0, 2) === ".." ? 1 : 0;
    }

    function path_level(path) {
        var levels = path.match(/(\/|\\)/g);
        return levels === null ? 0 : levels.length;
    }

    function sort_by_path_level(pathname, pathname2) {

        return path_level(pathname) > path_level(pathname2);
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
        __manage_error: function (err) {
            if (this.has_listener("error")) {
                return this.emit("error", [err]);
            }
            throw err;
        }
    });

    Mirror.implements({
        __sort_directories: function (directories) {
            directories.sort(sort_by_path_level);

            directories.sort(sort_by_path_is_inside);

            return directories;
        },
        mkdirlist: function(directories, cb_fn) {
            if(directories.length === 0) {
                return cb_fn();
            }

            var seq = new $.Sequence(),
                i = directories.length;

            directories = this.__sort_directories(directories);
            while (i--) {
                (function() {
                    seq.push(function (work) {
                        this.mkdir(directory, function () {
                            work.done();
                        });
                    }.bind(this));
                });
            }

            // the last one in the sequence call the callback
            seq.push(function (work) {
                work.done();

                $.debug("mkdirlist@done");
                cb_fn();
            }).fire();
        },
        rmlist: function (files, directories, cb_fn) {
            $.debug("rmlist", files, directories);

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

            directories = this.__sort_directories(directories).reverse();
            i = directories.length;
            while (i--) {
                (function () {
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

                $.debug("rmlist@done");
                cb_fn();
            }).fire();
        },
        putlist: function (files, directories, cb_fn) {

            $.debug("putlist", files, directories);

            var seq = new $.Sequence(),
                i;

            directories = this.__sort_directories(directories);
            directories.reverse();
            i = directories.length;
            while (i--) {
                (function () {
                    var directory = directories[i];
                    seq.push(function (work) {
                        this.mkdir(directory, function () {
                            work.done();
                        });
                    }.bind(this));
                }.bind(this))();
            }

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

                $.debug("putlist@done");
                cb_fn();
            }).fire();
        }
    });

    exports.Mirror = Mirror;

}(module.exports));