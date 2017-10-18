#!/usr/bin/gawk -f

# Converts data in "Multipolygon,name,code" csv format to svg.

BEGIN {
   FPAT = "([^,]*)|(\"[^\"]*\")"
}

{
   print "0:",$1
   if ((startpos = index($1,"(((")) > 0) {
      # Discard leading "(" to simplify logic
      $1 = substr($1, startpos + 1, length($1) - startpos);
   }

   # While polygon
   while ((endpos = index($1,"))")) > 0) {
      startpos = index($1,"((");
      polygon = substr($1, startpos + 2, endpos - (startpos + 2));
      print "1:",$1;
      $1 = substr($1, endpos + 2, length($1) - (endpos + 1));
      print "2:",polygon;
   }
#v  foreach polygon
#      while \exists hole
#         get both holes
#         pick bigger of first two polygons, by bounding box, discarding second
#      put polygons into array
#
#   if multiple polygons
#      print "  <g id=\"" $3 "\" title=\"" $2 "\">"
#      for each polygon
#         print "    <path id=\"\""
#      print "  </g>"
#   else
#      print "  <path id=\"" $3 "\" title=\"" $2 "\">"
}


