"use strict";

var bugfixVersion = 0;
var featureVersion = 1;
var version = featureVersion + "." + bugfixVersion;

var haveCSV = false;
var haveSVG = false;
var units = "";
var csvArray = undefined;
var range = undefined;
var svg = undefined;

var highVal = undefined;
var highColour = "#00FF00";
var highTransparent = false;
var midVal = undefined;
var midValEnable = true;
var midColour = "#FFFF00";
var midTransparent = false;
var lowVal = undefined;
var lowColour = "#FF0000";
var lowTransparent = false;

var lastStrokeWidth = undefined;
var lastStrokeColour = undefined;

var startPos = undefined;
var startTransform = undefined;

function max(a, b) {
  return (a > b) ? a : b;
}

// In a string matching regex [0-9]+[^0-9]*, isolate the leading
// numerical component and multiply it by the given multiplicand,
// returning it as a string with the original units.
function multString(orig, multiplicand) {
  var origUnit;
  var origVal;
  var i = 0;
  while (orig[i] >= '0' && orig[i] <= '9') {
    ++i;
  }
  origVal = orig.slice(0, i);
  origUnit = orig.slice(i);
  origVal = origVal * multiplicand;
  return origVal + origUnit;
}

// Increase a "stroke-width" string to the maximum of 3<units> or
// current width.
function increaseSWTo3(sw) {
  var swUnit;
  var swVal;
  var i = 0;
  while (sw[i] >= '0' && sw[i] <= '9') {
     ++i;
  }
  swVal = sw.slice(0, i);
  swUnit = sw.slice(i);
  swVal = max(swVal, 3);
  return swVal + swUnit;
}

function highlight(e) {
  // Save the existing colour/width for later restoration.
  lastStrokeWidth = this.style["stroke-width"];
  lastStrokeColour = this.style.stroke;

  this.style["stroke-width"] = increaseSWTo3(lastStrokeWidth);
  this.style.stroke = "red";
}

function lowlight(e) {
  // Restore the previous width/colour.
  this.style["stroke-width"] = lastStrokeWidth;
  this.style.stroke = lastStrokeColour;
}

// Pass selected SVG file to the displaying element.
function handleSvgFileSelect(evt) {
  var reader = new FileReader();
  reader.onload = function(readerEvent) {
    var elem = document.getElementById("svgresult");
    elem.data = readerEvent.target.result;
  };
  reader.readAsDataURL(evt.target.files[0]);
}

// Listener for the element which displays the SVG. This globally
// signals that we have a valid SVG by setting the global haveSVG to
// true.
function registerSvg(evt) {
  svg = evt.target.contentDocument.getElementsByTagName('svg')[0];
  if (svg !== null) {
    haveSVG = true;
  } else {
    haveSVG = false;
  }
  updateSvg();
}

// Returns true if n is... numeric.
// From https://stackoverflow.com/a/1830844/885587
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

// Check that a row of the csvData is valid. A valid row has two fields.
// The first should be defined and not zero length, while the second
// should be numeric.
function checkRowValid(element, index) {
  // At least two elements per row
  if ((element.length === 0) ||
    (element.length < 2)) {
    this.valid = false;
    alert("CSV row " + index + " : data must have at least 2 entries per row (ID, and value).");
  }
  // First element not undefined
  if ((element.length !== 0) &&
    (!(0 in element) ||
      (element[0] === ""))) {
    this.valid = false;
    alert("CSV row " + index + " : data must have non-empty 1st column (ID).");
  }
  // Second element numeric
  if (!isNumeric(element[1])) {
    this.valid = false;
    alert("CSV row " + index + ", (" + element[1] + ") : data must have numeric 2nd column (value).");
  }
}

// Checks that the CSV data is applicable as heat map data.
function checkValidData() {
  var status = {valid:true};

  csvArray.forEach(checkRowValid, status);

  return status.valid;
}

// Convert string vals to floats and collate min/max value (per element)
function prepCsvArrayElem(element) {
  // Convert string to float
  element[1] = parseFloat(element[1]);

  if (element[1] > this.max) {
    this.max = element[1];
  }
  if (element[1] < this.min) {
    this.min = element[1];
  }
}

// Convert string vals to floats and collate min/max value
function prepCsvArray() {
  range = {min:Infinity,max:-Infinity};
  csvArray.forEach(prepCsvArrayElem, range);

  // Set range.factor. This is set such that
  // range.factor * (range.name - range.min) is contained in [0.0,1.0]
  range.factor = 1.0 / (range.max - range.min);
}

// Return the colour ("#??????") resulting in interpolation between
// highColour, midColour, and lowColour (don't forget transparencies!)
function setColour (elem, val) {
  // Choose the relevant high and low values
  var lHighVal = (highVal === undefined) ? range.max : highVal;
  var lHighColour = highColour;
  var lHighTransparent = highTransparent;
  var lLowVal = (lowVal === undefined) ? range.min : lowVal;
  var lLowColour = lowColour;
  var lLowTransparent = lowTransparent;
  var lMidVal = (midVal === undefined) ? ((lHighVal - lLowVal) / 2) + lLowVal : midVal;
  if (midValEnable) {
    if (val >= lMidVal) {
      lLowVal = lMidVal;
      lLowColour = midColour;
      lLowTransparent = midTransparent;
    } else {
      lHighVal = lMidVal;
      lHighColour = midColour;
      lHighTransparent = midTransparent;
    }
  }

  // Calc the interpolant
  var interp;
  if (val >= lHighVal) {
     interp = 1.0;
  } else if (val <= lLowVal) {
     interp = 0.0;
  } else {
     interp = (val - lLowVal) / (lHighVal - lLowVal);
  }

  // Interpolate
  if (lLowTransparent && lHighTransparent) {
    elem.style["fill-opacity"] = 0;
  } else if (lLowTransparent) {
    elem.style.fill = lHighColour;
    elem.style["fill-opacity"] = interp;
  } else if (lHighTransparent) {
    elem.style.fill = lLowColour;
    elem.style["fill-opacity"] = 1.0 - interp;
  } else {
    var highRed   = parseInt(lHighColour.slice(1,3),16);
    var highGreen = parseInt(lHighColour.slice(3,5),16);
    var highBlue  = parseInt(lHighColour.slice(5,7),16);
    var lowRed   = parseInt(lLowColour.slice(1,3),16);
    var lowGreen = parseInt(lLowColour.slice(3,5),16);
    var lowBlue  = parseInt(lLowColour.slice(5,7),16);
    var red   = (highRed * interp) + (lowRed * (1.0 - interp));
    var green = (highGreen * interp) + (lowGreen * (1.0 - interp));
    var blue  = (highBlue * interp) + (lowBlue * (1.0 - interp));
    var redString   = ("00" + Math.floor(red).toString(16)).substr(-2);
    var greenString = ("00" + Math.floor(green).toString(16)).substr(-2);
    var blueString  = ("00" + Math.floor(blue).toString(16)).substr(-2);
    elem.style.fill = "#" + redString + greenString + blueString;
    elem.style["fill-opacity"] = 1.0; // In case it's previously been set lower.
  }
}


// Using data from the global object csvArray, update the SVG element with
// id="id" given that element = [id, value, name].
function updateSVGByElem (element) {
  var elem = svg.getElementById(element[0]);

  if (elem !== null) {
    elem.addEventListener("mouseenter", highlight);
    elem.addEventListener("mouseleave", lowlight);
    setColour (elem, element[1]);

    // Add a "title" element.
    var titleString = element[0];
    if (element[2] !== undefined) {
       titleString = element[2];
    }
    if (titleString[titleString.length - 1] != '\n') {
      titleString += '\n';
    }
    titleString = titleString + element[1] + units;
    // Test if element already has a title child node.
    var ti = elem.getElementsByTagName("title");
    if (ti.length > 0) {
      // Already have a title child node.
      // There should be only one, so using index 0 should be safe.
      ti[0].textContent = titleString;
    } else {
      // Need to create a title child node.
      var newTitle = document.createElementNS("http://www.w3.org/2000/svg","title")
      newTitle.textContent = titleString;
      elem.appendChild(newTitle);
    }

  } else {
    console.log("svgHeatmap: WARNING: id \"" + element[0] + "\" not found in SVG.");
  }
}

// Given both SVG and CSV data, update the SVG regions.
function updateSvg() {
  if (haveSVG && haveCSV) {
    csvArray.forEach(updateSVGByElem);

    // Update the legend
    var oldLegend = svg.getElementById("legend");
    var transformString = undefined;
    if (oldLegend != undefined) {
      transformString = oldLegend.getAttribute('transform');
      oldLegend.parentNode.removeChild(oldLegend);
    }
    addLegend(transformString);
  }
}

function getCsvObj(file) {
  var reader = new FileReader();
  reader.onload = function(){
    csvArray = readCSV(this.result);
    if (checkValidData(csvArray)) {
      prepCsvArray(csvArray);
      haveCSV = true;
      updateSvg();
    } else {
      console.log("CSV validation failed.");
      haveCSV = false;
      csvArray = null;
    }
  };
  reader.onerror = function(){ alert("Unable to read " + file.fileName); };
  reader.readAsText(file);
}

function handleCsvFileSelect(evt) {
  var file = evt.target.files[0]; // FileList object
  getCsvObj(file); // read the file contents
}

// save SVG
function saveToFile(elem) {
  var svgs = elem.contentDocument.getElementsByTagName("svg");

  if (svgs.length > 0) {
    // Change drag cursor for legend
    svgs[0].getElementById('legend').removeAttribute('style');

    // Create new link to SVG data
    var a      = document.createElement('a');
    a.href     = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgs[0].outerHTML)));
    a.download = 'heatmap.svg'; // TODO: use save dialog
    a.target   = '_blank';

    // Use newly created link
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    console.log("svgHeatmap: ERROR: SVG not found.");
  }
};

// Toggle the visibility of the options
function toggleOptionsVisible() {
  var button = document.getElementById("toggleOptions");
  var options = document.getElementsByClassName("option");

  if (button.innerText === "Show") {
    // Set class' visibility
    for (var i = 0; i < options.length; ++i) {
      options[i].style.display = 'block'
    }
    // Change button's text
    button.innerText = "Hide";
  } else {
    // Set class' visibility
    for (var i = 0; i < options.length; ++i) {
      options[i].style.display = 'none'
    }
    // Change button's text
    button.innerText = "Show";
  }
}

function toggleColourTransparency(evt) {
  var targetColour;
  var setTransparent = evt.target.checked;

  if (evt.target.id === "lowTransparent") {
    // Affect low colours
    if (setTransparent) {
      lowTransparent = true;
    } else {
      lowTransparent = false;
    }
  } else if (evt.target.id === "midTransparent") {
    // Affect mid colours
    if (setTransparent) {
      midTransparent = true;
    } else {
      midTransparent = false;
    }
  } else {
    // Affect high colours
    if (setTransparent) {
      highTransparent = true;
    } else {
      highTransparent = false;
    }
  }
  updateSvg();
}

function changeColour(evt) {
  var checkTransparent;
  if (evt.target.id === "lowColour") {
    checkTransparent = document.getElementById("lowTransparent");
    if (!checkTransparent.checked) {
      lowColour = evt.target.value;
    }
  } else if (evt.target.id === "midColour") {
    checkTransparent = document.getElementById("midTransparent");
    if (!checkTransparent.checked) {
      midColour = evt.target.value;
    }
  } else {
    checkTransparent = document.getElementById("highTransparent");
    if (!checkTransparent.checked) {
      highColour = evt.target.value;
    }
  }
  updateSvg();
}

function toggleValAuto(evt) {
  var numInput;

  if (evt.target.id === "lowValAuto") {
    if (evt.target.checked) {
      lowVal = undefined;
    } else {
      numInput = document.getElementById("lowValue");
      lowVal = numInput.value;
    }
  } else if (evt.target.id === "midValAuto") {
    if (evt.target.checked) {
      midVal = undefined;
    } else {
      numInput = document.getElementById("midValue");
      midVal = numInput.value;
    }
  } else { // high
    if (evt.target.checked) {
      highVal = undefined;
    } else {
      numInput = document.getElementById("highValue");
      highVal = numInput.value;
    }
  }
  updateSvg();
}

function setRangeVal(evt) {
  var valEnabled;

  if (evt.target.id === "lowValue") {
    valEnabled = document.getElementById("lowValAuto");
    if (!valEnabled.checked) {
      lowVal = evt.target.value;
    } else {
      lowVal = undefined;
    }
  } else if (evt.target.id === "midValue") {
    valEnabled = document.getElementById("midValAuto");
    if (!valEnabled.checked) {
      midVal = evt.target.value;
    } else {
      midVal = undefined;
    }
  } else { // high
    valEnabled = document.getElementById("highValAuto");
    if (!valEnabled.checked) {
      highVal = evt.target.value;
    } else {
      highVal = undefined;
    }
  }
  updateSvg();
}

function toggleMidValEnable(evt) {
  midValEnable = !midValEnable;
  updateSvg();
}

function addLegend(transformString) {
  var svgNS = svg.namespaceURI;
  var newGroup  = document.createElementNS(svgNS,'g');
  newGroup.id = "legend";
  newGroup.style.cursor = "grab";
  newGroup.addEventListener("mousedown", moveLegendMouseDown);

  // Get some measurements.
  var svgbbox = getSvgBb();
  var lwidth = (svgbbox.width / 7);   // default legend width
  var lheight = (svgbbox.height / 3); // default legend height
  var offset = lwidth / 10;

  // Add the background
  var elem = document.createElementNS(svgNS,"rect");
  elem.id = "legendBackground";
  elem.setAttributeNS(null, 'x', 0);
  elem.setAttributeNS(null, 'y', 0);
  elem.setAttributeNS(null, 'width', lwidth / 3); // This width is set to ensure the group
                                                  // width is defined by the text width
                                                  // and is reset below.
  elem.setAttributeNS(null, 'height', lheight);
  elem.setAttributeNS(null, 'rx', 3);
  elem.setAttributeNS(null, 'ry', 3);
  elem.style.fill = "#FFFFFF";
  elem.style.stroke = "#000000";
  elem.style.strokeWidth = "1px";
  newGroup.appendChild(elem);

  // Put a chequered pattern behind the colour bar to illustrate
  // transparency.
  // TODO

  createLegendGradient();

  // Add the Colour bar
  var elem = document.createElementNS(svgNS,"rect")
  elem.id = "legendColourBar";
  elem.setAttributeNS(null, 'x', offset);
  elem.setAttributeNS(null, 'y', offset);
  elem.setAttributeNS(null, 'width', lwidth / 3);
  elem.setAttributeNS(null, 'height', lheight - (2 * offset));
  elem.setAttributeNS(null, 'rx', 3);
  elem.setAttributeNS(null, 'ry', 3);
  elem.style.stroke = "#000000";
  elem.style.strokeWidth = "1px";
  elem.style.fill = 'url(#legendGrad)';
  newGroup.appendChild(elem);

  // Add labels
  addLabels(svgNS, lwidth, lheight, offset, newGroup);

  // Add newGroup to svg
  svg.appendChild(newGroup);

  // Add labels and change width of legend to wrap contents
  elem = svg.getElementById("legendBackground");
  var tightWidth = parseFloat(newGroup.getBBox().width) + offset;
  elem.setAttributeNS(null, 'width', tightWidth);

  // Offset newGroup
  if (transformString !== undefined) {
    newGroup.setAttributeNS(null, 'transform', transformString);
  } else {
    var gx = ((svgbbox.x + svgbbox.width) - tightWidth - offset);
    var gy = ((svgbbox.y + svgbbox.height) - lheight) / 2;
    newGroup.setAttributeNS(null, 'transform', "translate(" + gx + "," + gy + ")");
  }
}

// Add labels to the legend's colour bar
function addLabels(svgNS, lwidth, lheight, offset, newGroup) {
  var lHighVal = (highVal === undefined) ? range.max : highVal;
  var lLowVal = (lowVal === undefined) ? range.min : lowVal;
  var lMidVal = (midVal === undefined) ? ((lHighVal - lLowVal) / 2) + lLowVal : midVal;

  // Decide on printed precision
  var lrange = lHighVal - lLowVal;
  var precision = 2;
  if (lrange > 10) {
    precision = 0;
  } else if (lrange > 1) {
    precision = 1;
  }

  // Add upper label
  var newText = document.createElementNS(svgNS,"text");
  newText.setAttributeNS(null,"x", (lwidth / 3) + 2 * offset);
  newText.setAttributeNS(null,"y", offset + 4);
  newText.setAttributeNS(null,"font-size","11");

  var label=lHighVal.toFixed(precision);
  if (units !== undefined) {
    label += units;
  }
  var textNode = document.createTextNode(label);

  newText.appendChild(textNode);
  newGroup.appendChild(newText);

  // Add mid label
  if (midValEnable) {
    var midOffset = ((lMidVal - lLowVal) / (lHighVal - lLowVal)) * (lheight - (2 * offset));

    var newText = document.createElementNS(svgNS,"text");
    newText.setAttributeNS(null,"x", (lwidth / 3) + 2 * offset);
    newText.setAttributeNS(null,"y", lheight - offset + 3 - midOffset);
    newText.setAttributeNS(null,"font-size","11");

    var label=lMidVal.toFixed(precision);
    if (units !== undefined) {
      label += units;
    }
    var textNode = document.createTextNode(label);

    newText.appendChild(textNode);
    newGroup.appendChild(newText);
  }

  // Add lower label
  var newText = document.createElementNS(svgNS,"text");
  newText.setAttributeNS(null,"x", (lwidth / 3) + 2 * offset);
  newText.setAttributeNS(null,"y", lheight - offset + 2);
  newText.setAttributeNS(null,"font-size","11");

  var label=lLowVal.toFixed(precision);
  if (units !== undefined) {
    label += units;
  }
  var textNode = document.createTextNode(label);

  newText.appendChild(textNode);
  newGroup.appendChild(newText);
}

// Taken from https://stackoverflow.com/a/10898304/885587
function createLegendGradient(){
  var svgNS = svg.namespaceURI;
  var grad  = document.createElementNS(svgNS,'linearGradient');
  grad.setAttribute('id','legendGrad');

  // Create low to high (it has to be in this order to work)
  grad.setAttribute('x1', "0%");
  grad.setAttribute('y1', "0%");
  grad.setAttribute('x2', "0%");
  grad.setAttribute('y2', "100%");

  // High - no, I don't know why the high colour must be at 0%, but it
  // must.
  stop = document.createElementNS(svgNS,'stop');
  stop.setAttribute('offset', "0%");
  stop.setAttribute('stop-color', highColour);
  stop.setAttribute('stop-opacity', (highTransparent ? 0.0 : 1.0));
  grad.appendChild(stop);

  // Mid
  if (midValEnable) {
     stop = document.createElementNS(svgNS,'stop');
     var lLowVal = (lowVal === undefined) ? range.min : lowVal;
     var lHighVal = (highVal === undefined) ? range.max : highVal;
     stop.setAttribute('offset', ((midVal === undefined) ? "50%"
                                                         : (((lHighVal - midVal) / (lHighVal - lLowVal)) * 100) + "%"));
     stop.setAttribute('stop-color', midColour);
     stop.setAttribute('stop-opacity', (midTransparent ? 0.0 : 1.0));
     grad.appendChild(stop);
  }

  // Low
  var stop = document.createElementNS(svgNS,'stop');
  stop.setAttribute('offset', "100%");
  stop.setAttribute('stop-color', lowColour);
  stop.setAttribute('stop-opacity', (lowTransparent ? 0.0 : 1.0));
  grad.appendChild(stop);

  // Ensure there's a defs section
  var defs = svg.querySelector('defs') ||
             svg.insertBefore(document.createElementNS(svgNS,'defs'), svg.firstChild);

  // Remove old legendGrads
  var oldGrad = svg.getElementById('legendGrad');
  if (oldGrad !== null) {
    oldGrad.parentNode.removeChild(oldGrad);
  }

  return defs.appendChild(grad);
}

// Much of the inspiration for the following functions comes from
// https://stackoverflow.com/a/10298843/885587, and
// http://svg-whiz.com/svg/DragAndDrop.svg
function moveLegendMouseDown(evt) {
  // Set move and mouseup handlers
  this.addEventListener("mousemove", moveLegendDrag);
  this.addEventListener("mouseup", moveLegendMouseUp);
  this.addEventListener("mouseleave", moveLegendMouseUp);

  // Set opacity
  this.setAttribute('opacity', 0.5);

  // Set cursor
  this.style.cursor = "grabbing";

  // Cache current svg-space position
  startPos = svg.createSVGPoint();
  startTransform = svg.createSVGPoint();
  var newScale = svg.currentScale;
  startPos.x = evt.clientX;
  startPos.y = evt.clientY;
  startPos.matrixTransform(svg.getScreenCTM().inverse());
  var transformString = this.getAttribute('transform');
  var transformArray = transformString.split(/[(,)]/);
  startTransform.x = parseFloat(transformArray[1]);
  startTransform.y = parseFloat(transformArray[2]);
}
function moveLegendDrag(evt) {
  var curPos = svg.createSVGPoint();
  curPos.x = evt.clientX;
  curPos.y = evt.clientY;
  curPos.matrixTransform(svg.getScreenCTM().inverse());
  var delta = svg.createSVGPoint();
  delta.x = curPos.x - startPos.x;
  delta.y = curPos.y - startPos.y;
  curPos.x = startTransform.x + delta.x;
  curPos.y = startTransform.y + delta.y;

  this.setAttributeNS(null, 'transform', "translate(" + curPos.x + "," + curPos.y + ")");
}
function moveLegendMouseUp(evt) {
  // Remove move and mouseup handlers
  this.removeEventListener("mousemove", moveLegendDrag);
  this.removeEventListener("mouseup", moveLegendMouseUp);
  this.removeEventListener("mouseleave", moveLegendMouseUp);

  // Set cursor
  this.style.cursor = "grab";

  // Restore opacity
  this.setAttribute('opacity', 1);
}

// Get the size (in svg-units) of svg image
function getSvgBb() {
  var box = {x : undefined,
             y : undefined,
             width : undefined,
             height : undefined}
  // Try viewBox
  if (svg.getAttribute('viewBox') !== null) {
    box = svg.viewBox.baseVal;
  } else {
    // Use width/height
    if ((svg.getAttribute('width') !== null) &&
        (svg.getAttribute('height') !== null)) {
       box.x = 0;
       box.y = 0;
       box.width = svg.getAttribute('width');
       box.height = svg.getAttribute('height');
    }
  }

  return box;
}

function setUnit(evt) {
  units = evt.target.value;
  updateSvg();
}

window.onload = function () {
  document.getElementById("csvfile").addEventListener("change", handleCsvFileSelect);
  document.getElementById("svgfile").addEventListener("change", handleSvgFileSelect);
  document.getElementById("svgresult").addEventListener("load", registerSvg);
  document.getElementById("version").textContent = "Version " + version;

  // Colour options
  document.getElementById("lowValAuto").addEventListener("change", toggleValAuto);
  document.getElementById("lowValue").addEventListener("change", setRangeVal);
  document.getElementById("lowTransparent").addEventListener("change", toggleColourTransparency);
  document.getElementById("lowColour").addEventListener("change", changeColour);

  document.getElementById("midValEnable").addEventListener("change", toggleMidValEnable);
  document.getElementById("midValAuto").addEventListener("change", toggleValAuto);
  document.getElementById("midValue").addEventListener("change", setRangeVal);
  document.getElementById("midTransparent").addEventListener("change", toggleColourTransparency);
  document.getElementById("midColour").addEventListener("change", changeColour);

  document.getElementById("highValAuto").addEventListener("change", toggleValAuto);
  document.getElementById("highValue").addEventListener("change", setRangeVal);
  document.getElementById("highTransparent").addEventListener("change", toggleColourTransparency);
  document.getElementById("highColour").addEventListener("change", changeColour);

  // Unit options
  document.getElementById("unit").addEventListener("change", setUnit);
};

