#!/usr/bin/awk -f

# Converts data in "Multipolygon,name,code" csv format to svg.
# The csv format must use ';' as a field separator.

BEGIN {
    FS = ";"
    print_svg_upfront_boilerplate();

    # The following dictates how shrunk the output is. A high scaling
    # will give small output - meaning Inkscape's "simplify path" will
    # remove more points.
    # 
    # If this is too small, the output will have coordinates that are
    # too large for inkscape to handle (it gets confused if > ~350k). If
    # this is too small, simplify won't reduce the file size enough and
    # the stroke width will be too large.
    scaling = 200;
}

END {
    print "  </g>";
    print "</svg>";
    print "<!-- limits: (" limits["smallx"],limits["smally"] "), (" limits["largex"],limits["largey"] ") -->";
}

{
    delete polygons
    delete splitpoly
    polyidx = 0;

    #   print "0:",$1
    if ((startpos = index($1,"(((")) > 0) {
        # Discard leading "(" to simplify logic
        $1 = substr($1, startpos + 1, length($1) - startpos);
    }

    # While polygon
    while ((endpos = index($1,"))")) > 0) {
        startpos = index($1,"((");
        polygon = substr($1, startpos + 2, endpos - (startpos + 2));
        $1 = substr($1, endpos + 2, length($1) - (endpos + 1));

        # Mark boundary of grouped polygons
        #
        # This is then used in print_integers, below.
        # Note: we use TWO markers, to preserve the parity of the index
        #       with regards to x/y values.
        while ((endpos = index(polygon,"),(")) > 0) {
            polygon = substr(polygon, 1, endpos - 1) " X1 X2 " substr(polygon, endpos + 3, length(polygon) - endpos - 2);
        }

        # Save the polygon
        polygons[polyidx++] = polygon;
    }

    # Print to svg
    #
    # Multiple grouped polygons are printed out as separate paths within
    # a single group, which has the given id. Single polygons are
    # printed as a single path with the given id.
    if (polyidx != 0) {
        if (polyidx > 1) {
            print "    <g id=\"" $3 "\" title=\"" $2 "\">"
            for (i in polygons) {
                print "      <path id=\"" $3 "-" i "\"";
                printf "            d=\"M";
                split(polygons[i], splitpoly, /[, ]/);
                print_integers(splitpoly, "                ", limits);
                print " Z\"/>";
            }
            print "    </g>"
        } else {
            print "    <path id=\"" $3 "\"";
            print "          title=\"" $2 "\"";
            printf "          d=\"M";
            split(polygon, splitpoly, /[, ]/);
            print_integers(splitpoly, "              ", limits);
            print " Z\"/>";
        }
    }
}

# Take an array of decimals and print all of the integer parts, space
# separated, 10 to a line.
function print_integers(splitpoly, indent, limits) {
    for (j in splitpoly) {
        if (splitpoly[j] == "X1") {
            # Start of a new polygon
            printf " z M"
        } else if (splitpoly[j] != "X2") {
            # Remove fractional part
            splitpoly[j] = int(splitpoly[j]) / scaling;

            # Invert y and record limits
            if ((j % 2) == 1) {
                # Looking at x coord
                if ((splitpoly[j]+0) < (limits["smallx"]+0))
                    limits["smallx"] = splitpoly[j];
                if ((splitpoly[j]+0) > (limits["largex"]+0))
                    limits["largex"] = (splitpoly[j]+0);
            } else {
                # Invert y (svg has positive y-axis pointing downwards)
                splitpoly[j] = -splitpoly[j];

                # Looking at y coord
                if (splitpoly[j] < limits["smally"])
                    limits["smally"] = splitpoly[j];
                if (splitpoly[j] > limits["largey"])
                    limits["largey"] = splitpoly[j];
            }

            # print
            printf (" %s", splitpoly[j]);

            # line break after 10 values
            if ((j != 0) && ((j + 1) in splitpoly) && ((j % 10) == 0)) {
                printf "\n" indent;
            }
        }
    }
}

function print_svg_upfront_boilerplate() {
    print "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>"
    print "<svg"
    print "   xmlns:dc=\"http://purl.org/dc/elements/1.1/\""
    print "   xmlns:cc=\"http://creativecommons.org/ns#\""
    print "   xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\""
    print "   xmlns:svg=\"http://www.w3.org/2000/svg\""
    print "   xmlns=\"http://www.w3.org/2000/svg\""
    print "   version=\"1.1\""
    print "   id=\"svg\">"
    print "  <g id=\"style-group\" style=\"fill:#00BB10;fill-rule:evenodd;stroke:#000000;stroke-width:1px\">"
}
