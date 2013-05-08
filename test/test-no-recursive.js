var Raid = require("../index.js").Raid,
    fs = require("fs"),
    path = require("path"),
    winston = require("winston"),
    src_dir = path.join(path.dirname(process.mainModule.filename), "src"),
    dst_dir = path.join(path.dirname(process.mainModule.filename), "dst"),
    tap = require("tap"),
    test = tap.test,
    g_timeout = 1000,
    rimraf = require("rimraf");

winston.add(winston.transports.File, { filename: "log" });
winston.remove(winston.transports.Console);

//clear
try { rimraf.sync(src_dir); } catch(e) {}
try { rimraf.sync(dst_dir); } catch(e) {}
try { fs.mkdirSync(src_dir, function() {}); } catch(e) {}
try { fs.mkdirSync(dst_dir, function() {}); } catch(e) {}
try { fs.unlinkSync(path.join(path.dirname(process.mainModule.filename), "log")); } catch(e) {}

var r = null;
r = new Raid({
    source: src_dir,
    protocol: "fs",
    recursive: false,
    target: {
        dir: dst_dir,
    },
    exclude: [new RegExp("/^\./")],
    polling: 1000,
    loggin: winston
});


test("test: put file.txt", function(t) {
    var content = "test me!";
    fs.writeFileSync(src_dir+"/file.txt", content, 'utf8');

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/file.txt"), true, "file /file.txt created");
        t.equal(fs.readFileSync(dst_dir+"/file.txt", 'utf8'), content, "content of /file.txt is correct");
        t.end();
    }, g_timeout);
});

test("test: mv file.txt new-file.txt", function(t) {
    fs.renameSync(src_dir+"/file.txt", src_dir+"/new-file.txt");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-file.txt"), true, "file /new-file.txt created");
        t.end();
    }, g_timeout);
});
test("test: rm new-file.txt", function(t) {
    fs.unlinkSync(src_dir+"/new-file.txt");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-file.txt"), false, "file /new-file.txt removed");
        t.end();
    }, g_timeout);
});


test("test: mkdir /path", function(t) {
    fs.mkdirSync(src_dir+"/path");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/path"), true, "directory /path created");
        t.end();
    }, g_timeout);
});

test("test: mv /path /new-path", function(t) {
    fs.renameSync(src_dir+"/path", src_dir+"/new-path");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-path"), true, "directory /new-path created");
        t.equal(fs.existsSync(dst_dir+"/path"), false, "directory must no exists: /path (moved)");
        t.end();
    }, g_timeout);
});

test("test: rmdir /new-path", function(t) {
    fs.rmdirSync(src_dir+"/new-path");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-path"), false, "directory /new-path removed");
        t.end();
    }, g_timeout);
});


test("test: mkdir /new-path2 && put /new-path2/file.txt", function(t) {
    fs.mkdirSync(src_dir+"/new-path2");
    var content = "test me!";
    fs.writeFileSync(src_dir+"/new-path2/file.txt", content, 'utf8');

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-path2"), true, "directory /new-path2 created");
        t.equal(fs.existsSync(dst_dir+"/new-path2/file.txt"), false, "file /new-path2/file.txt created");
        t.end();
    }, g_timeout);
});

test("test: mv /new-path2 /new-path3", function(t) {
    fs.renameSync(src_dir+"/new-path2", src_dir+"/new-path3");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-path3"), true, "directory /new-path3 found");
        t.equal(fs.existsSync(dst_dir+"/new-path3/file.txt"), false, "file /new-path3/file.txt found");

        t.equal(fs.existsSync(dst_dir+"/new-path2"), false, "directory /new-path2 found");
        t.equal(fs.existsSync(dst_dir+"/new-path2/file.txt"), false, "file /new-path2/file.txt found");

        t.end();
    }, g_timeout);
});


test("test: rm /new-path3/file.txt && rmdir /new-path3", function(t) {
        fs.unlinkSync(src_dir+"/new-path3/file.txt");
        fs.rmdirSync(src_dir+"/new-path3");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-path3"), false, "directory /new-path3 removed");
        t.equal(fs.existsSync(dst_dir+"/new-path3/file.txt"), false, "file /new-path3/file.txt removed");
        t.end();
    }, g_timeout);
});


test("test: paste test", function(t) {
    fs.mkdirSync(src_dir+"/paste-path");
    fs.mkdirSync(src_dir+"/paste-path/path2");
    fs.writeFileSync(src_dir+"/paste-path/file.txt", "test me!", 'utf8');
    fs.writeFileSync(src_dir+"/paste-path/path2/file.txt", "test me twice!", 'utf8');

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/paste-path"), true, "paste: /paste-path");
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2"), false, "paste: /paste-path/path2");
        t.equal(fs.existsSync(dst_dir+"/paste-path/file.txt"), false, "paste: /paste-path/file.txt");
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2/file.txt"), false, "paste: /paste-path/path2/file.txt");
        t.end();
    }, g_timeout);
});
test("test: rename all paste (1/5)", function(t) {
    fs.renameSync(src_dir+"/paste-path/file.txt", src_dir+"/paste-path/renamed.txt");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/paste-path/file.txt"), false, "file /paste-path/file.txt moved");
        t.equal(fs.existsSync(dst_dir+"/paste-path/renamed.txt"), false, "file /paste-path/file.txt found");
        t.end();
    }, g_timeout);
});

test("test: rename all paste (2/5)", function(t) {
    fs.renameSync(src_dir+"/paste-path/path2/file.txt", src_dir+"/paste-path/path2/renamed.txt");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2/file.txt"), false, "file /paste-path/path2/file.txt moved");
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2/renamed.txt"), false, "file /paste-path/path2/renamed.txt found");
        t.end();
    }, g_timeout);
});

test("test: rename all paste (3/5)", function(t) {
    fs.renameSync(src_dir+"/paste-path/path2", src_dir+"/paste-path/path2-renamed");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2"), false, "directory /paste-path/path2 moved");
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2-renamed"), false, "directory /paste-path/path2-renamed found");
        t.end();
    }, g_timeout);
});

test("test: rename all paste (4/5)", function(t) {
    fs.renameSync(src_dir+"/paste-path/path2-renamed/renamed.txt", src_dir+"/paste-path/path2-renamed/file.txt");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2-renamed/renamed.txt"), false, "file /paste-path/path2-renamed/renamed.txt moved");
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2-renamed/file.txt"), false, "file /paste-path/path2-renamed/file.txt found");
        t.end();
    }, g_timeout);
});

test("test: rename all paste (5/5)", function(t) {
    var content = "test me twice - and rename!";
    fs.writeFileSync(src_dir+"/paste-path/path2-renamed/renamed.txt", content, 'utf8');

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2-renamed/renamed.txt"), false, "file /paste-path/path2-renamed/renamed.txt found");
        //t.equal(fs.readFileSync(dst_dir+"/paste-path/path2-renamed/renamed.txt", 'utf8'), content, "content of /paste-path/path2-renamed/renamed.txt is correct");
        t.end();
    }, g_timeout);
});

test("test: cleanup", function(t) {

    fs.unlinkSync(src_dir+"/paste-path/path2-renamed/file.txt");
    fs.unlinkSync(src_dir+"/paste-path/path2-renamed/renamed.txt");
    fs.unlinkSync(src_dir+"/paste-path/renamed.txt");
    fs.rmdirSync(src_dir+"/paste-path/path2-renamed");

    setTimeout(function() {
        fs.rmdirSync(src_dir+"/paste-path");

        t.equal(fs.existsSync(dst_dir+"/paste-path/path2-renamed/renamed.txt"), false, "cleanup: /paste-path/path2-renamed/renamed.txt");
        t.equal(fs.existsSync(dst_dir+"/paste-path/renamed.txt"), false, "cleanup: /paste-path/renamed.txt");
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2-renamed"), false, "cleanup: /paste-path/path2-renamed");
        setTimeout(function() {
            t.equal(fs.existsSync(dst_dir+"/paste-path"), false, "cleanup: /paste-path");

            t.end();
            setTimeout(function() {
                process.exit();
            }, g_timeout);
        }, g_timeout);
    }, g_timeout);
});

