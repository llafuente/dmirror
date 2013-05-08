var Sync = require("../index.js").Sync,
    fs = require("fs"),
    path = require("path"),
    winston = require("winston"),
    src_dir = path.join(path.dirname(process.mainModule.filename), "src"),
    dst_dir = path.join(path.dirname(process.mainModule.filename), "dst"),
    tap = require("tap"),
    test = tap.test,
    g_timeout = 2000,
    rimraf = require("rimraf");

winston.add(winston.transports.File, { filename: "log" });
winston.remove(winston.transports.Console);

//clear
try { rimraf.sync(src_dir); } catch(e) {}
try { rimraf.sync(dst_dir); } catch(e) {}
try { fs.mkdirSync(src_dir, function() {}); } catch(e) {}
try { fs.mkdirSync(dst_dir, function() {}); } catch(e) {}
try { fs.unlinkSync(path.join(path.dirname(process.mainModule.filename), "log")); } catch(e) {}

var sync = new Sync({
    source: src_dir,
    loggin: winston,
    protocol: "fs",
    target: {
        dir: dst_dir,
    }
});

test("test: put file.txt", function(t) {
    var content = "test me!";
    fs.writeFileSync(src_dir+"/file.txt", content, 'utf8');

    sync.sync();

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/file.txt"), true, "file /file.txt created");
        t.equal(fs.readFileSync(dst_dir+"/file.txt", 'utf8'), content, "content of /file.txt is correct");
        t.end();
    }, g_timeout);
});

test("test: mv file.txt new-file.txt", function(t) {
    fs.renameSync(src_dir+"/file.txt", src_dir+"/new-file.txt");

    sync.sync();

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/file.txt"), true, "file /file.txt exists");
        t.equal(fs.readFileSync(dst_dir+"/file.txt", 'utf8'), "test me!", "content of /file.txt is correct");
        t.equal(fs.existsSync(dst_dir+"/new-file.txt"), true, "file /new-file.txt created");
        t.equal(fs.readFileSync(dst_dir+"/new-file.txt", 'utf8'), "test me!", "content of /file.txt is correct");
        t.end();
    }, g_timeout);
});

test("test: overwrite file.txt", function(t) {
    var content = "test me twice!";
    fs.writeFileSync(src_dir+"/file.txt", content, 'utf8');

    sync.sync();

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/file.txt"), true, "file /file.txt exists");
        t.equal(fs.readFileSync(dst_dir+"/file.txt", 'utf8'), content, "content of /file.txt is correct");
        t.end();
    }, g_timeout);
});


test("test: mkdir /path && put /path/file.txt", function(t) {
    fs.mkdirSync(src_dir+"/path");
    var content = "test me trice!";
    fs.writeFileSync(src_dir+"/path/file.txt", content, 'utf8');

    sync.sync();

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/path"), true, "directory /path created");
        t.equal(fs.existsSync(dst_dir+"/path/file.txt"), true, "file /file.txt created");
        t.equal(fs.readFileSync(dst_dir+"/path/file.txt", 'utf8'), content, "content of /file.txt is correct");
        t.end();
    }, g_timeout);
});

test("test: mkdir -p /path3/path4/path5 && put many files", function(t) {
    fs.mkdirSync(src_dir+"/path3");
    fs.mkdirSync(src_dir+"/path3/path4");
    fs.mkdirSync(src_dir+"/path3/path4/path5");

    var content = "test me 4th!";
    fs.writeFileSync(src_dir+"/path3/path4/path5/file.txt", content, 'utf8');
    fs.writeFileSync(src_dir+"/path3/path4/file.txt", content, 'utf8');
    fs.writeFileSync(src_dir+"/path3/file.txt", content, 'utf8');

    sync.sync();

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/path3"), true, "directory exists: /path3");
        t.equal(fs.existsSync(dst_dir+"/path3/path4"), true, "directory exists: /path3/path4");
        t.equal(fs.existsSync(dst_dir+"/path3/path4/path5"), true, "directory exists: /path3/path4/path5");

        t.equal(fs.readFileSync(dst_dir+"/path3/file.txt", 'utf8'), content, "content of /path3/file.txt is correct");
        t.equal(fs.readFileSync(dst_dir+"/path3/path4/file.txt", 'utf8'), content, "content of /path3/path4/file.txt is correct");
        t.equal(fs.readFileSync(dst_dir+"/path3/path4/path5/file.txt", 'utf8'), content, "content of /path3/path4/path5/file.txt is correct");

        t.end();
    }, g_timeout);
});

test("test: put many files", function(t) {
    var content = "test me 5th!";
    fs.writeFileSync(src_dir+"/path3/path4/path5/file.txt", content, 'utf8');
    fs.writeFileSync(src_dir+"/path3/path4/file.txt", content, 'utf8');
    fs.writeFileSync(src_dir+"/path3/file.txt", content, 'utf8');
    fs.writeFileSync(src_dir+"/path3/file2.txt", content, 'utf8');

    sync.sync();

    setTimeout(function() {
        t.equal(fs.readFileSync(dst_dir+"/path3/file.txt", 'utf8'), content, "content of /path3/file.txt is correct");
        t.equal(fs.readFileSync(dst_dir+"/path3/file2.txt", 'utf8'), content, "content of /path3/file.txt is correct");
        t.equal(fs.readFileSync(dst_dir+"/path3/path4/file.txt", 'utf8'), content, "content of /path3/path4/file.txt is correct");
        t.equal(fs.readFileSync(dst_dir+"/path3/path4/path5/file.txt", 'utf8'), content, "content of /path3/path4/path5/file.txt is correct");

        t.end();
    }, g_timeout);
});
