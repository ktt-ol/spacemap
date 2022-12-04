all:
	@echo "Targets: test upload"

test:
	chromium --allow-file-access-from-files index.html < /dev/null > /dev/null 2>&1 &

upload:
	scp bootstrap.css bootstrap.css.map bootstrap.js bootstrap-theme.css bootstrap-theme.css.map getTransformToElement.js hammer.js index.html jquery.js mqtt.html mqttws31.js pathseg.js spacebus.js svg-pan-zoom.js map.css map.js map.svg "ktt-web:/var/www/map/"

.PHONEY: all test upload
