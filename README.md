# How does this work?

 * Basically loads an SVG into an HTML page
 * The SVG is made zoomable and draggable using svg-pan-zoom.js
  * Library applies a transformation matrix on the svg based on the cursor events
 * Layer support depends on inkscape layer tagging (not part of SVG standard)
  * Javascript code search for inkscape layer tags and extracts the required information
  * Hiding layers is iplemented using CSS ("display: none")
 * room-support depends on class=room attribute being added to the SVG object
  * see section "Add class attribute in inkscape"
  * the area is calculated using 

# Features

## Layer Selection

 * JS-Code extracts information about inkscape layers from the SVG file
  * (layers are not part of the SVG standard)
 * Hiding layers is implemented using CSS ("display: none")

## Room Selection

 * Rooms are marked by adding a "class=room" attribute to the room's path element
 * Area is calculated using the simple Algorithm described in the Wikipedia for Polygon
  * Thus the room path may not intersect with itself

## Power Icons

 * Requires getIntersectionList()
 * Power Icons are interpreted if "class=receptacle" or "class=room-lighting" is set

## Power Cables

 * Requires getIntersectionList()
 * Power Cables are interpreted if "class=NYM-J-3x1.5" or "class=NYM-J-5x6" is set
 * Length calculation only works if no bezier elements are part of the path

# Notes for SVG

## Settings

 * SVG unit: 'mm'
  * Scale: 1mm (SVG) = 1 decimeter (Real World)
 * Resolution: 90 DPI

## Inkscape: Adding class attribute

 * Inkscape does not (yet?) support adding a class attribute to elements, but will not remove it on saving
 * It can be added manually using Inkscape's XML editor
  1. Display XML Editor (Edit > XML Editor)
  2. Select element, that should get a class, so that it will be selected in the XML-Editor
  3. Put '''class''' into the input box and '''room''' (or any other desired value) into the multiline box
  4. Press Set

# Notes for local testing

 * chrome/chromium should be started with "--allow-file-access-from-files"
