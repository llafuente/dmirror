var Raid = require("../index.js").Raid,
    fs = require("fs"),
    path = require("path"),
    winston = require("winston"),
    src_dir = path.join(path.dirname(process.mainModule.filename), "src"),
    dst_dir = path.join(path.dirname(process.mainModule.filename), "dst"),
    tap = require("tap"),
    test = tap.test,
    g_timeout = 1000;

winston.add(winston.transports.File, { filename: "log" });
winston.remove(winston.transports.Console);

try {
    fs.mkdirSync(src_dir, function() {});
    fs.mkdirSync(dst_dir, function() {});
} catch(e) {}

var r = null;
r = new Raid({
    source: src_dir,
    protocol: "fs",
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
        t.equal(fs.existsSync(dst_dir+"/file.txt"), true, "file found");
        t.equal(fs.readFileSync(dst_dir+"/file.txt", 'utf8'), content, "content is correct");
        t.end();
    }, g_timeout);
});

test("test: mv file.txt new-file.txt", function(t) {
    fs.renameSync(src_dir+"/file.txt", src_dir+"/new-file.txt");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-file.txt"), true, "file found");
        t.end();
    }, g_timeout);
});
test("test: rm new-file.txt", function(t) {
    fs.unlinkSync(src_dir+"/new-file.txt");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-file.txt"), false, "file found");
        t.end();
    }, g_timeout);
});


test("test: mkdir /path", function(t) {
    fs.mkdirSync(src_dir+"/path");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/path"), true, "file found");
        t.end();
    }, g_timeout);
});

test("test: mv /path /new-path", function(t) {
    fs.renameSync(src_dir+"/path", src_dir+"/new-path");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-path"), true, "file found");
        t.end();
    }, g_timeout);
});

test("test: rmdir /new-path", function(t) {
    fs.rmdirSync(src_dir+"/new-path");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-path"), false, "file found");
        t.end();
    }, g_timeout);
});


test("test: mkdir /new-path2 && put /new-path2/file.txt", function(t) {
    fs.mkdirSync(src_dir+"/new-path2");
    var content = "test me!";
    fs.writeFileSync(src_dir+"/new-path2/file.txt", content, 'utf8');

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-path2"), true, "file found");
        t.equal(fs.existsSync(dst_dir+"/new-path2/file.txt"), true, "file found");
        t.end();
    }, g_timeout);
});

test("test: mv /new-path2 /new-path3", function(t) {
    fs.renameSync(src_dir+"/new-path2", src_dir+"/new-path3");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-path3"), true, "file found");
        t.equal(fs.existsSync(dst_dir+"/new-path3/file.txt"), true, "file found");
        t.end();
    }, g_timeout);
});


test("test: rm /new-path3/file.txt && rmdir /new-path3", function(t) {
        fs.unlinkSync(src_dir+"/new-path3/file.txt");
        fs.rmdirSync(src_dir+"/new-path3");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/new-path3"), false, "file found");
        t.equal(fs.existsSync(dst_dir+"/new-path3/file.txt"), false, "file found");
        t.end();
    }, g_timeout);
});


test("test: paste test", function(t) {
    fs.mkdirSync(src_dir+"/paste-path");
    fs.mkdirSync(src_dir+"/paste-path/path2");
    fs.writeFileSync(src_dir+"/paste-path/file.txt", "test me!", 'utf8');
    fs.writeFileSync(src_dir+"/paste-path/path2/file.txt", "test me twice!", 'utf8');

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/paste-path"), true, "file found");
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2"), true, "file found");
        t.equal(fs.existsSync(dst_dir+"/paste-path/file.txt"), true, "file found");
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2/file.txt"), true, "file found");
        t.end();
    }, g_timeout);
});
test("test: raname all paste (1/5)", function(t) {
    fs.renameSync(src_dir+"/paste-path/file.txt", src_dir+"/paste-path/renamed.txt");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/paste-path/file.txt"), false, "file found");
        t.equal(fs.existsSync(dst_dir+"/paste-path/renamed.txt"), true, "file found");
        t.end();
    }, g_timeout);
});

test("test: raname all paste (2/5)", function(t) {
    fs.renameSync(src_dir+"/paste-path/path2/file.txt", src_dir+"/paste-path/path2/renamed.txt");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2/file.txt"), false, "file found");
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2/renamed.txt"), true, "file found");
        t.end();
    }, g_timeout);
});

test("test: raname all paste (3/5)", function(t) {
    fs.renameSync(src_dir+"/paste-path/path2", src_dir+"/paste-path/path2-renamed");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2"), false, "file found");
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2-renamed"), true, "file found");
        t.end();
    }, g_timeout);
});

test("test: raname all paste (4/5)", function(t) {
    fs.renameSync(src_dir+"/paste-path/path2-renamed/renamed.txt", src_dir+"/paste-path/path2-renamed/file.txt");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2-renamed/renamed.txt"), false, "file found");
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2-renamed/file.txt"), true, "file found");
        t.end();
    }, g_timeout);
});

test("test: raname all paste (5/5)", function(t) {
    var content = "test me twice - and rename!";
    fs.writeFileSync(src_dir+"/paste-path/path2-renamed/renamed.txt", content, 'utf8');

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2-renamed/renamed.txt"), true, "file found");
        t.equal(fs.readFileSync(dst_dir+"/paste-path/path2-renamed/renamed.txt", 'utf8'), content, "content is correct");
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

        t.equal(fs.existsSync(dst_dir+"/paste-path/path2-renamed/renamed.txt"), false, "file found");
        t.equal(fs.existsSync(dst_dir+"/paste-path/renamed.txt"), false, "file found");
        t.equal(fs.existsSync(dst_dir+"/paste-path/path2-renamed"), false, "file found");
        setTimeout(function() {
            t.equal(fs.existsSync(dst_dir+"/paste-path"), false, "file found");

            t.end();
            setTimeout(function() {
                process.exit();
            }, g_timeout);
        }, g_timeout);
    }, g_timeout);
});

