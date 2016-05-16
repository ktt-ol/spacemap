power1 = '/test/stromVorne/cum';
power2 = '/test/stromHinten/cum';
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

	mqtt.subscribe(power1, {qos: 0});
	mqtt.subscribe(power2, {qos: 0});
}

function onConnectionLost(response) {
	console.log("connection lost: " + response.errorMessage + ". Reconnecting");

	setTimeout(MQTTconnect, reconnectTimeout);

};

function onMessageArrived(message) {
	var topic = message.destinationName;
	var payload = message.payloadString;

	if (topic == power1) {
		var powermetertext = $("#power-meter-front")[0]
		powermetertext.innerHTML = payload + " kWh"
	} else if (topic == power2) {
		var powermetertext = $("#power-meter-back")[0]
		powermetertext.innerHTML = payload + " kWh"
	} else {
		console.log(topic + " = " + payload);
	}
};
