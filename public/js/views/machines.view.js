(function(){

    nunt.views.machines = function() {

        // hold the current power setting
        var power = false;
        var graphs = [];

        // listen to the update event
        nunt.on("appliance.update", updatePower);
        nunt.on("appliance.info", updatePower);
        nunt.on("appliance.powerinfo", updatePowerInfo);
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
                item.find(".name").click(function(e) {
                    e.preventDefault();
                    $(this).parents(".appliance").find(".applianceDetails").slideToggle();
                });
                item.find('.value').click(function() {
                    var app = $(this).parents('.appliance');
                    var guid = app.attr("id");
                    var relayStatus = app.attr("data-relay") == "true";
                    nunt.send("appliance.switch", {power: !relayStatus, guid: guid});
                });
                var canvas = Raphael(item.find('.canvas')[0]);
                //j
                graphs[appliance.guid] = {canvas: canvas, first: true};
            }

            //list = e.list;

        }

        // callback for when we get the current power setting
        function updatePower(e) {
            var power = e.relay;
            var appliance = $("#" + e.guid);

            appliance.find(".value").fadeIn().html(power ? "on" : "off");

            appliance.attr("data-relay", power);

            appliance.removeClass("on").removeClass("off");

            if (power) {
                appliance.addClass("on");
            }
            else {
                appliance.addClass("off");
            }
        }

        function updatePowerInfo(e) {
               if ( graphs[e.guid].animating === true) {
                   return;
               }

            var appliance = $("#" + e.guid);
            var power = appliance.attr("data-relay") !== "false";
            if (power) {
                var wattString = e.powerUsage.length > 1 ? e.powerUsage[e.powerUsage.length - 2] : '0';
                var watt = parseFloat(wattString.replace(',', '.'));
                appliance.find(".power").html(Math.round(watt) + " Watt");
            }
            else {
                appliance.find(".power").html("0 Watt");
            }

            var graph = graphs[e.guid].canvas;
            var firstTime = graphs[e.guid].first;
            graph.clear();
            var xAndY = "M 9 9L10 141L335 141";
            var line =  graph.path(xAndY);
            line.attr({stroke: '#333', 'stroke-width': 1});  

            var lines = "M ";
            var zeroLines = "M ";
            for(var i = 0, ii = e.powerUsage.length; i < ii; i++) {
                if (i % 2 == 0) {
                    var watt = parseFloat(e.powerUsage[i].replace(',', '.'));
                    if (watt < 2000) {
                        var wattRounded = Math.round(watt);
                        var percentOfY = watt / 1100;
                        var x = i * 2 + 10;
                        var y = 130 - Math.round(percentOfY * 120) + 10;
                        lines += x + " " + y + "L";
                        zeroLines += x + " 140L";
                    }
                }
            }
            if (firstTime) {

                graphs[e.guid].animating = true;
                var line =  graph.path(zeroLines);
                line.attr({stroke: '#666', 'stroke-width': 3});  
                line.animate({
                    path: lines
                }, 2000, "ease-in-out", function() {
                    graphs[e.guid].first = false;
                    graphs[e.guid].animating = false;
                });
                //line.attr({stroke: '#666', 'stroke-width': 3});  
            }
            else {
                var line =  graph.path(lines);
                line.attr({stroke: '#666', 'stroke-width': 3});  
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
