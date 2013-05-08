# dmirror [![Build Status](https://secure.travis-ci.org/llafuente/dmirror.png?branch=master)](http://travis-ci.org/llafuente/dmirror)
=======

A real-time folder synchronization on Windows/Linux/Mac (any platform that NodeJS support) support multiple target protocols: FileSystem and FTP.
The real-time synchronization (Raid class) mirror all changes in the other side but do not synchronize both at first to make sure the are both the same. For this first synchronization use: Sync class.

Status: No error found, so stable :)


Common for the following examples.
If you want to know more... take a look to the test I try to cover 100% the code.

```js

    var Raid = require("./index.js").Raid,
        Sync = require("./index.js").Sync,
        winston = require("winston");

    winston.add(winston.transports.File, { filename: "log" });
    winston.remove(winston.transports.Console);

```

Real-time folder synchronization
=======

FTP

```js

    var r = new Raid({
        source: "<source folder>",
        protocol: "ftp", // or fs
        target: {
            host: "<host>",
            user: "<user>",
            pass: "<pwd>",
            dir: "<target folder>",
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
        source: "<source folder>",
        protocol: "fs",
        target: {
            dir: "<target folder>"
        },
        exclude: [new RegExp("\.svn")],
        polling: 1000, // 500 by default
        loggin: winston,
        //optional
        recursive: true, // true by default
    });

```

Folder synchronization
=======

FTP is not supported atm.

Filesystem

```js
    var sync = new Sync({
        source: "<source folder>",
        loggin: winston,
        protocol: "fs",
        target: {
            dir: "<target folder>",
        }
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
