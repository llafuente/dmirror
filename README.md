dmirror
=======

Nodejs file mirror with multiple filesystem: ftp, fs (atm)


Still in development


Config
=======

```js

    r = new Raid({
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



TODO LIST
=======

* exclude
* multi paste

