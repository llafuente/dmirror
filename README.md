# dmirror [![Build Status](https://secure.travis-ci.org/llafuente/dmirror.png?branch=master)](http://travis-ci.org/llafuente/dmirror)
=======

Nodejs file mirror with multiple filesystem: ftp, fs (atm)


Still in development


Setup
=======

Common

```js

	var Raid = require("./lib/dmirror.js"),
		winston = require("winston");

	winston.add(winston.transports.File, { filename: "log" });
	winston.remove(winston.transports.Console);

```

FTP

```js

    var r = new Raid({
        source: "c:/noboxout/dmirror/test",
        protocol: "ftp", // or fs
        target: {
            host: "ftp.xxxx.es",
            user: "xxx",
            pass: "yyy",
            dir: "/html/",
        },
        exclude: [new RegExp("/^\./")],
    });

```

Filesystem

```js

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

```

FAQ
=======

* Can I mirror to a network drive?

Yes, use filesystem :)


TODO LIST
=======

* fill an issue if you need anything more, for me is what i was looking for a replacement for mirrorfolder.
