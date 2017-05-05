var haveCSV = false;
var haveSVG = false;
var units = "%";
var csvObj = undefined;
var mySvgDoc = undefined;

function highlight(e) {
  "use strict";
  this.style["stroke-width"] = 5;
  this.style.stroke = "red";
}

function lowlight(e) {
  "use strict";
  this.style["stroke-width"] = 1;
  this.style.stroke = "black";
}

function initSvg(name) {
  "use strict";
  var textElem = document.getElementById("svglistener");
  textElem.innerText = "Apply listener... (" + haveSVG + ")";
  if (haveSVG) {
    var elem = mySvgDoc.getElementById(name);
    elem.addEventListener("mouseenter", highlight);
    elem.addEventListener("mouseleave", lowlight);
    elem.style.fill = "#0000FF";

    // Debug
    textElem = document.getElementById("svglistener");
    textElem.innerText = "Listener applied. (" + haveSVG + ")";
  } else {
    textElem = document.getElementById("svglistener");
    textElem.innerText = "Listener not applied. (" + haveSVG + ")";
  }
}

function handleSvgFileSelect(evt) {
  "use strict";
  var file = evt.target.value; // FileList object
  var elem = document.getElementById("svgresult");
  elem.data = file;
}

function registerSVG(evt) {
  mySvgDoc = evt.target.contentDocument;
  var telem = document.getElementById("svgdoc");
  if (mySvgDoc !== null) {
    haveSVG = true;
    telem.innerText = "mySvgDoc retrieved.";
  } else {
    haveSVG = false;
    telem.innerText = "mySvgDoc null.";
  }
  // TODO: debug
  telem = document.getElementById("svglistener");
  telem.innerText = "Listening... (" + haveSVG + ")";
  initSvg("C");

}

// Check that a row of the csvData is valid.
function checkRowValid(element, index) {
  "use strict";
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
  if (!$.IsNumeric(element[1])) {
    this.valid = false;
    alert("CSV row " + index + ", (" + element[1] + ") : data must have numeric 2nd column (value).");
  }
}

// checkValidData
//
// Checks that the CSV data is applicable and if so converts it into an object.
function checkValidData(csvArray) {
  "use strict";
  csvArray.valid = true;

  csvArray.forEach(checkRowValid, csvArray);

  return csvArray.valid;
}

// Convert an array row to an element
function csvRowToElement(element) {
  "use strict";
  csvObj["KEY_" + element[0]] = element[1];
  if (element[1] > csvObj.max) {
    csvObj.max = element[1];
  }
  if (element[1] < csvObj.min) {
    csvObj.min = element[1];
  }
}

// Convert csvArray to an Object at csvObj
function csvArrayToObject(csvArray) {
  "use strict";
  csvObj = {min:Infinity,max:-Infinity};

  csvArray.forEach(csvRowToElement);

  // Set csvObj.rangeFactor. This is set such that
  // rf * (csvObj.name - csvObj.min) is contained in [0,255]
  csvObj.rangeFactor = 255 / (csvObj.max - csvObj.min);
}

function updateSVGByKey (element) {
  "use strict";
  if (element.startsWith("KEY_")) {
    var keystring = element.substr(4); // get key string
    // TODO: update svg
  }
}

function updateSvg() {
  "use strict";
  if (haveSVG && haveCSV) {
    csvObj.forEach(updateSVGByKey);
  }
}

function getCsvArray(file) {
  "use strict";
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function(event){
    var csv = event.target.result;
    var csvArray = $.csv.toArrays(csv);

    if (checkValidData(csvArray)) {
      csvArrayToObject(csvArray);
      haveCSV = true;
      updateSvg();
    } else {
      haveCSV = false;
      csvObj = null;
    }
  };
  reader.onerror = function(){ alert("Unable to read " + file.fileName); };
}

function handleCsvFileSelect(evt) {
  "use strict";
  var file = evt.target.value; // FileList object
  getCsvArray(file); // read the file contents
}

function setRegionVal(name) {
  "use strict";
  var elem = mySvgDoc.getElementById(name);
  elem.title = name + csvObj["KEY_" + name] + " " + units; // Set title
  var opacity = (csvObj.name - csvObj.min) * csvObj.rangeFactor;
  // TODO: use opacity as the coefficient of some colour
  // (global?).
  elem.style.fill = "#0000ff";
}

window.onload = function () {
  "use strict";
  document.getElementById("csvfile").addEventListener("change", handleCsvFileSelect);
  document.getElementById("svgfile").addEventListener("change", handleSvgFileSelect);
  document.getElementById("svgresult").addEventListener("load", registerSVG);
};

// vim: shiftwidth=2 fdm=syntax
