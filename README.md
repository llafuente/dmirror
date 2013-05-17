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

There are some problems involved that you may encounter if you run sync/raid against samba using the "windows task scheduler".
You may see that you don't have access to the share resource (wtf!). So you need to create that resource each time (workaround!)

Solve it with this code, fill the "<blanks>".

```js
    var spawn = require('child_process').spawn,
        //delete current connection to the resource
        connect_delete  = spawn('net', ['use', '\\\\<server>\\<folder>', '/DELETE']);

    connect_delete.on('close', function (code) {
        winston.log("error", 'net use delete exit with: ' + code);
        //when fisnish, reconnect the resource, you may need user/pwd
        connect  = spawn('net', ['use', 'x:','\\\\<server>\\<folder>', '/USER:<domain>\\<user>', '<password>'])
        connect.stderr.setEncoding('utf8');
        connect.stdout.setEncoding('utf8');

        connect.stdout.on('data', function (data) {
            winston.log("info", data);
        });

        connect.stderr.on('data', function (data) {
            winston.log("error", data);
        });

        connect.on('close', function (code) {
          winston.log("error", 'net use exit with: ' + code);
          setTimeout(function() {
            sync.sync(); // access the resource!
          }, 10000); // give a few seconds to windows...
        });
    });
```



TODO LIST
=======

* Windows taskbar support, I will develop the module if I have time... sometime...

* fill an issue if you need anything more, for me is what i was looking for a replacement/alternative to mirrorfolder.
