(function (exports) {
    "use strict";

    var fs = require("fs"),
        FTPMirror = require("./ftp-mirror.js").FTP,
        FSMirror = require("./fs-mirror.js").FS,
        path = require("path"),
        util = require("util"),
        assert = require("assert"),
        $ = require("node-class"),
        ArrayClone = $.ArrayClone,
        RegExpEscape = $.RegExpEscape,
        loggin = null,
        Raid;

    /**
     * @class Raid
     */
    Raid = new $.Class("Raid", {
        /**
         * @memberOf Raid
         * @type object
         */
        __cfg : null,
        __events: [],
        __watchs: [],
        __files: [],
        __target: null,

        __action_queue: null
    });


    Raid.extends($.Events);

    Raid.implements({
        __construct: function (config) {
            this.__cfg = config;
            //this is a bit nasty hack...
            loggin = config.loggin;

            this.__cfg.polling = this.__cfg.polling || 500;
            this.__cfg.recursive = this.__cfg.recursive === false ? false : true;

            this.__cfg.source = path.normalize(this.__cfg.source);
            switch (this.__cfg.protocol) {
            case "ftp":
                this.__target = new FTPMirror(config.target);
                this.__target.connect();
                break;
            case "fs":
                this.__target = new FSMirror(config.target);
                this.__target.connect();
                break;
            }

            this.__target.on("error", function (err) {
                loggin.log("error", err);
            });

            loggin.log("error", util.inspect(config));
            this.watch_all(this.__cfg.source, this.__cfg.recursive);

            //this.event_emitter.periodical(this.__cfg.polling, this);

            this.__action_queue = new $.Sequence();
        },
        debug_file_list: function (list, name) {
            var i,
                max = list.length;

            loggin.log("info", "-----------file list-" + name + "----------");
            for (i = 0; i < max; ++i) {
                loggin.log("info", list[i].state !== undefined ? "[" + list[i].state + "]" : "", list[i].rel_filename);
            }
            loggin.log("info", "-------------------------------");
        },
        get_files_under: function (filelist, directory) {
            var i = filelist.length,
                list = [],
                regex;

            directory = path.normalize("./" + directory);
            if (directory === ".") {
                directory = path.normalize("./");
            }

            regex = new RegExp("^" + RegExpEscape(directory));

            while (i--) {
                if (filelist[i].rel_filename.match(regex)) {
                    list.push(filelist[i]);
                }
            }
            return list;
        },
        get_file: function (filename, and_update) {
            and_update = and_update || false;
            filename = path.normalize(filename);
            var i = this.__files.length,
                file_data = null;

            while (i--) {
                if (this.__files[i].rel_filename === filename) {
                    if (and_update) {
                        file_data = this.get_filestats(this.__files[i].full_filename);
                        if (file_data !== null) {
                            this.__files[i] = file_data;
                        } else {
                            this.__files.splice(i, 1);
                            return null;
                        }
                    }
                    return this.__files[i];
                }
            }
            return null;
        },
        get_filestats: function (filename) {
            if (!path.existsSync(filename)) {
                return null;
            }

            var st = fs.statSync(filename);

            //normalize the object!
            if (st.isDirectory === undefined) {
                st.isDirectory = function () {
                    return false;
                };
            }

            st.file_name = path.basename(filename);
            st.full_filename = path.normalize(filename);

            st.rel_filename = path.normalize("./" + filename.substring(this.__cfg.source.length));
            if (st.isDirectory()) {
                st.relative_directory = path.normalize("./" + filename.substring(this.__cfg.source.length));
            } else {
                st.relative_directory = path.normalize("./" + path.dirname(filename).substring(this.__cfg.source.length));
            }

            if (st.relative_directory === ".") {
                st.relative_directory = path.normalize("./");
            }



            return st;
        },
        get_diff_files: function (filelist, filelist2) {
            var i = filelist.length,
                j = 0,
                diff = [],
                found;

            while (i--) {
                j = filelist2.length;
                found = false;
                while (j--) {
                    if (filelist[i].full_filename === filelist2[j].full_filename) {
                        found = true;
                        filelist2.splice(j, 1);
                        break;
                    }
                }
                if (!found) {
                    filelist[i].state = "missing";
                    diff.push(filelist[i]);
                }
            }
            j = filelist2.length;
            found = false;
            while (j--) {
                filelist2[j].state = "new";
                diff.push(filelist2[j]);
            }

            return diff;
        },
        readdir: function (dir, recursive) {
            recursive = recursive || false;

            if (this.is_excluded(dir)) {
                return;
            }

            var list = fs.readdirSync(dir),
                rlist = [],
                i,
                max = list.length,
                files = [],
                j = 0,
                d = null;

            loggin.log("warn", "readdir: " + dir + " recurive?" + (recursive ? "yes" : "no") + "@" + list.length);

            for (i = 0; i < max; ++i) {
                d = this.get_filestats(path.join(dir, list[i]));
                if (d !== null) {
                    files.push(d);
                    if (d.isDirectory() && recursive) {
                        //dont know why i have to do this... but i must!
                        //var old_files = files;
                        rlist = this.readdir(d.full_filename, recursive);

                        if (rlist) {
                            j = rlist.length;
                            while (j--) {
                                files.push(rlist[j]);
                            }
                        }
                    }
                }
            }
            return files;
        },
        watch_all: function (directory, recursive) {
            recursive = recursive || false;

            this.__watchs = [];
            this.__files = this.readdir(directory, recursive);
            loggin.log("warn", util.inspect(this.__files));
            var root_stats = this.get_filestats(directory),
                i;
            if (root_stats === null) {
                throw "cannot get root stats, maybe dont exists";
            }

            this.watch_directory(root_stats);

            if(recursive) {
                i = this.__files.length;
                while (i--) {
                    if (this.__files[i].isDirectory()) {
                        this.watch_directory(this.__files[i]);
                    }
                }
            }
        },

        is_excluded: function (filename) {

            var i;
            for (i in this.__cfg.exclude) {
                if (this.__cfg.exclude[i].test(filename)) {
                    return true;
                }
            }

            return false;
        },

        watch_directory: function (file_stat) {
            console.log("\nwatch:",file_stat.full_filename, "\n", new Error().stack,"\n");


            if (!path.existsSync(file_stat.full_filename) || !file_stat.isDirectory() || this.is_excluded(file_stat.full_filename)) {
                return;
            }

            loggin.log("error", "watch: ", file_stat.full_filename, " --> ", file_stat.relative_directory);

            var watch = fs.watch(file_stat.full_filename, this.event_listener.bind({
                self: this,
                base_dir: path.normalize(file_stat.relative_directory + "/")
            }));

            watch.on("error", function () {
                this.unwatch_directory(file_stat);

                if (!path.existsSync(file_stat.full_filename)) {
                    return;
                }
                //retry!
                this.watch_directory(file_stat);
            }.bind(this));

            this.__watchs.push({
                file_stat : file_stat,
                handler: watch
            });

        },
        unwatch_directory: function (file_stat) {
            var i = this.__watchs.length,
                watch = null,
                regex;

            loggin.log("error", "unwatch: ", file_stat.full_filename, " --> ", file_stat.relative_directory);

            regex = new RegExp("^" + RegExpEscape(file_stat.full_filename));

            while (i--) {
                if (this.__watchs[i].file_stat.full_filename.match(regex)) {
                    loggin.log("error", "unwatch: ", this.__watchs[i].file_stat.full_filename);

                    watch = this.__watchs.splice(i, 1);
                    watch[0].handler.close();
                    return true;
                }
            }
            return watch !== null;
        },
        unwatch_all: function (directory) {
            loggin.log("error", "stop watching");
            if (!this.__watchs.length) {
                return false;
            }
            var i = this.__watchs.length;
            while (i--) {
                this.__watchs[i].handler.close();
            }
            return true;
        },
        event_listener: function (event, name) {
            if (name !== null) {
                name = path.normalize(path.join(this.base_dir, name));
            }
            return this.self.event_emitter(event, name);
        },
        event_emitter: function (event, name) {
            loggin.log("info", "-----------new event-----------");
            loggin.log("info", arguments);
            loggin.log("info", "-------------------------------");

            switch (event) {
            case "rename":
                return this.event_emitter_rename(name);

            case "change":
                return this.event_emitter_change(name);

            }

            $.error(arguments);
            throw "no event handler";
        },
        event_emitter_change: function (name) {
            var file_data = null;

            loggin.log("warn", "event_emitter_change", name);

            switch (name) {
            case null:
                throw "who changes, nobody !?";
            default:
                file_data = this.get_file(name, true);

                if (file_data === null) {
                    return;
                }

                //only copy files!
                if (!file_data.isDirectory()) {
                    $.error("--> put", file_data.full_filename, "@", file_data.rel_filename);

                    this.__action_queue.push(function (work) {
                        this.__target.put(file_data.full_filename, file_data.rel_filename, function () {
                            work.done();
                        });
                    }.bind(this)).fire();
                } else {
                    //something could be renamed?!
                    this.event_emitter_rename();
                }

            }
            return null;
        },
        event_emitter_rename: function (name) {
            var file_data = null,
                action_done = false,
                // get files
                newfiles = this.readdir(this.__cfg.source, this.__cfg.recursive),
                //who is renamed/changed/deleted ?
                diff = this.get_diff_files(this.__files, ArrayClone(newfiles)),
                //how many
                i = diff.length,
                files,
                directories;

            loggin.log("warn", "event_emitter_rename" + name);

            //this.debug_file_list(this.__files, "files-before");
            //this.debug_file_list(newfiles, "files-now");
            //this.debug_file_list(diff, "the diff");

            this.__files = newfiles;

            // there is no change ?!
            if (i === 0) {
                loggin.log("warn", "no change detected ?!");
                return;
            }

            while (i--) {
                loggin.log("warn", "diff", i, " ", diff[i].file_name);
            }

            switch (diff.length) {
            case 1: // create
                loggin.log("error", "create file/dir");
                file_data = diff[0];

                if (file_data.state === "missing") {
                    //deleted
                    if (file_data.isDirectory()) {
                        this.unwatch_directory(file_data);
                        $.error("--> rmdir", file_data.rel_filename);
                        this.__action_queue.push(function (work) {
                            this.__target.rmdir(file_data.rel_filename, function () {
                                work.done();
                            });
                        }.bind(this)).fire();
                        action_done = true;
                    } else {
                        $.error("--> rm", file_data.rel_filename);
                        this.__action_queue.push(function (work) {
                            this.__target.rm(file_data.rel_filename, function () {
                                work.done();
                            });
                        }.bind(this)).fire();
                        action_done = true;
                    }

                } else {
                    //created
                    if (file_data.isDirectory()) {
                        $.error("--> mkdir", file_data.rel_filename);
                        this.__action_queue.push(function (work) {
                            this.__target.mkdir(file_data.rel_filename, function () {
                                work.done();
                            });
                        }.bind(this)).fire();
                        if(this.__cfg.recursive) {
                            this.watch_directory(file_data);
                        }
                        action_done = true;
                    } else {
                        $.error("--> put", file_data.full_filename, "@", file_data.rel_filename);

                        this.__action_queue.push(function (work) {
                            this.__target.put(file_data.full_filename, file_data.rel_filename, function () {
                                work.done();
                            });
                        }.bind(this)).fire();
                        action_done = true;
                    }
                }
                break;
            case 2: // rename!
                loggin.log("error", "rename file/dir");
                // both files or both dirs
                if (
                    (
                        //one change
                        (diff[0].state === "missing" && diff[1].state === "new")
                            ||
                        (diff[0].state === "new" && diff[1].state === "missing")
                    )
                        &&
                        (    //files or directories
                            (diff[0].isDirectory() && diff[1].isDirectory())
                            ||
                            (!diff[0].isDirectory() && !diff[1].isDirectory())
                        )
                ) {

                //console.log("XXXXXXXXXXXXXXXXXXXXXXX ????????????? XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx");
                //console.log(diff[0].state, diff[1].state);
                    if (diff[0].isDirectory() && this.__cfg.recursive) {
                        //console.log("HERE ??? !!!");
                        this.unwatch_directory(diff[0]);
                        this.watch_directory(diff[1]);
                    }

                    $.error("--> mv", diff[0].rel_filename, "@", diff[1].rel_filename);

                    this.__action_queue.push(function (work) {
                        this.__target.mv(diff[0].rel_filename, diff[1].rel_filename, function () {
                            work.done();
                        });
                    }.bind(this)).fire();
                    action_done = true;
                }
            default:
                loggin.log("error", "multiple actions! should all be create! btw.");

                if (!action_done) {
                    //
                    // missing
                    //

                    i = diff.length;
                    files = [];
                    directories = [];
                    while (i--) {
                        if (diff[i].state === "missing") {
                            if (diff[i].isDirectory()) {
                                directories.push(diff[i].rel_filename);
                                this.unwatch_directory(diff[i]);
                            } else {
                                files.push(diff[i].rel_filename);
                            }
                        }
                    }
                    if (files.length || directories.length) {
                        this.__action_queue.push(function (work) {
                            this.__target.rmlist(files, function () {
                                this.__target.rmdirlist(directories, function () {
                                    work.done();
                                });
                            });
                        }.bind(this)).fire();
                        action_done = true;
                    }

                    //
                    // new
                    //
                    i = diff.length;
                    files = [];
                    directories = [];
                    while (i--) {
                        if (diff[i].state === "new") {
                            if (diff[i].isDirectory()) {
                                directories.push(diff[i].rel_filename);
                                if(this.__cfg.recursive) {
                                    this.watch_directory(diff[i]);
                                }
                            } else {
                                files.push([diff[i].full_filename, diff[i].rel_filename]);
                            }
                        }
                    }
                    if (files.length || directories.length) {
                        this.__action_queue.push(function (work) {
                            this.__target.mkdirlist(directories, function () {
                                this.__target.putlist(files, function () {
                                    work.done();
                                }.bind(this));
                            }.bind(this));
                        }.bind(this)).fire();
                        action_done = true;
                    }
                }
                // check missing files!!
                // console.log();
                // missing files OK! delete them all!
                //
            }

            return null;
        }
    });

    exports.Raid = Raid;

}(module.exports));