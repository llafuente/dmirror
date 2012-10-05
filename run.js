var Raid = require('./raid.js');
var fs = require('fs');

var r = new Raid({
    source: "c:/proyecto/egt-svnrepo/trunk/centaurus",
    protocol: "fs",
    target: {
        dir: "r:/proyecto/proyecto_dordax/trunk/centaurus",
    },
    exclude: [new RegExp("/^\./")],
    polling: 1000,

});