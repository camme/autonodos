var nunt = require('nunt');
var plugwiseApi = require('plugwisejs');
var applianceList = require(__dirname + "/../../appliances.js");
var plugwise;
var appliancesByGuid = {};
var appliancesByMac = {};
var powerCheckTimers = {};
var powerCheckTimeInterval = 10 * 1000; // secs until next power check
var redis = require("redis");
var redisClient = redis.createClient();


nunt.models.appliances = function() {

    nunt.on('get.appliances.list', getAppliancesList);
    nunt.on('appliance.switch', switchAppliance);
    nunt.on('get.appliances.status', checkApplianceStatus);
    nunt.on(nunt.READY, init);

    function init() {
        plugwise = plugwiseApi.init({ 
            log: 0,
            serialport: "/dev/ttyUSB0" 
        });
        for(var i = 0, ii = applianceList.list.length; i < ii; i++) {
            var applianceData = applianceList.list[i];
            appliancesByGuid[applianceData.guid] = applianceData;
            appliancesByMac[applianceData.mac] = applianceData;
            applianceData.index = i;
        };
        setTimeout(checkAppliancesStatuses, 1000);
        setInterval(getAllAppliancesPowerData, 2000);
    }

    function switchAppliance(e) {
        var applianceData = appliancesByGuid[e.guid];
        //console.log("try to switch " + applianceData.name + " [" + applianceData.mac + "] to " + e.power);
        var appliance = plugwise(applianceData.mac);
        if (e.power) {
            appliance.poweron(function() {
                var applianceData = appliancesByMac[this.mac];
                //console.log("POWER SWITCH FOR " + applianceData.name);
                checkApplianceStatus(applianceData);
                checkAppliancePower(applianceData, null, true);
            });
        }
        else {
            appliance.poweroff(function() {
                var applianceData = appliancesByMac[this.mac];
                //console.log("POWER SWITCH FOR " + applianceData.name);
                checkApplianceStatus(applianceData);
                checkAppliancePower(applianceData, null, true);
            });
        }
    }

    function getAppliancesList(e) {
        var publicList = [];
        for(var i = 0, ii = applianceList.list.length; i < ii; i++) {
            publicList.push({
                guid: applianceList.list[i].guid,
                name: applianceList.list[i].name
            });
        }
        nunt.send("appliances.list", {sessionId: e.sessionId, cache: false, list: publicList});
        checkAppliancesStatuses(e);
        getAllAppliancesPowerData(e.sessionId);
    }

    function checkAppliancesStatuses(e) {
        for(var i = 0, ii = applianceList.list.length; i < ii; i++) {
            var applianceData = applianceList.list[i];
            (function(applianceData, sessionId) {
                checkApplianceStatus(applianceData, sessionId);
            })(applianceData, e ? e.sessionId : null);
        }
    }

    function checkApplianceStatus(applianceData, sessionId) {
        var appliance = plugwise(applianceData.mac);
        //console.log("CHECK STATUS OF " + applianceData.name);
        appliance.info(function(result) {
            applianceData = appliancesByMac[this.mac];

            // if we didnt get an error
            if (result) {
                var info = {
                    relay: result.relay,
                    guid: applianceData.guid, 
                    sessionId: sessionId,
                    name: applianceData.name,
                    cache: false
                };
                //console.log("GOT STATUS:", appliancesByMac[this.mac].name + ": ", this.mac, info.relay);
                //console.log("---");
                nunt.send("appliance.info", info);
            }

            checkAppliancePower(applianceData);

            // if we have a session, lets check some historical power readings
            if (sessionId) {
                getLatestPowerReading(applianceData, sessionId);
            }

            if (!sessionId) {
                clearTimeout(appliancesByGuid[applianceData.guid].timeoutRef);
                appliancesByGuid[applianceData.guid].timeoutRef = setTimeout(function() {
                    checkApplianceStatus(applianceData);
                }, 10000 + applianceData.index * 1000);
            }
        });
    }

    function getLatestPowerReading(applianceData, sessionId, from, to){
        from = from || -1;
        to = to || -1;
        redisClient.zrange(applianceData.mac, from, to, 'WITHSCORES', function(err, result) {
            if (!err) {
                var eventData = {
                    from: 'redis',
                    powerUsage: result,
                    guid: applianceData.guid, 
                    sessionId: sessionId,
                    name: applianceData.name,
                    cache: false
                };
                nunt.send("appliance.powerinfo", eventData);
            }
            else {
                console.log("ERROR in redis request");
            }
        });
    }

    function getAllAppliancesPowerData(sessionId) {
        for(var i = 0, ii = applianceList.list.length; i < ii; i++) {
            var appliance = applianceList.list[i];
            (function(appliance) {
                getLatestPowerReading(appliance, sessionId, -81, -1);
            })(appliance);
        }
    }

    function checkAppliancePower(applianceData, sessionId, force) {
        var timer = powerCheckTimers[applianceData.mac];

        if (!timer || force || new Date().getTime() - timer.getTime() > powerCheckTimeInterval) {

            var appliance = plugwise(applianceData.mac);
            //console.log("CHECK STATUS OF " + applianceData.name);
            appliance.powerinfo(function(result) {
                var timer = powerCheckTimers[applianceData.mac] = new Date();
                applianceData = appliancesByMac[this.mac];
                if (result.error !== true) {
                    // save to redis
                    if (result.watt < 15000) {
                        redisClient.zadd(this.mac, timer.getTime(), result.watt);
                    }
                }
            });

        }
    }


}
