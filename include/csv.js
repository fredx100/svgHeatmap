String.prototype.findUnescaped = function (pattern, startPos) {
    patternPos = this.indexOf(pattern, startPos);
    if (patternPos !== startPos) {
        while (this[patternPos - 1] === '\\') {
            startPos = patternPos + 1;
            patternPos = this.indexOf(pattern, startPos);
            if (patternPos === -1) {
                break;
            }
        }
    }
    return patternPos;
}

// getNextElement
//
// Extracts the next element in the row from file. If no such element
// exists, null is returned.
function getNextElement (csv) {
    var mode = "normal";
    var oldMode;
    var elemEnd = 0;
    csv.elem = '';

    while ((elemEnd === 0) && (csv.content.length > 0)) {
        switch (mode) {
            case "quote":
                if (csv.content[0] === '\\') {
                    // Escape sequence
                    mode = "esc";
                    oldMode = "quote";
                    csv.content = csv.content.substring(1);
                } else if (csv.content[0] === '"') {
                    // End quoted string
                    csv.content = csv.content.substring(1);
                    mode = "normal";
                } else {
                    csv.elem += csv.content[0];
                    csv.content = csv.content.substring(1);
                }
                break;

            case "esc":
                csv.elem += csv.content[1];
                csv.content = csv.content.substring(1);
                mode = oldMode;
                break;

            default:
                if (csv.content[0] === '\\') {
                    // Escape sequence
                    mode = "esc";
                    oldMode = "normal";
                    csv.content = csv.content.substring(1);
                } else if (csv.content[0] === '\\') {
                    // Begin quoted string
                    mode = "quote";
                    csv.content = csv.content.substring(1);
                } else if (csv.content[0] === ',') {
                    // Element end
                    csv.content = csv.content.substring(1);
                    csv.nextCol = csv.col + 1;
                    elemEnd = 1;
                } else if (csv.content[0] === '\n') {
                    // Row end
                    csv.content = csv.content.substring(1);
                    csv.nextRow = csv.row + 1;
                    csv.nextCol = -1;
                    elemEnd = 1;
                } else {
                    // Read char
                    csv.elem += csv.content[0];
                    csv.content = csv.content.substring(1);
                }
        }
    }
}

function readCSV (fileContent) {
    var array = [];
    var csv = {content:fileContent,
               elem:'',
               row:0,
               col:0,
               nextRow:0,
               nextCol:0,
               apply:function (a) {
                   if (this.elem !== '') {
                       if (this.col === 0) {
                           // If we're starting a new row, initialise thiw "row" to
                           // be an array.
                           a[this.row] = [];
                       }
                       a[this.row][this.col] = this.elem;
                       this.row = this.nextRow;
                       this.col = this.nextCol;
                   }
               }}

    while (csv.content.length !== 0) {
        getNextElement (csv);
        csv.apply(array);
        /* if (csv.elem !== null) {
            if (csv.col === 0) {
                // If we're starting a new row, initialise thiw "row" to
                // be an array.
                array[csv.row] = [];
            }
            array[csv.row][csv.col] = csv.elem;
            csv.row = csv.nextRow;
            csv.col = csv.nextCol;
        } */
    }

    return array;
}

