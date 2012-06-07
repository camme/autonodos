var nunt = require('nunt');
var plugwiseApi = require('plugwisejs');
var applianceList = require(__dirname + "/../../appliances.js");
var plugwise;
var appliancesByGuid = {};
var appliancesByMac = {};

nunt.models.appliances = function() {

    nunt.on('get.appliances.list', getAppliancesList);
    nunt.on('appliance.switch', switchAppliance);
    nunt.on('get.appliances.status', checkApplianceStatus);
    nunt.on(nunt.READY, init);

    function init() {
        plugwise = plugwiseApi.init({ 
            log: true, 
            serialport: "/dev/ttyUSB0" 
        });
        for(var i = 0, ii = applianceList.list.length; i < ii; i++) {
            var applianceData = applianceList.list[i];
            appliancesByGuid[applianceData.guid] = applianceData;
            appliancesByMac[applianceData.mac] = applianceData;
            applianceData.index = i;
        };
        setTimeout(checkAppliancesStatuses, 1000);
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
            });
        }
        else {
            appliance.poweroff(function() {
                var applianceData = appliancesByMac[this.mac];
                //console.log("POWER SWITCH FOR " + applianceData.name);
                checkApplianceStatus(applianceData);
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
            if (!sessionId) {
                clearTimeout(appliancesByGuid[applianceData.guid].timeoutRef);
                appliancesByGuid[applianceData.guid].timeoutRef = setTimeout(function() {
                    checkApplianceStatus(applianceData)
                }, 10000 + applianceData.index * 1000);
            }
        });
    }

}
