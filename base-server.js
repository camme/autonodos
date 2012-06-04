// test server for plugwise
var config = {
    server: {
        port: 9999,
        url: "http://localhost"
    },
    url: "http://localhost.com:9999"
}

// the event framework
var nunt = require('nunt');
var express = require('express');
var app = global.app = express.createServer();

// configure it
app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(
        require('stylus').middleware({
            force: false,
            compress: true,
            src: __dirname + "/public",
            dest: __dirname + "/public"
        })
    );
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});

// init nunt, we do this before nayhthing else so that the twitter modules is loaded
nunt.init({
    server: app,
    fakeSocket: true,
    load: [__dirname + "/logic"]
});

// start the server
app.listen(config.server.port);

exports.app = app;

