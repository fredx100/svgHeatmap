# svgHeatmap

This project aims to allow the aapplication of CSV data to a supplied
SVG image. The motivation is to ease the use and re-use of a given SVG
image to create a heatmap or cloropleth from changing/differing data
sets.

There are no external dependencies, which means this project can be used
offline, and (the hope is) that it's easier to trust the code if it's
not fetching libraries from the web.

## Installation

Simply clone or download this repository to your machine.

## Usage

Point your web-browser at the folder containing your copy of this
project (which should load index.htm).

From then on the minimal steps would be to use the appropriate buttons
to load the required SVG and CSV data files, and then clicking on the
save button at the bottom of the page to download the resulting image.

### SVG Creation

The only requirements of the SVG are that the regions which are required
to be programatically filled must have a unique id.

Creating an SVG file is beyond the scope of this project. I would
recommend Inkscape for this job (although virtually any program capable
of producing SVGs will suffice).

In Inkscape the id of a closed path can be set from the "Object
Properties" panel (opened with Ctrl-Shift-O).

### CSV requirements

CSV files can be produced from virtually any spreadsheet program.
LibreOffice Calc, is one example. Microsoft Excel would also work, at a
pinch.

The CSV file must have rows consisting of
\<Region name\>, \<region value\>
pairs. Provided the Region name matches (case-sensitive) exactly with an
id from the SVG the region value will be applied.

Empty rows and rows not in this format are ignored.

## Known Limitations

At the time of writing this, the project has only been successfully
tested on the Firefox web browser (v54.0.1). Edge is known not to work
and chrome/opera/any other you can think of is untested.

