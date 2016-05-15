topic = '/test/stromVorne/cum';		// topic to subscribe to
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

	mqtt.subscribe(topic, {qos: 0});
}

function onConnectionLost(response) {
	console.log("connection lost: " + response.errorMessage + ". Reconnecting");

	setTimeout(MQTTconnect, reconnectTimeout);

};

function onMessageArrived(message) {
	var topic = message.destinationName;
	var payload = message.payloadString;

	if (topic == "/test/stromVorne/cum") {
		var powermetertext = $("#power-meter-front")[0]
		powermetertext.innerHTML = payload + " kWh"
	} else {
		console.log(topic + " = " + payload);
	}
};
