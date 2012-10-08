var path = require("path"),
    fs = require("fs"),
    $ = require("node-class");

function sort_by_path_is_inside(pathname, pathname2) {
    var relative = path.relative(pathname, pathname2);

    console.log(pathname, "to" ,pathname2, "@", relative);

    return relative.substring(0,2) == ".." ? 1 : 0;
}

function path_level(path) {
    var levels = path.match(/(\/|\\)/g);
    return levels === null ? 0 : levels.length;
}

function sort_by_path_level(pathname, pathname2) {
    console.log(path_level(pathname), "@", pathname);
    console.log(path_level(pathname2), "@", pathname2);

    return path_level(pathname) > path_level(pathname2);
}


var Mirror = new $.Class("Mirror", {
});

Mirror.extends($.Events);

Mirror.abstract(Object.keys({
    connect: function() {},
    disconnect: function() {},
    mv: function(source_path, destination_path, cb_fn) {},
    put: function(source_path, destination_path, cb_fn) {},
    rmdir: function(relative_path, cb_fn) {},
    rm: function(destination_path, cb_fn) {},
    mkdir: function(destination_path, cb_fn) {},
}));

Mirror.final({
    __manage_error: function(err) {
        if(this.has_listener("error")) {
            return this.emit("error", [err]);
        }
        throw err;
    },
});

Mirror.implements({
    sort_directories: function(directories) {
        directories.sort(sort_by_path_level);
        console.log(directories);

        directories.sort(sort_by_path_is_inside);
        console.log(directories);

        return directories;
    },
    rmlist: function(files, directories, cb_fn) {
        $.debug("rmlist", files, directories);

        var seq = new $.Sequence();

        var i = files.length;
        while(i--) {
            (function() {
                var file = files[i];
                seq.push(function(work) {
                    this.rm(file, function() {
                        work.done();
                    });
                }.bind(this));
            }.bind(this))();
        }

        directories = this.sort_directories(directories).reverse();
        i = directories.length;
        while(i--) {
            (function() {
                var directory = directories[i];
                seq.push(function(work) {
                    this.rmdir(directory, function() {
                        work.done();
                    });
                }.bind(this));
            }.bind(this))();
        }


        // the last one in the sequence call the callback
        seq.push(function(work) {
            work.done();

            $.debug("rmlist@done");
            cb_fn();
        }).fire();
    },
    putlist: function(files, directories, cb_fn) {

        $.debug("putlist", files, directories);

        var seq = new $.Sequence();

        directories = this.sort_directories(directories);
        directories.reverse();
        i = directories.length;
        while(i--) {
            (function() {
                var directory = directories[i];
                seq.push(function(work) {
                    this.mkdir(directory, function() {
                        work.done();
                    });
                }.bind(this));
            }.bind(this))();
        }

        var i = files.length;
        while(i--) {
            (function() {
                var file = files[i];
                seq.push(function(work) {
                    this.put(file[0], file[1], function() {
                        work.done();
                    });
                }.bind(this));
            }.bind(this))();
        }

        // the last one in the sequence call the callback
        seq.push(function(work) {
            work.done();

            $.debug("putlist@done");
            cb_fn();
        }).fire();
    }
});


module.exports = Mirror;
/*

function get_sorted_list(list) {
    $.debug(list);

    var files = [];
    var directories = [];

        console.log(list);
        var i = list.length;
        console.log(i);
        while(i--) {
            list[i] = path.normalize(list[i]);
            var st = fs.statSync('C:\\noboxout\\raid\\test2\\'+list[i]);
            if(!st.isDirectory || !st.isDirectory()) {
                files.push(list[i]);
            } else {
                directories.push(list[i]);
            }
        }

        files.sort(cmp_by_level);



        return {
            files: files,
            directories: directories
        };
}

console.log(
    get_sorted_list(['new-path2\\in3\\in4', 'new-path2', 'new-path2\\file.txt', 'new-path2\\in2', 'new-path2\\in3'])
);

process.exit();

*/