var Raid = require("../index.js").Raid,
	Sync = require("../index.js").Sync,
    fs = require("fs"),
    path = require("path"),
    winston = require("winston"),
    src_dir = path.join(path.dirname(process.mainModule.filename), "src"),
    dst_dir = path.join(path.dirname(process.mainModule.filename), "dst"),
    dst2_dir = path.join(path.dirname(process.mainModule.filename), "dst2"),
    tap = require("tap"),
    test = tap.test,
    g_timeout = 1000,
	rimraf = require("rimraf");
	
	


winston.add(winston.transports.File, { filename: "log" });
//winston.remove(winston.transports.Console);

//clear
try { rimraf.sync(src_dir); } catch(e) {}
try { rimraf.sync(dst_dir); } catch(e) {}
try { rimraf.sync(dst2_dir); } catch(e) {}
try { fs.mkdirSync(src_dir, function() {}); } catch(e) {}
try { fs.mkdirSync(dst_dir, function() {}); } catch(e) {}
try { fs.mkdirSync(dst2_dir, function() {}); } catch(e) {}

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

var sync = new Sync({
    src: src_dir,
    protocol: "fs",
    target: {
        dir: dst2_dir,
    }
});


test("mirror test: put ñfile.txt", function(t) {
    var content = "test ñ me!";
    fs.writeFileSync(src_dir+"/ñfile.txt", content, 'utf8');

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/ñfile.txt"), true, "file /ñfile.txt created");
        t.equal(fs.readFileSync(dst_dir+"/ñfile.txt", 'utf8'), content, "content of /ñfile.txt is correct");
        t.end();
    }, g_timeout);
});
test("sync test: put ñfile.txt", function(t) {
	var content = "test ñ me!";
	sync.sync();
	
    setTimeout(function() {
        t.equal(fs.existsSync(dst2_dir+"/ñfile.txt"), true, "file /ñfile.txt created");
        t.equal(fs.readFileSync(dst2_dir+"/ñfile.txt", 'utf8'), content, "content of /ñfile.txt is correct");
        t.end();
    }, g_timeout);
});

test("mirror test: put áfile.txt", function(t) {
    var content = "test ñ me!";
    fs.writeFileSync(src_dir+"/áfile.txt", content, 'utf8');

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/áfile.txt"), true, "file /áfile.txt created");
        t.equal(fs.readFileSync(dst_dir+"/áfile.txt", 'utf8'), content, "content of /áfile.txt is correct");
        t.end();
    }, g_timeout);
});

test("sync test: put áfile.txt", function(t) {
	var content = "test ñ me!";
    sync.sync();

    setTimeout(function() {
        t.equal(fs.existsSync(dst2_dir+"/áfile.txt"), true, "file /áfile.txt created");
        t.equal(fs.readFileSync(dst2_dir+"/áfile.txt", 'utf8'), content, "content of /áfile.txt is correct");
        t.end();
    }, g_timeout);
});


test("mirror test: mkdir /úpath", function(t) {
    fs.mkdirSync(src_dir+"/úpath");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/úpath"), true, "directory /úpath created");
        t.end();
    }, g_timeout);
});

test("mirror test: mkdir /úpath", function(t) {
    sync.sync();

    setTimeout(function() {
        t.equal(fs.existsSync(dst2_dir+"/úpath"), true, "directory /úpath created");
        t.end();
    }, g_timeout);
});



test("mirror test: mkdir /ú€ath", function(t) {
    fs.mkdirSync(src_dir+"/ú€ath");

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/ú€ath"), true, "directory /ú€ath created");
        t.end();
    }, g_timeout);
});

test("mirror test: mkdir /ú€ath", function(t) {
    sync.sync();

    setTimeout(function() {
        t.equal(fs.existsSync(dst2_dir+"/ú€ath"), true, "directory /ú€ath created");
        t.end();

		setTimeout(function() {
			process.exit();
		}, g_timeout);
    }, g_timeout);
});
