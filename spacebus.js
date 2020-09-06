space_status = '/access-control-system/space-state';
power_front_cum = '/sensor/energy/easymeter/front/energy';
power_front_pwr = '/sensor/energy/easymeter/front/power';
power_back_cum = '/sensor/energy/easymeter/back/energy';
power_back_pwr = '/sensor/energy/easymeter/back/power';
temp_lasercutter = '/test/laserroom/laser/temperature';
pwr_pdu1_branch1_recp6 = '/test/pdu1.lan.mainframe.io/pdu-1/branch-1/receptacle-6/settings/power-state';
host = "mainframe.io";
port = 9001;

var mqtt;
var reconnectTimeout = 2000;

function MQTTconnect() {
	mqtt = new Paho.MQTT.Client( host, port, "web_" + parseInt(Math.random() * 1000, 10));
	var options = {
		timeout: 3,
		useSSL: true,
		cleanSession: true,
		onSuccess: onConnect,
		onFailure: onFail,
	};

	mqtt.onConnectionLost = onConnectionLost;
	mqtt.onMessageArrived = onMessageArrived;

	options.userName = "test";
	options.password = "test";

	console.log("Connecting to MQTT...");
	mqtt.connect(options);
}

function onFail() {
	console.log("Connection failed: " + message.errorMessage + "Retrying");
	setTimeout(MQTTconnect, reconnectTimeout);
}

function onConnect() {
	console.log('Connected to ' + host + ':' + port);

	mqtt.subscribe(space_status, {qos: 0});
	mqtt.subscribe(power_front_cum, {qos: 0});
	mqtt.subscribe(power_front_pwr, {qos: 0});
	mqtt.subscribe(power_back_cum, {qos: 0});
	mqtt.subscribe(power_back_pwr, {qos: 0});
	mqtt.subscribe(temp_lasercutter, {qos: 0});
	mqtt.subscribe(pwr_pdu1_branch1_recp6, {qos: 0});
}

function onConnectionLost(response) {
	console.log("connection lost: " + response.errorMessage + ". Reconnecting");

	setTimeout(MQTTconnect, reconnectTimeout);

};

function control_pdu_receptacle(pdu, branch, receptacle, state) {
	topic = "/test/pdu1.lan.mainframe.io/pdu-"+pdu+"/branch-"+branch+"/receptacle-"+receptacle+"/control"
	if (state)
		mqtt.send(topic, "enable", 0, false)
	else
		mqtt.send(topic, "disable", 0, false)
	var icon = $("#pdu-1_branch-1_receptacle-6 .pdu-port-status");
	icon.css("fill", "rgb(255, 255, 0)");
}

function onMessageArrived(message) {
	var topic = message.destinationName;
	var payload = message.payloadString;

	if (topic == space_status) {
		var spacestatus = $("#mqtt-space-status")[0]
		if (spacestatus) spacestatus.innerHTML = payload
	} else if (topic == power_front_cum) {
		var powermetertext = $("#power-meter-front")[0]
		powermetertext.innerHTML = payload / 1000 + " kWh"
	} else if (topic == power_back_cum) {
		var powermetertext = $("#power-meter-back")[0]
		powermetertext.innerHTML = payload / 1000 + " kWh"
	} else if (topic == power_front_pwr) {
		var frontpwr = $("#power-front-pwr")[0]
		if (frontpwr) frontpwr.innerHTML = payload/1000 + " W"
	} else if (topic == power_back_pwr) {
		var backpwr = $("#power-back-pwr")[0]
		if (backpwr) backpwr.innerHTML = payload/1000 + " W"
	} else if (topic == temp_lasercutter) {
		var templaser = $("#temp-lasercutter")[0]
		if (templaser) templaser.innerHTML = (parseInt(payload)-273200)/1000.0 + " °C"
	} else if (topic == pwr_pdu1_branch1_recp6) {
		var icon = $("#pdu-1_branch-1_receptacle-6 .pdu-port-status")
		if (payload == "on") {
			icon.css("fill", "rgb(0, 255, 0)");
		} else {
			icon.css("fill", "rgb(255, 0, 0)");
		}
	} else {
		console.log(topic + " = " + payload);
	}
};
