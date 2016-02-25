all:
	@echo "Targets: test upload"

test:
	chromium --allow-file-access-from-files index.html < /dev/null > /dev/null 2>&1 &

upload:
	scp bootstrap.css bootstrap.js bootstrap-theme.css getTransformToElement.js index.html jquery.js pathseg.js svg-pan-zoom.js map.css map.js map.svg "ktt-web:/var/www/map/"

.PHONEY: all test upload
