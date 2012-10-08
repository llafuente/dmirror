var Raid = require("./../raid.js"),
    fs = require("fs");

var r = null;
r = new Raid({
    source: "c:/noboxout/dmirror/test",
    protocol: "fs",
    target: {
        dir: "c:/noboxout/dmirror/test2",
    },
    exclude: [new RegExp("/^\./")],
    polling: 1000,

});


var dir = "c:/noboxout/dmirror/test";
var test = [
    /*
    //rename file test
    function() {
        console.log("test: put file.txt");
        fs.writeFileSync(dir+"/file.txt", "test me!", 'utf-8');
    },
    function() {
        console.log("test: mv file.txt new-file.txt");
        fs.renameSync(dir+"/file.txt", dir+"/new-file.txt");
    },
    function() {
        console.log("test: rm new-file.txt");
        fs.unlinkSync(dir+"/new-file.txt");
    },

    //rename directory test (empty)
    function() {
        console.log("test: mkdir /path");
        fs.mkdirSync(dir+"/path");
    },
    function() {
        console.log("test: mv /path /new-path");
        fs.renameSync(dir+"/path", dir+"/new-path");
    },
    function() {
        console.log("test: rmdir /new-path");
        fs.rmdirSync(dir+"/new-path");
    },

    //rename directory test (not empty)
    function() {
        console.log("test: mkdir /path");
        fs.mkdirSync(dir+"/path");
    },
    function() {
        console.log("test: mv /path /new-path2");
        fs.renameSync(dir+"/path", dir+"/new-path2");
    },
    function() {
        console.log("test: put /new-path2/file.txt");
        fs.writeFileSync(dir+"/new-path2/file.txt", "test me!", 'utf-8');
    },
    function() {
        console.log("test: rmdir /new-path2");
        fs.unlinkSync(dir+"/new-path2/file.txt");
        fs.rmdirSync(dir+"/new-path2");
    },
    */
    function() {
        console.log("test: paste!");
        fs.mkdirSync(dir+"/paste-path");
        fs.mkdirSync(dir+"/paste-path/path2");
        fs.writeFileSync(dir+"/paste-path/file.txt", "test me!", 'utf-8');
        fs.writeFileSync(dir+"/paste-path/path2/file.txt", "test me twice!", 'utf-8');
    },
    function() {
        console.log("test: raname all paste (1/5)");
        fs.renameSync(dir+"/paste-path/file.txt", dir+"/paste-path/renamed.txt");
    },
    function() {
        console.log("test: raname all paste (2/5)");
        fs.renameSync(dir+"/paste-path/path2/file.txt", dir+"/paste-path/path2/renamed.txt");
    },
    function() {
        console.log("test: raname all paste (3/5)");
        fs.renameSync(dir+"/paste-path/path2", dir+"/paste-path/path2-renamed");
    },
    function() {
        console.log("test: raname all paste (4/5)");
        fs.renameSync(dir+"/paste-path/path2-renamed/file.txt", dir+"/paste-path/path2-renamed/renamed.txt");
    },
    function() {
        console.log("test: raname all paste (5/5)");
        fs.writeFileSync(dir+"/paste-path/path2-renamed/renamed.txt", "test me twice - and rename!", 'utf-8');
    },/*
    function() {
        console.log("test: clean up");
        fs.unlinkSync(dir+"/paste-path/path2-renamed/renamed.txt");
        fs.unlinkSync(dir+"/paste-path/renamed.txt");
        fs.rmdirSync(dir+"/paste-path/path2-renamed");
        fs.rmdirSync(dir+"/paste-path");
    },
/*

    function() {
        fs.writeFileSync(dir+"/hell.txt", "test me!", 'utf-8');
    },
    function() {
        fs.writeFileSync(dir+"/hell.txt", "test me2!", 'utf-8');
    },
    function() {
        fs.renameSync(dir+"/hell.txt", dir+"/new-hell.txt");
    },
    function() {
        fs.mkdirSync(dir+"/the-new-path");
    },
    function() {
        fs.renameSync(dir+"/the-new-path", dir+"/the-new-path-to-liberty");
    },
    function() {
        fs.rmdirSync(dir+"/the-new-path-to-liberty");
    },
    function() {
        fs.unlinkSync(dir+"/new-hell.txt");
    },
    function() {
        fs.mkdirSync(dir+"/the-new-path");
        fs.writeFileSync(dir+"/the-new-path/hell.txt", "test me!", 'utf-8');
    },
    function() {
        try {
            fs.rmdirSync(dir+"/the-new-path");
        } catch(e) {}
    },
*/
];

setTimeout(function() {

    var test_running = 0;
    var runtest = function() {
        if(test[test_running]) {

            //check who am i whatching

            console.log("----------- wachting----------");
            var i = r.__watchs.length;
            while(i--) {
                console.log(r.__watchs[i].file_stat.full_file_name);
            }
            console.log("-----------------------------");


            try {
                test[test_running]();
            } catch(e) {
                console.log(e);
            }
            ++test_running;
        }
    };

    runtest.periodical(2000);

}, 1000);