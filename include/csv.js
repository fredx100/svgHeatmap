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

    csv.elem = null;
    while ((csv.elem === null) && (csv.content !== '')) {
        if (csv.content[0] === '\n') {
            csv.elem = null;
            csv.content = csv.content.substring(1);
            csv.row += 1;
            csv.col = -1;
        } else if (csv.content[0] === '"') {
            // Find matching (unescaped) quote.
            quotePos = csv.content.findUnescaped('"', 1);

            // Extract between quotes and return.
            if (quotePos === -1) {
                csv.elem = csv.content.substring(1);
                csv.content = '';
            } else {
                csv.elem = csv.content.substring(1,quotePos - 1);
                csv.content = csv.content.substring(quotePos + 1);
            }
            csv.row += 1;
        } else {
            var commaPos = csv.content.findUnescaped(',', 0);
            var newLinePos = csv.content.findUnescaped('\n', 0);

            // There is something prior to next \n
            var sepPos;
            if (newLinePos === -1) {
                sepPos = commaPos;
            } else if ((commaPos === -1) || (newLinePos < commaPos)) {
                sepPos = newLinePos;
            } else {
                sepPos = commaPos;
            }

            if (sepPos === -1) {
                csv.elem = csv.content;
                csv.content = '';
            } else {
                csv.elem = csv.content.substring(0, sepPos);
                csv.content = csv.content.substring(sepPos + 1);
            }
            csv.row += 1;
        }
    }
}

function readCSV (fileContent) {
    var array = [];
    var csv = {content:fileContent;
               elem:null;
               row:0;
               col:0;}

    while (csv.content.length !== 0) {
        getNextElement (csv);
        if (csv.elem !== null) {
            if (csv.col === 0) {
                // If we're starting a new row, initialise thiw "row" to
                // be an array.
                array[csv.row] = [];
            }
            array[csv.row][csv.col] = elem;
        }
    }

    return array;
}

