(function (exports) {
    "use strict";

    var path = require("path"),
        fs = require("fs"),
        $ = require("node-class"),
        FTPMirror = require("./ftp-mirror.js").FTP,
        FSMirror = require("./fs-mirror.js").FS,
        Sync,
        loggin;

    Sync = new $.Class("Sync", {
        __target: null,
        src: null,
        recursive: false,
        exclude: null,
    });

    Sync.extends($.Events);

    Sync.implements({
        __construct: function(cfg) {
            this.source = path.normalize(cfg.source);
            this.recursive = cfg.recursive;
            this.exclude = cfg.exclude || [];
            loggin = cfg.loggin || console;

            cfg.target.loggin = loggin;

            switch (cfg.protocol) {
            case "ftp":
                this.__target = new FTPMirror(cfg.target);
                this.__target.connect();
                break;
            case "fs":
                this.__target = new FSMirror(cfg.target);
                this.__target.connect();
                break;
            }


        },
        sync: function (filter) {
            filter = filter || null;

            console.log("\n#sync\n");
            this.__target.list(this.source, true, this.recursive, function(src_list) {
                var i,
                    max,
                    found,
                    j,
                    jmax,
                    target_filename,
                    fstarget = this.__target,
                    directories = [],
                    files = [],
                    in_cb,
                    src_directory = this.source;

                // exlude files first
                if (this.exclude.length) {
                    for (i = 0, max = this.exclude.length; i < max; ++i) {
                        for (j = 0, jmax = src_list.length; j < jmax; ++j) {
                            if (this.exclude[i].test(src_list[j].path)) {
                                src_list.splice(j, 1);
                                --jmax;
                                --j;
                            }
                        }
                    }
                }

                //filter
                if(filter !== null) {
                    src_list = filter(src_list);
                }
                loggin.log("info", "al final: ", src_list);

                if(src_list.length === 0) {
                    return ;
                }


                $.SerialExec = function(list, async_fn, callback) {
                    if (!list.length) {
                        return callback(null, []);
                    }
                    var copy = list.concat();

                    async_fn(copy.shift(), function handler() {
                        if (copy.length) {
                            async_fn(copy.shift(), handler);
                        } else {
                            callback(null);
                        }
                    });
                }

                $.SerialExec(src_list, function(obj, cb) {
                    var archive = obj.path.substr(src_directory.length);
                    fstarget.exists(archive, function (exists) {
                        loggin.log("info", archive, exists);
                        if(!exists) {
                            obj.directory ? directories.push(archive) : files.push([path.join(src_directory, archive), archive]);
                            cb();
                        } else if(!obj.directory) {
                            //check filesize
                            fstarget.stat(archive, function(err, st) {
                                loggin.log("info", "exists but changed ?", st.mtime.getTime(), "#", obj.mtime.getTime(), " = ", st.mtime != obj.mtime);

                                if(st.mtime.getTime() != obj.mtime.getTime()) {
                                    files.push([path.join(src_directory, archive), archive]);
                                }
                                cb();
                            });
                        } else {
                            cb();
                        }
                    });
                }, function () {
                    loggin.log("info", "putlist -> ", files, directories);

                    console.log("files = ", files.length);
                    console.log("directories = ", directories.length);

                    console.log("directories = ", directories);
                    fstarget.mkdirlist(directories, function () {
                        console.log("files = ", files);
                        fstarget.putlist(files, function () {
                            loggin.log("info", "sync done!");
                        }.bind(this));
                    }.bind(this));
                });
            }.bind(this));
        }
    });

    exports.Sync = Sync;

}(module.exports));
