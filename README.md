# dmirror [![Build Status](https://secure.travis-ci.org/llafuente/dmirror.png?branch=master)](http://travis-ci.org/llafuente/dmirror)
=======

A real-time folder synchronization on Windows/Linux/Mac (any platform that NodeJS support) support multiple target protocols: FileSystem and FTP.

Rather stable


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
		loggin: winston,
		//optional
		recursive: true, // true by default
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
		polling: 1000, // 500 by default
		loggin: winston,
		//optional
		recursive: true, // true by default
	});

```

FAQ
=======

* Can I mirror a samba directory?

Yes, you need to "Connect to a network drive" and the protocol is filesystem :)


TODO LIST
=======

* Windows service support, could be great.

* fill an issue if you need anything more, for me is what i was looking for a replacement/alternative to mirrorfolder.
