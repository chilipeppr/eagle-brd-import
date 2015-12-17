# eagle-brd-import

A ChiliPeppr widget that lets you drag-n-drop an Eagle BRD file so you can mill 
it out.

## ChiliPeppr Widget

This is a widget for ChiliPeppr. It is based on a monolithic HTML file that 
contains CSS, Javascript, and HTML. You should edit widget.html to represent 
your content and functionality.

### Running / Testing

This widget can be run from Cloud9 by launching the nodetestserver.js Test Web 
Server by right-clicking the file and choosing "Run" and then navigating to the 
non-SSL URL of 
```
http://yourworkspace-youruser.c9users.io/widget.html
```

To run this widget from ChiliPeppr you should use the following command:
```
chilipeppr.load(
    "#myDivToInsertContentInto", 
    "http://yourworkspace-youruser.c9users.io/widget.html", 
    function() { 
        /* This is the callback function called after the 
        load is complete. You typically place code that 
        finds your widget library that would now be in 
        memory via cprequire() 
        */ 
    } 
);
```

Keep in mind that SSL does not work for ChiliPeppr yet since so many files and 
URL pointers point to non-SSL URL's. If you try to pull up your widget via SSL 
you get a bunch of errors due to the mixed SSL and non-SSL. So, just a heads up.
