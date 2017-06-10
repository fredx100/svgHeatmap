// csv.js
//
// A parser of csv files as specified by rfc4180:
// https://www.ietf.org/rfc/rfc4180.txt
//
// The intention is that reading of all of rfc4180 is implemented, with
// the relaxation that it is not necessary that all records have the
// same number of fields.

"use strict";

// getNextElement
//
// Extracts the next element in the row from file and inserts it into
// csv.elem. The csv.nextRow and csv.nextCol are updated according to
// csv.row and csv.col and which field termination character is found.
function getNextElement (csv) {
    var mode = "normal";
    var elemEnd = 0;
    csv.elem = "";

    while ((elemEnd === 0) && (csv.content.length > 0)) {
        switch (mode) {
            case "quote":
                if (csv.content[0] === "\"") {
                    if ((csv.content.length > 1) &&
                        (csv.content[1] === "\"")) {
                        csv.elem += "\"";
                        csv.content = csv.content.substring(2);
                    } else {
                        // End quoted string
                        csv.content = csv.content.substring(1);
                        mode = "normal";
                    }
                } else {
                    csv.elem += csv.content[0];
                    csv.content = csv.content.substring(1);
                }
                break;

            default:
                if (csv.content[0] === "\"") {
                    // Begin quoted string
                    mode = "quote";
                    csv.content = csv.content.substring(1);
                } else if (csv.content[0] === ",") {
                    // Element end
                    csv.content = csv.content.substring(1);
                    csv.nextCol = csv.col + 1;
                    elemEnd = 1;
                } else if (csv.content[0] === "\n") {
                    // Row end
                    csv.content = csv.content.substring(1);
                    csv.nextRow = csv.row + 1;
                    csv.nextCol = 0;
                    elemEnd = 1;
                } else {
                    // Read char
                    csv.elem += csv.content[0];
                    csv.content = csv.content.substring(1);
                }
        }
    }
}

// readCSV
//
// Main entry function. Processes passed fileContent and returns
// contents in array, according to [row][column] indices.
function readCSV (fileContent) {
    var array = [];
    var csv = {content:fileContent,
               elem:"",
               row:0,
               col:0,
               nextRow:0,
               nextCol:0,
               apply:function (a) {
                   if (this.col === 0) {
                       // If we're starting a new row, initialise thiw "row" to
                       // be an array.
                       a[this.row] = [];
                   }
                   a[this.row][this.col] = this.elem;
                   this.row = this.nextRow;
                   this.col = this.nextCol;
               }};

    while (csv.content.length !== 0) {
        getNextElement (csv);
        csv.apply(array);
    }

    return array;
}

