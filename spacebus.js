space_status = '/access-control-system/space-state';
power_front_cum = '/test/stromVorne/cum';
power_front_pwr = '/test/stromVorne/power';
power_back_cum = '/test/stromHinten/cum';
power_back_pwr = '/test/stromHinten/power';
temp_lasercutter = '/test/laserroom/laser/temperature';
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

	//options.userName = "test";
	//options.password = "test";

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
}

function onConnectionLost(response) {
	console.log("connection lost: " + response.errorMessage + ". Reconnecting");

	setTimeout(MQTTconnect, reconnectTimeout);

};

function onMessageArrived(message) {
	var topic = message.destinationName;
	var payload = message.payloadString;

	if (topic == space_status) {
		var spacestatus = $("#mqtt-space-status")[0]
		if (spacestatus) spacestatus.innerHTML = payload
	} else if (topic == power_front_cum) {
		var powermetertext = $("#power-meter-front")[0]
		powermetertext.innerHTML = payload + " kWh"
	} else if (topic == power_back_cum) {
		var powermetertext = $("#power-meter-back")[0]
		powermetertext.innerHTML = payload + " kWh"
	} else if (topic == power_front_pwr) {
		var frontpwr = $("#power-front-pwr")[0]
		if (frontpwr) frontpwr.innerHTML = payload + " kW"
	} else if (topic == power_back_pwr) {
		var backpwr = $("#power-back-pwr")[0]
		if (backpwr) backpwr.innerHTML = payload + " kW"
	} else if (topic == temp_lasercutter) {
		var templaser = $("#temp-lasercutter")[0]
		if (templaser) templaser.innerHTML = (parseInt(payload)-273200)/1000.0 + " °C"
	} else {
		console.log(topic + " = " + payload);
	}
};
