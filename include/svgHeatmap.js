"use strict";

var bugfixVersion = 9; // As any features necessary for first release missing are bugs.
var featureVersion = 0; // As features necessary for first release missing.
var version = featureVersion + "." + bugfixVersion;

var haveCSV = false;
var haveSVG = false;
var units = "%";
var csvObj = undefined;
var mySvgDoc = undefined;

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

function max(a, b) {
   return (a > b) ? a : b;
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
  mySvgDoc = evt.target.contentDocument;
  if (mySvgDoc !== null) {
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
function checkValidData(csvArray) {
  var status = {valid:true};

  csvArray.forEach(checkRowValid, status);

  return status.valid;
}

// Convert an array row to an element
function csvRowToElement(element) {
  var elemFloat = parseFloat(element[1]);
  csvObj["KEY_" + element[0]] = elemFloat;
  if (elemFloat > csvObj.max) {
    csvObj.max = elemFloat;
  }
  if (elemFloat < csvObj.min) {
    csvObj.min = elemFloat;
  }
}

// Convert csvArray to a global object at csvObj
function csvArrayToObject(csvArray) {
  csvObj = {min:Infinity,max:-Infinity};

  csvArray.forEach(csvRowToElement);

  // Set csvObj.rangeFactor. This is set such that
  // rf * (csvObj.name - csvObj.min) is contained in [0.0,1.0]
  csvObj.rangeFactor = 1.0 / (csvObj.max - csvObj.min);
}

// Return the colour ("#??????") resulting in interpolation between
// highColour, midColour, and lowColour (don't forget transparencies!)
function setColour (elem, val) {
  // Choose the relevant high and low values
  var lHighVal = (highVal === undefined) ? csvObj.max : highVal;
  var lHighColour = highColour;
  var lHighTransparent = highTransparent;
  var lMidVal = (midVal === undefined) ? ((csvObj.max - csvObj.min) / 2) + csvObj.min : midVal;
  var lLowVal = (lowVal === undefined) ? csvObj.min : lowVal;
  var lLowColour = lowColour;
  var lLowTransparent = lowTransparent;
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


// Using data from the global object csvObj, update the SVG element with
// <name> given that element = "KEY_<name>".
function updateSVGByKey (element) {
  if (element.startsWith("KEY_")) {
    var keystring = element.substr(4); // get key string
    var elem = mySvgDoc.getElementById(keystring);

    if (elem !== null) {
      elem.addEventListener("mouseenter", highlight);
      elem.addEventListener("mouseleave", lowlight);
      setColour (elem, csvObj[element]);

      // Add a "title" element.
      var titleString = keystring + ": " + csvObj[element] + " " + units;
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
      console.log("svgHeatmap: WARNING: KEY \"" + keystring + "\" not found in SVG.");
    }
  }
}

// Given both SVG and CSV data, update the SVG regions.
function updateSvg() {
  if (haveSVG && haveCSV) {
    Object.keys(csvObj).forEach(updateSVGByKey);
  }
}

function getCsvObj(file) {
  var reader = new FileReader();
  reader.onload = function(){
    var csvArray = readCSV(this.result);
    if (checkValidData(csvArray)) {
      csvArrayToObject(csvArray);
      haveCSV = true;
      updateSvg();
    } else {
      console.log("CSV validation failed.");
      haveCSV = false;
      csvObj = null;
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
    if (!checkTransparent.value.checked) {
      lowColour = evt.target.value;
    }
  } else if (evt.target.id === "midColour") {
    checkTransparent = document.getElementById("midTransparent");
    if (!checkTransparent.value.checked) {
      midColour = evt.target.value;
    }
  } else {
    checkTransparent = document.getElementById("highTransparent");
    if (!checkTransparent.value.checked) {
      highColour = evt.target.value;
    }
  }
  updateSvg();
}

function toggleValAuto(evt) {
  var numInput;

  if (evt.target.id === "lowValAuto") {
    if (evt.target.value.checked) {
      lowVal = undefined;
    } else {
      numInput = document.getElementById("lowValue");
      lowVal = numInput.value;
    }
  } else if (evt.target.id === "midValAuto") {
    if (evt.target.value.checked) {
      midVal = undefined;
    } else {
      numInput = document.getElementById("midValue");
      midVal = numInput.value;
    }
  } else { // high
    if (evt.target.value.checked) {
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
    if (!valEnabled.value.checked) {
      lowVal = evt.target.value;
    }
  } else if (evt.target.id === "midValue") {
    valEnabled = document.getElementById("midValAuto");
    if (!valEnabled.value.checked) {
      midVal = evt.target.value;
    }
  } else { // high
    valEnabled = document.getElementById("highValAuto");
    if (!valEnabled.value.checked) {
      highVal = evt.target.value;
    }
  }
  updateSvg();
}

function toggleMidValEnable(evt) {
  midValEnable = !midValEnable;
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
};

