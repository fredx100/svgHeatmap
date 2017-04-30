<html>
  <head>
    <link rel="stylesheet" type="text/css" href="style.css">

    <script>
      var haveCSV = false;
      var haveSVG = false;
      var units = '%';
      var csvObj;
      var svgDoc;

      function highlight(e) {
        this.style['stroke-width'] = 5;
        this.style.stroke = "red";
      }
      function lowlight(e) {
        this.style['stroke-width'] = 1;
        this.style.stroke = "black";
      }
      function init(name) {
        elem.addEventListener("mouseenter", highlight);
        elem.addEventListener("mouseleave", lowlight);
      }

      $(document).ready(function() {
        // TODO: HARDCODED SVG!!! Remove.
        var svg = document.getElementById("map");
        svgDoc = svg.getSVGDocument();
        haveSVG = true;

         $('#csvfile').bind('change', handleCsvFileSelect);
      });

      function getCSVArray(file) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function(event){
          var csv = event.target.result;
          var csvArray = $.csv.toArrays(csv);

          if (checkValidData(csvArray)) {
            csvArrayToObject(csvArray);
            haveCSV = true;
            updateSVG();
          } else {
            haveCSV = false;
            csvData = null;
          }
        };
        reader.onerror = function(){ alert('Unable to read ' + file.fileName); };
      }
      // checkValidData
      //
      // Checks that the CSV data is applicable and if so converts it into an object.
      function checkValidData(csvArray)) {
        var valid = true;

        for(var row in csvArray) {
          // At least two elements per row
          if ((csvArray[row].length == 0) ||
             (csvArray[row].length < 2)) {
            valid = false;
            alert('CSV data must have at least 2 entries per row (ID, and value).');
            break;
          }
          // First element not undefined
          if ((csvArray[row].length != 0) &&
             (!(0 in csvArray[row]) ||
              (csvArray[row][0] == ''))) {
            valid = false;
            alert('CSV data must have non-empty 1st column (ID).');
            break;
          }
          // Second element numeric
          if (!$.IsNumeric(csvArray[row][1])) {
            valid = false;
            alert('CSV data must have numeric 2ns column (value).');
            break;
          }
        }

        return valid;
      }
      // Convert csvArray to an Object at csvObj
      function csvArrayToObject(csvArray) {
        if (valid) {
          csvObj = {min:Infinity,max:-Infinity};

          for(var row in csvArray) {
            csvObj['KEY_' + csvArray[row][0]] = csvArray[row][1];
            if (csvArray[row][1] > csvObj.max)
              csvObj.max = csvArray[row][1];
            if (csvArray[row][1] < csvObj.min)
              csvObj.min = csvArray[row][1];
          }

          // Set csvObj.rangeFactor. This is set such that
          // rf * (csvObj.name - csvObj.min) is contained in [0,255]
          csvObj['rangeFactor'] = 255 / (csvObj.max - csvObj.min);
        }
      }
      function updateSVG() {
        if (haveSVG && haveCSV) {
          for(var key in csvObj) {
            if (key.startsWith('KEY_')) {
              keystring = key.substr(4); // get key string
              // TODO: update svg
            }
          }
        }
      }
      function setRegionVal(name) {
        var elem = svgDoc.getElementById(name);
        elem.title = name + csvObj['KEY_' + name] + ' ' + units; // Set title
        var opacity = (csvObj.name - csvObj.min) * csvObj.rangeFactor;
        // TODO: use opacity as the coefficient of some colour
        // (global?).
        elem.style['fill'] = '#0000ff';
      }

      function handleCsvFileSelect(evt) {
        var file = evt.target.csvfile; // FileList object
        getCSVArray(file); // read the file contents
      }
    </script>
  </head>
  <body onload='init("C")'>
    <div id="inputs" class="section">
      Select SVG image
      <input type="file" id="SVG file" name="svgfile" style="background:lightgrey"/><br/>
      Select CSV data
      <input type="file" id="CSV file" name="csvfile"  style="background:lightgrey"/>
    </div>
    <div id="output" class="section">
      <embed id="map" src="test.svg" width=600 height=600/>
    </div>
  </body>
</html>

</-- vim: set shiftwidth=2  -->
