/* "roomname" => jQuery DOM element */
roomlist = {}

/**
 * Checks if Point is inside of Polygon.
 * Imported from {@link http://jsfromhell.com/math/is-point-in-poly}
 *
 * @param {Polygon} poly polygon
 * @param {SVGPoint} pt point
 * @return {bool} true if point is inside, false otherwise
 * @author Jonas Raoni Soares Silva
 */
function isPointInPolygon(poly, pt) {
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
        && (c = !c);
    return c;
}

/**
 * Generates a Polygon from an SVGPath.
 * This method only works for SVGPaths not containing bezier elements.
 *
 * @param {SVGPath} path the SVGPath object, that should be converted
 * @return {Polygon} Array of SVGPoint
 */
function path2points(path) {
	var points = [];

	for (var i=0; i < path.context.animatedPathSegList.numberOfItems; i++) {
		var ele = path.context.animatedPathSegList[i];
		var p = null

		if (i == 0 && ele.pathSegType == 2) { /* M */
			p = {x: ele.x, y: ele.y}
		} else if (i == 0 && ele.pathSegType == 3) { /* m */
			p = {x: ele.x, y: ele.y}
		} else if (ele.pathSegType == 4) { /* L */
			p = {x: ele.x, y: ele.y}
		} else if (ele.pathSegType == 5) { /* l */
			p = {x: points[i-1].x + ele.x, y: points[i-1].y + ele.y}
		} else if (ele.pathSegType == 1) { /* z */
			/* ignore */
		} else {
			throw "path2points: pathSegType " + ele.pathSegType + " is not supported"
		}

		if(p !== null) {
			var point = $("#mapsvg")[0].createSVGPoint()
			point.x = p.x
			point.y = p.y
			points.push(point)
		}
	}

	return points;
}

/**
 * Converts coordinates for a SVGRect from base coordinate system
 * (coordinates from SVG file) to viewport coordinates (containing
 * zoom and offset).
 * 
 * @param {SVGRect} rect Rectangle with base coordinates
 * @return {SVGRect} Rectangle with viewport coordinates
 */
function base2svg(rect) {
	var mapsvg = $("#mapsvg")[0]
	var base = $("#mapsvg > g[class='svg-pan-zoom_viewport']")[0]

	var basematrix = base.getTransformToElement(mapsvg)

	var bp1 = mapsvg.createSVGPoint()
	bp1.x = rect.x
	bp1.y = rect.y
	var bp2 = mapsvg.createSVGPoint()
	bp2.x = rect.x + rect.width
	bp2.y = rect.y + rect.height

	var p1 = bp1.matrixTransform(basematrix)
	var p2 = bp2.matrixTransform(basematrix)

	var result = mapsvg.createSVGRect()
	result.x = p1.x
	result.y = p1.y
	result.width = Math.abs(p2.x - p1.x)
	result.height = Math.abs(p2.y - p1.y)

	return result
}

/**
 * A wrapper around getIntersectionList(), that does some
 * additional checks to minimise the effects of chrome bug
 * #370012.
 *
 * @param {SVGRect} Rectangle (base coordinate system), which is used to search intersections for
 * @return List with intersected SVG elements
 */
function getIntersectionListfromMap(rect) {
	var svgrect = base2svg(rect)
	var tmp = $("#mapsvg")[0].getIntersectionList(svgrect, null)
	var intersections = Array.prototype.slice.call(tmp);

	var p1 = {x: rect.x, y: rect.y}
	var p2 = {x: rect.x + rect.width, y: rect.y}
	var p3 = {x: rect.x, y: rect.y + rect.height}
	var p4 = {x: rect.x + rect.width, y: rect.y + rect.height}

	/* Workaround for CR #370012 */
	for(var i = 0; i < intersections.length; i++) {
		if (!(intersections[i] instanceof SVGPathElement))
			continue;

		try {
			var poly = path2points($(intersections[i]))

			if (!isPointInPolygon(poly, p1) && !isPointInPolygon(poly, p2) &&
				!isPointInPolygon(poly, p3) && !isPointInPolygon(poly, p4)) {
				intersections.splice(i, 1)
			}
		} catch(err) {
			/* ignore (path2points throws exception, if it gets unsupported pathSegTypes) */
		}
	}

	return intersections;
}

/**
 * Calculates the area in m² for a given SVGPath. The function does not
 * support bezier elements in the path.
 *
 * @param {SVGPath} path Path, which area should be calculated
 * @return {number} area of the path in m²
 */
function pathArea(path) {
	var area = 0;
	var points = path2points(path);

	var j = points.length-1;
	for (var i = 0; i < points.length; i++) {
		area = area + points[i].x * points[j].y - points[i].y * points[j].x
		j = i;
	}

	area = Math.abs(area/2) / (35.43307 * 35.43307);

	return area;
}

/**
 * Calculates the length in m for a given SVGPath. The function does not
 * support bezier elements in the path.
 *
 * @param {SVGPath} path Path, which length should be calculated
 * @return {number} length of the path in m
 */
function pathLength(path) {
	var points = [];
	var len = 0;

	for (var i=0; i < path.context.animatedPathSegList.numberOfItems; i++) {
		var ele = path.context.animatedPathSegList[i];

		if (i == 0 && ele.pathSegType == 3) {
			points.push({x: 0, y: 0})
		} else if (ele.pathSegType == 5) {
			points.push({x: points[i-1].x + ele.x, y: points[i-1].y + ele.y})
			len = len + Math.sqrt(Math.pow(Math.abs(ele.x - points[i-1].x), 2) + Math.pow(Math.abs(ele.y - points[i-1].y), 2));
		} else if (ele.pathSegType == 1) {
			/* ignore */
		} else {
			throw "pathLength: pathSegType " + ele.pathSegType + " is not supported"
		}
	}

	return len / 35.43307; /* in m */
}

/**
 * Returns a touple with the endpoints for a given SVGPath.
 *
 * @param {SVGPath} path Path, which endpoints are required
 * @return List with two SVGPoint elements, the first is the start point, the second is the end point of the SVGPath
 */
function pathEndpoints(path) {
	var points = path2points(path);
	var start = mapsvg.createSVGPoint()
	start.x = points[0].x
	start.y = points[0].y
	var stop = mapsvg.createSVGPoint()
	stop.x = points[points.length-1].x
	stop.y = points[points.length-1].y
	return [start, stop]
}

/**
 * Toggle layer visibility based on its checkbox
 *
 * @param {Checkbox} cb layer's checkbox DOM element
 * @param {string} layer layer's name
 */
function handleLayerCheckbox(cb, layer) {
	$( "[inkscape\\:groupmode='layer'][inkscape\\:label='" + layer + "']" ).each(function( index ) {
		if (cb.checked == true)
			$(this).attr("style", "display:inline")
		else
			$(this).attr("style", "display:none")
	});
}

/**
 * Move SVG, so that the supplied point becomes visible
 *
 * @param {SVGPoint} p point, that should become visible
 */
function panToCoordinate(p) {
	panZoom.pan({x:0,y:0});
	var realZoom= panZoom.getSizes().realZoom;
	panZoom.pan({  
		x: -(p.x * realZoom) + (panZoom.getSizes().width/2),
		y: -(p.y * realZoom) + (panZoom.getSizes().height/2)
	});
}

/**
 * Filter DOM element list, so that only elements are returned, which
 * have specific classes set
 *
 * @param objs list of DOM elements
 * @param classes list of classes
 * @return filtered objs list
 */
function filterObj(objs, classes) {
	result = new Set()

	for (var i = 0; i < objs.length; i++) {
		obj = objs[i];
		while (obj != null) {
			for (var j = 0; j < classes.length; j++) {
				if (obj.classList.contains(classes[j])) {
					result.add(obj)
					break;
				}
			}
			obj = obj.parentElement
		}
	}

	result = [...result]
	return result
}

/**
 * Return a bounding box for obj, that is transformed to the
 * base coordinate system.
 *
 * @param obj Any SVG element
 * @return {SVGRect} Rectangle in base coordinate system
 */
function getTransformedBoundingBox(obj) {
	var mapsvg = $("#mapsvg")[0]
	var base = $("#mapsvg > g[class='svg-pan-zoom_viewport']")[0]
	var rect = obj.getBBox()

	var p1 = mapsvg.createSVGPoint()
	var p2 = mapsvg.createSVGPoint()
	p1.x = rect.x
	p1.y = rect.y
	p2.x = rect.x + rect.width
	p2.y = rect.y + rect.height

	var matrix = obj.getTransformToElement(base)
	var p1n = p1.matrixTransform(matrix)
	var p2n = p2.matrixTransform(matrix)

	var result = mapsvg.createSVGRect()
	result.x = p1n.x
	result.y = p1n.y
	result.width = p2n.x - p1n.x
	result.height = p2n.y - p1n.y

	return result
}

/**
 * Returns a list of DOM objects with intersected rooms for a
 * given SVG element.
 *
 * @param obj The SVG element, that a room is searched for
 * @return a list containing a DOM element for each found room
 */
function getRoomForObject(obj) {
	var mapsvg = $("#mapsvg")[0]
	var bbox = getTransformedBoundingBox(obj)

	var intersections = getIntersectionListfromMap(bbox)
	var filtered = filterObj(intersections, ["room"])

	return filtered
}

/**
 * Returns room DOM object or throws an error if none or
 * multiple ones are found.
 *
 * @param obj The SVG element, that a room is searched for
 * @return DOM element
 * @throws error if more than one or no result is found
 */
function getSingleRoomForObject(obj) {
	var rooms = getRoomForObject(obj)

	if(rooms.length == 0)
		throw "getSingleRoomForObject: no room has been found"
	else if(rooms.length > 1)
		throw "getSingleRoomForObject: multiple rooms have been found"

	return rooms[0]
}

/**
 * Filter DOM objects, so that only those containing power
 * relevant elements are included.
 *
 * @param objs list of DOM elements
 * @return list of filtered DOM elements
 */
function find_power(objs) {
	return filterObj(objs, ["room-lighting", "receptacle"])
}

/**
 * Find elements attached to the endpoints of a path. May e.g.
 * be used to find a receptacle attached to a cable.
 *
 * @param {SVGPath} path Path, that should be analysed
 * @return touple with a list of DOM elements for start and endpoint
 */
function pathEndpointPowerObjects(path) {
	var ep = pathEndpoints(path)
	var mapsvg = $("#mapsvg")[0]
	var base = $("#mapsvg > g[class='svg-pan-zoom_viewport']")[0]
	var rpos = mapsvg.createSVGRect()
	rpos.width = rpos.height = 1

	var start = ep[0].matrixTransform( base.getTransformToElement(mapsvg) )
	var stop = ep[1].matrixTransform( base.getTransformToElement(mapsvg) )

	rpos.x = start.x
	rpos.y = start.y
	var start_raw = $("#mapsvg")[0].getIntersectionList(rpos, null)

	rpos.x = stop.x
	rpos.y = stop.y
	var stop_raw = $("#mapsvg")[0].getIntersectionList(rpos, null)

	return [find_power(start_raw), find_power(stop_raw)]
}

/**
 * (un)highlight a room
 *
 * @param room jQuery object for room
 * @param highligh highlight room, if true, unhighlight otherwise
 */
function highlightRoom(room, highlight) {
	if(highlight)
		room.css("fill", "#ffaa88")
	else
		room.css("fill", "#ffeeaa")
}

/**
 * highlight room for a sub-element
 *
 * @param obj jQuery object for element inside of the room
 * @param highligh highlight room, if true, unhighlight otherwise
 */
function highlightRoomSubelement(obj, highlight) {
	try {
		var room = getSingleRoomForObject(obj[0])
		highlightRoom($(room), highlight)
	} catch(err) {
		console.log("err:", err)
	}
}

/**
 * (un)highlight a power icon
 *
 * @param obj jQuery object for power icon element
 * @param highligh highlight element, if true, unhighlight otherwise
 */
function highlightPowerIcon(obj, highlight) {
	/* keep room highlighted */
	highlightRoomSubelement(obj, highlight)

	if(highlight)
		obj.css("opacity", "0.5")
	else
		obj.css("opacity", "1.0")
}

/**
 * highlight a room
 *
 * @param {string} roomname room, that should be highlighted
 */
function highlightRoomByName(roomname) {
	if (!(roomname in roomlist)) {
		console.log("unknown room");
		return
	}
	if (typeof highlightedRoom !== 'undefined') {
		highlightRoom(highlightedRoom, false)
	}

	var room = roomlist[roomname];
	if (typeof room === 'undefined') {
		console.error("unknown room, but found in roomlist");
		return
	}

	roombox = room[0].getBBox()
	roomcenter = { x: roombox.x + roombox.width/2, y: roombox.y + roombox.height/2 };
	panToCoordinate(roomcenter);

	highlightRoom(room, true)
	highlightedRoom = room;
}

/**
 * Get cable type
 *
 * @param cable DOM element for the cable
 * @return {string} cable type
 */
function getCableType(cable) {
	var type = "unknown cable"

	if(cable.classList.contains("NYM-J-3x1.5"))
		type = "NYM-J 3x1,5"
	else if(cable.classList.contains("NYM-J-5x6"))
		type = "NYM-J 5x6"
	
	return type
}

/**
 * Get power object type
 *
 * @param cable DOM element for the power object
 * @return {string} power object type
 */
function getPowerType(power) {
	var type = "unknown power endpoint"

	if(power.classList.contains("room-lighting"))
		type = "Raumlicht"
	else if(power.classList.contains("receptacle"))
		type = "Steckdose"
	
	return type
}

/**
 * handle layer information
 */
function handleSVGlayers() {
	$( "[inkscape\\:groupmode='layer']" ).each(function( index ) {
		/* Layer group should catch events for drag'n'drop support */
		$(this).css("pointer-events", "all");

		var defaultlayers = [ "Raummarkierungen", "Base", "Wegmarkierungen", "Regal & Spinde", "Furniture", "Küche", "Raumbeschriftung" ];

		/* Extract Layers for Navigation */
		if ( defaultlayers.indexOf($( this ).attr("inkscape:label")) >= 0 ) {
			$("#layerbox").html($("#layerbox").html() + '<li><label class="checkbox-inline"><input type="checkbox" onchange="handleLayerCheckbox(this, \'' + $( this ).attr("inkscape:label") + '\');" checked>' +  $( this ).attr("inkscape:label") + '</label></li>')
			$(this).css("display", "inline")
		} else {
			$("#layerbox").html($("#layerbox").html() + '<li><label class="checkbox-inline"><input type="checkbox" onchange="handleLayerCheckbox(this, \'' + $( this ).attr("inkscape:label") + '\');">' +  $( this ).attr("inkscape:label") + '</label></li>')
			$(this).css("display", "none")
		}
	});
}

/**
 * handle room information
 */
function handleSVGrooms() {
	$( "path[class='room']" ).each(function( index ) {
		$(this).css("pointer-events", "auto");

		$(this).hover(
			function() { highlightRoom($(this), true) },
			function() { highlightRoom($(this), false) }
		);

		$(this).mousedown(function(evt) {
			mousedownevt = evt;
		});

		$(this).mouseup(function(evt) {
			/* make sure, we receive only one click event */
			if (typeof lastclick !== 'undefined' && evt.timeStamp === lastclick.timeStamp && evt.offsetX === lastclick.offsetX && evt.offsetY === lastclick.offsetY)
				return;
			lastclick = evt;

			if (mousedownevt.screenX < evt.screenX-5 || mousedownevt.screenX > evt.screenX+5)
				return;
			if (mousedownevt.screenY < evt.screenY-5 || mousedownevt.screenY > evt.screenY+5)
				return;

			var area = pathArea($(this))

			/* handle click event */
			$("#InfoTitle").text($(this).find("title").text())
			$("#InfoBody").html("<b>" + $(this).find("title").text() + "</b> hat eine Fläche von " + Math.round(area*100)/100 + " m².")
			$("#Info").modal()
		});

		var roomname = $(this).find("title").text();
		roomname = roomname.toLowerCase().replace(/&/g, "and").replace(/ /g, "-");
		if (!(roomname in roomlist)) {
			roomlist[roomname] = $(this)
			$("#rooms").html($("#rooms").html() + '<li><a href="#room='+roomname+'" onclick="highlightRoomByName(\''+roomname+'\')">'+$(this).find("title").text()+'</a></li>')
		}
	});
}

/**
 * handle power icon information
 */
function handleSVGpowericons() {
	$( ".room-lighting, .receptacle" ).each(function( index ) {
		$(this).mousedown(function(evt) {
			mousedownevt = evt;
		});

		$(this).hover(
			function() { highlightPowerIcon($(this), true) },
			function() { highlightPowerIcon($(this), false) }
		);

		$(this).mouseup(function(evt) {
			/* make sure, we receive only one click event */
			if (typeof lastclick !== 'undefined' && evt.timeStamp === lastclick.timeStamp && evt.offsetX === lastclick.offsetX && evt.offsetY === lastclick.offsetY)
				return;
			lastclick = evt;

			if (mousedownevt.screenX < evt.screenX-5 || mousedownevt.screenX > evt.screenX+5)
				return;
			if (mousedownevt.screenY < evt.screenY-5 || mousedownevt.screenY > evt.screenY+5)
				return;

			var roomname = "unknown"
			try {
				var room = getSingleRoomForObject($(this)[0])
				roomname = $(room).find("title").text()
			} catch(err) {
				console.log("Could not get Room:", err)
			}

			var type = getPowerType($(this)[0])

			/* handle click event */
			$("#InfoTitle").text("Informationen über " + type)
			$("#InfoBody").html("<b>Raum:</b> " + roomname)
			$("#Info").modal()
		});
	});
}

/**
 * handle power line information
 */
function handleSVGpowerlines() {
	$( ".NYM-J-3x1\\.5, .NYM-J-5x6" ).each(function( index ) {
		$(this).hover(
			function() {
				$(this).css("stroke", "#ff0000")
			},
			function() {
				var type = getCableType($(this)[0])

				switch (type) {
					case "NYM-J 5x6":
						$(this).css("stroke", "#00ff00")
						break;
					default:
						$(this).css("stroke", "#0000ff")
						break;
				}
			}
		);

		$(this).mousedown(function(evt) {
			mousedownevt = evt;
		});

		$(this).mouseup(function(evt) {
			/* make sure, we receive only one click event */
			if (typeof lastclick !== 'undefined' && evt.timeStamp === lastclick.timeStamp && evt.offsetX === lastclick.offsetX && evt.offsetY === lastclick.offsetY)
				return;
			lastclick = evt;

			if (mousedownevt.screenX < evt.screenX-5 || mousedownevt.screenX > evt.screenX+5)
				return;
			if (mousedownevt.screenY < evt.screenY-5 || mousedownevt.screenY > evt.screenY+5)
				return;

			var len = pathLength($(this));
			var eps = pathEndpointPowerObjects($(this));
			var start = null;
			var stop = null;

			if (eps[0].length == 0) {
				console.error("no start element has been found")
			} else if(eps[0].length > 1) {
				console.error("multiple start element have been found")
			} else {
				start = eps[0][0];
				console.log("start element:", start)
				console.log("start room:", getRoomForObject(start))
			}

			if(eps[1].length == 0) {
				console.error("no end element has been found")
			} else if(eps[1].length > 1) {
				console.error("multiple end elements have been found")
			} else {
				stop = eps[1][0];
				console.log("stop element:", stop)
				console.log("stop room:", getRoomForObject(stop))
			}

			var type = getCableType($(this)[0])

			/* handle click event */
			$("#InfoTitle").text("Informationen über NYM-Kabel")
			$("#InfoBody").html("<b>Type:</b> " + type + "<br><b>Length:</b> " + Math.round(len*100)/100 + "m")
			$("#Info").modal()
		});
	});
}

/**
 * embed map SVG object
 *
 * @param svgdata SVG information (e.g. loaded via XMLHttpRequest)
 */
function embedSVG(svgdata) {
	viewportdiv.innerHTML = svgdata
	$("#viewportdiv:first-child").first().attr("style", "width:100%")

	var svgelement = $("#viewportdiv > svg")
	svgelement.attr("id", "mapsvg")

	panZoom = svgPanZoom('#mapsvg', {controlIconsEnabled: true, fit: true, center: true, maxZoom: 20, });

	handleSVGlayers()
	handleSVGrooms()
	handleSVGpowericons()
	handleSVGpowerlines()
}

/**
 * load map.svg
 */
function loadSVG() {
	var SVGFile="map.svg"
	var loadXML = new XMLHttpRequest;

	function handler() {
		if(loadXML.readyState == 4 && (loadXML.status == 200 || loadXML.status == 0)) {
			console.log("SVG loaded!")
			embedSVG(loadXML.responseText)
		}
	}

	if (loadXML != null) {
		loadXML.open("GET", SVGFile, true);
		loadXML.onreadystatechange = handler;
		loadXML.send();
	}
}
