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

function filter_24h(list) {
    var i,
        max,
        output = []
        min_date = (new Date()).getTime() - (60 * 60 * 24 * 1000);

    for(i = 0, max = list.length; i < max; ++i) {
        if(list[i].directory) {
            output.push(list[i]);
        } else {
            console.log(list[i].mtime.getTime() , min_date);
            if (list[i].mtime.getTime() > min_date) {
                output.push(list[i]);
            }
        }
    }

    return output;
}

test("test: put file.txt 48hour before ", function(t) {
    var content = "test me!",
        date = new Date();
    date.setTime( date.getTime() - (60 * 60 * 24 * 1000 * 2) );

    fs.writeFileSync(src_dir+"/file.txt", content, 'utf8');
    fs.utimesSync(src_dir+"/file.txt", date, date);

    sync.sync(filter_24h);

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/file.txt"), false, "file /file.txt not created");
        t.end();
    }, g_timeout);
});

test("test: put file.txt now ", function(t) {
    var new_content = "test me twice!";

    fs.writeFileSync(src_dir+"/file.txt", new_content, 'utf8');

    sync.sync(filter_24h);

    setTimeout(function() {
        t.equal(fs.existsSync(dst_dir+"/file.txt"), true, "file /file.txt created");
        t.equal(fs.readFileSync(dst_dir+"/file.txt", 'utf8'), new_content, "content of /file.txt is correct");
        t.end();
    }, g_timeout);
});