var nunt = require('nunt');
var applianceList = require(__dirname + "/../../appliances.js");

nunt.models.appliances = function() {

    nunt.on('get.appliances.list', getAppliancesList);

    function getAppliancesList(e) {

        var publicList = [];
        for(var i = 0, ii = applianceList.list.length; i < ii; i++) {
            publicList.push({
                guid: applianceList.list[i].guid,
                name: applianceList.list[i].name
            });
        }

        nunt.send("appliances.list", {sessionId: e.sessionId, cache: false, list: publicList});

    }

}
