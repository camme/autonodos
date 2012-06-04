(function(){

    nunt.views.machines = function() {

        // hold the current power setting
        var power = false;

        // listen to the update event
        nunt.on("appliance.update", updatePower);
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
            }
            console.log(e.list);
        }
           

        // callback for when we get the current power setting
        function updatePower(e) {
            power = e.power;
            $("#lamp .value").html(e.power ? "on" : "off");
        }

        // send an event to ask for the current value
        function askForValue() {
            nunt.send("appliance.request");
        }

        // just make sure that we can click
        $(function() {
            $("#lamp").click(function() {
                nunt.send("appliance.switch", {power: !power});
            });
        });

    }

})();
