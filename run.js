var Raid = require('./raid.js');
var fs = require('fs');

var r = new Raid({
    source: "c:/noboxout/tyr/trunk/",
    protocol: "fs",
    target: {
        dir: "x:/bls/tyr/home2/",
    },
    exclude: [new RegExp("/^\./")],
    polling: 1000,
});