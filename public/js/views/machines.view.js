(function(){

    nunt.views.machines = function() {

        // hold the current power setting
        var power = false;

        // listen to the update event
        nunt.on("appliance.update", updatePower);
        nunt.on("appliance.info", updatePower);
        nunt.on("appliances.list", renderApplianceList);

        // when we are connected to the server, we call the ask function
        nunt.on(nunt.CONNECTED, getListOfMachines);

        function getListOfMachines(e) {
            nunt.send("get.appliances.list", {});
        }

        function renderApplianceList(e) {

            var container = $(".machines").empty();
            var itemTemplate = $(".templates .appliance").outerHtml();

            for(var i = 0, ii = e.list.length; i < ii; i++) {
                var appliance = e.list[i];
                var item = $(itemTemplate);
                item.find(".name").html(appliance.name);
                item.attr("id", appliance.guid);
                container.append(item);
                item.click(function() {
                    var guid = $(this).attr("id");
                    var relayStatus = $(this).attr("data-relay") == "true";
                    nunt.send("appliance.switch", {power: !relayStatus, guid: guid});
                });
             }
            console.log(e.list);

        }

        // callback for when we get the current power setting
        function updatePower(e) {
            var power = e.relay;
            console.log("update " + e.guid + " set to " + power);
            var appliance = $("#" + e.guid);

            appliance.find(".value").html(power ? "on" : "off");
            appliance.attr("data-relay", power);

            appliance.removeClass("on").removeClass("off");

            if (power) {
                appliance.addClass("on");
            }
            else {
                appliance.addClass("off");
            }


        }

        // send an event to ask for the current value
        function askForValue() {
            nunt.send("appliance.request");
        }

        // just make sure that we can click
        $(function() {
       });

    }

})();
