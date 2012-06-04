
// this is used for event communication and to create the webserver/socket server
var nunt = require("nunt");
var app = require("./base-server").app;

// the plugwise api
var plugwiseApi = require("plugwise");

// connect
var plugwise = plugwiseApi.init({
    serialport: "/dev/tty.usbserial-A8005W6k"
});

// list of appliances, in external file to hide the mac address
var appliances = require("./appliances");

// get the plugwise reference
var lamp =  plugwise(appliances.lamp);

// create a "rest" api
app.get("/lamp/:power", function(req, res) {
    if (req.params.power == 'on') {
        lamp.poweron(readLamp);
    }
    else {
        lamp.poweroff(readLamp);
    }
    res.send("OK");
});

// read the current relay status and send the result as an event
function readLamp(sessionId) {
    lamp.info(function(result){
        var data = {power: result.relay};

        // if we get a sessionId from the event, we use it to send the result to that client
        if (sessionId) data.sessionId = sessionId;

        nunt.send("appliance.update", data);
    });
}

// if an incoming event for the power comes in, we take care of it here
nunt.on("appliance.request", function(e) {
    readLamp(e.sessionId);
});

// take care of the switch event
nunt.on("appliance.switch", function(e) {
    if (e.power) {
        lamp.poweron(readLamp);
    }
    else {
        lamp.poweroff(readLamp);
    }
});



