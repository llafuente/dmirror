var Raid = require("./raid.js"),
    winston = require("winston");

winston.add(winston.transports.File, { filename: "log" });
winston.remove(winston.transports.Console);

var r = new Raid({
    source: "c:/noboxout/tyr/trunk/",
    protocol: "fs",
    target: {
        dir: "x:/bls/tyr/home2/",
    },
    exclude: [new RegExp("\.svn")],
    polling: 1000,
    loggin: winston
});