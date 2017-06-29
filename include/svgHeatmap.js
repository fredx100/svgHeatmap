"use strict";

var bugfixVersion = 6; // As any features necessary for first release missing are bugs.
var featureVersion = 0; // As features necessary for first release missing.
var version = featureVersion + "." + bugfixVersion;

var haveCSV = false;
var haveSVG = false;
var units = "%";
var csvObj = undefined;
var mySvgDoc = undefined;

function highlight(e) {
  this.style["stroke-width"] = 5;
  this.style.stroke = "red";
}

function lowlight(e) {
  this.style["stroke-width"] = 1;
  this.style.stroke = "black";
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
  csvObj["KEY_" + element[0]] = element[1];
  if (element[1] > csvObj.max) {
    csvObj.max = element[1];
  }
  if (element[1] < csvObj.min) {
    csvObj.min = element[1];
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

// Using data from the global object csvObj, update the SVG element with
// <name> given that element = "KEY_<name>".
function updateSVGByKey (element) {
  if (element.startsWith("KEY_")) {
    var keystring = element.substr(4); // get key string
    var elem = mySvgDoc.getElementById(keystring);

    if (elem !== null) {
      elem.addEventListener("mouseenter", highlight);
      elem.addEventListener("mouseleave", lowlight);
      elem.style.fill = "#0000FF";
      elem.style["fill-opacity"] = (csvObj[element] - csvObj.min) * csvObj.rangeFactor;

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

// TODO: Modify this to work.
// TODO: upvote if this works!!!
// https://stackoverflow.com/a/32609537/885587
// save SVG
function saveToFile(elem) {
  var svgs = elem.contentDocument.getElementsByTagName("svg");

  if (svgs.length > 0) {
    // Create new link to SVG data
    var a      = document.createElement('a');
    // TODO: The following ALMOST works. However, hashes in the svg header
    // urls break the stream. Manually removing them allows the save to
    // work, but clearly this isn't robust. uncomment() doesn't seem to
    // help - look into this. (Could just write a function to remove
    // them)
    a.href     = 'data:image/svg+xml;utf8,' + svgs[0].outerHTML;
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

window.onload = function () {
  document.getElementById("csvfile").addEventListener("change", handleCsvFileSelect);
  document.getElementById("svgfile").addEventListener("change", handleSvgFileSelect);
  document.getElementById("svgresult").addEventListener("load", registerSvg);
  document.getElementById("version").textContent = "Version " + version;
};

