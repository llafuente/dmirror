var FSMirror = require("../index.js").FS,
    fs = require("fs"),
    path = require("path"),
    winston = require("winston"),
    dst_dir = path.join(path.dirname(process.mainModule.filename), "dst"),
    tap = require("tap"),
    test = tap.test,
    g_timeout = 2000,
    rimraf = require("rimraf");

var mirror = new FSMirror({
    dir: dst_dir
});

//clear
try { rimraf.sync(dst_dir); } catch(e) {}
try { fs.mkdirSync(dst_dir, function() {}); } catch(e) {}


test("test: mkdirlist", function(t) {

    var path_list = [
        "/path2/xxx/dddd/zzzz",
        "/path3/xxx/dddd",
        "/path2/xxx/dddd",
        "/path3",
        "/path3/xxx",
        "/path2/xxx",
        "/path2"
    ];

    mirror.mkdirlist(path_list.concat(), function() {
        var i,
            max;

        for(i = 0, max = path_list.length; i < max; ++i) {
            t.equal(fs.existsSync(dst_dir + path_list[i]), true, "file " + path_list[i] + " created");
        }

        t.end();
    });
});

test("test: rmdirlist", function(t) {

    var path_list = [
        "/path2/xxx/dddd/zzzz",
        "/path3/xxx/dddd",
        "/path2/xxx/dddd",
        "/path3",
        "/path3/xxx",
        "/path2/xxx",
        "/path2"
    ];

    mirror.rmdirlist(path_list.concat(), function() {
        var i,
            max;

        for(i = 0, max = path_list.length; i < max; ++i) {
            t.equal(fs.existsSync(dst_dir + path_list[i]), false, "file " + path_list[i] + " created");
        }

        t.end();
    });
});