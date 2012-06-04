(function(){

    nunt.views.machines = function() {

        // hold the current power setting
        var power = false;

        // listen to the update event
        nunt.on("appliance.update", updatePower);

        // when we are connected to the server, we call the ask function
        nunt.on(nunt.CONNECTED, askForValue);

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
