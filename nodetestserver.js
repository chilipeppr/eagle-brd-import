var http = require('http'),
  url = require('url'),
  path = require('path'),
  fs = require('fs');

var mimeTypes = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png", 
  "js": "text/javascript",
  "css": "text/css"
};

http.createServer(function(req, res) {

  var uri = url.parse(req.url).pathname;
  var filename = path.join(process.cwd(), unescape(uri));
  var stats;

  try {
    stats = fs.lstatSync(filename); // throws if path doesn't exist
  }
  catch (e) {
    res.writeHead(404, {
      'Content-Type': 'text/plain'
    });
    res.write('404 Not Found\n');
    res.end();
    return;
  }

  if (stats.isFile()) {
    // path exists, is a file
    var mimeType = mimeTypes[path.extname(filename).split(".").reverse()[0]];
    res.writeHead(200, {
      'Content-Type': mimeType
    });

    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(res);
  }
  else if (uri == "/") {

    res.writeHead(200, {
      'Content-Type': 'text/html'
    });

    var html = getMainPage();

    res.end(html);

  }
  else if (stats.isDirectory()) {
    // path exists, is a directory
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    res.write('Index of ' + uri + '\n');
    res.write('TODO, show index?\n');
    res.end();
  }
  else {
    // Symbolic link, other?
    // TODO: follow symlinks?  security?
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.write('500 Internal server error\n');
    res.end();
  }


}).listen(process.env.PORT);

var generateCpLoadStmt = function() {
  
  // see if we have a backing github url
  // if we do, use it for the chilipeppr.load()
  // if not, we'll have to use the preview url from cloud9
  var url = getGithubUrl();
  
  var js = "";
  
  if (url != null) {
    
    // since we have a github url, use the raw version
    // wa want something like https://raw.githubusercontent.com/chilipeppr/eagle-brd-import/master/auto-generated-widget.html";
    var rawurl = url.replace(/\/github.com\//i, "/raw.githubusercontent.com/");
    rawurl += '/master/auto-generated-widget.html';
    
    js = 'chilipeppr.load(\n' +
      '  "#myDivWidgetInsertedInto",\n' +
      '  "' + rawurl + '",\n' +
      '  function() {\n' +
      '    // Callback after widget loaded into #myDivWidgetInsertedInto\n' +
      '    cprequire(\n' +
      '      "inline:com-chilipeppr-widget-yourname", // the id you gave your widget\n' +
      '      function(mywidget) {\n' +
      '        // Callback that is passed reference to your newly loaded widget\n' +
      '        console.log("My widget just got loaded.", mywidget);\n' +
      '        mywidget.init();\n' +
      '      }\n' +
      '    );\n' +
      '  }\n' +
      ');\n' +
      '';
      
  } else {
    // use preview url from cloud 9.
    // TODO
    js = "No Github backing URL. Not implemented yet.";
  }
  
  return js;
}

var pushToGithub = function() {
  var exec = require('child_process').execFile;
  var cmd = './git-push.sh';

  exec(cmd, null, null, function(error, stdout, stderr) {
    // command output is in stdout
    console.log("stdout:", stdout);
  });
  console.log("Pushed to github");
}

var generateInlinedFile = function() {
  // We are developing a widget with 3 main files of css, html, and js
  // but ChiliPeppr really wants one monolithic file so we have to generate
  // it to make things clean when chilipeppr.load() is called with a single
  // URL to this widget. This file should get checked into Github and should
  // be the file that is loaded by ChiliPeppr.
  var fileCss = fs.readFileSync("widget.css").toString();
  var fileHtml = fs.readFileSync("widget.html").toString();
  var fileJs = fs.readFileSync("widget.js").toString();

  // now inline css
  var re = /<!-- widget.css[\s\S]*?end widget.css -->/i;
  fileHtml = fileHtml.replace(re,
    '<style type=\'text/css\'>\n' +
    fileCss +
    '\n    </style>'
  );

  // now inline javascript
  var re = /<!-- widget.js[\s\S]*?end widget.js -->/i;
  fileHtml = fileHtml.replace(re,
    '<script type=\'text/javascript\'>\n' +
    '    //<![CDATA[\n' +
    fileJs +
    '\n    //]]>\n    </script>'
  );

  // now write out the auto-gen file
  fs.writeFileSync("auto-generated-widget.html", fileHtml);
  console.log("Updated auto-generated-widget.html");

}

var getMainPage = function() {
  var html = "";

  var widgetUrl = 'http://' +
    process.env.C9_PROJECT + '-' + process.env.C9_USER +
    '.c9users.io/widget.html';
  var editUrl = 'http://ide.c9.io/' +
    process.env.C9_USER + '/' +
    process.env.C9_PROJECT;

  var giturl = getGithubUrl();

  html = '<html><body>' +
    'Your ChiliPeppr Widget can be tested at ' +
    '<a target="_blank" href="' + widgetUrl + '">' +
    widgetUrl + '</a><br><br>\n\n' +
    'Your ChiliPeppr Widget can be edited at ' +
    '<a target="_blank" href="' + editUrl + '">' +
    editUrl + '</a><br><br>\n\n' +
    'Your ChiliPeppr Widget Github Url for forking ' +
    '<a target="_blank" href="' + giturl + '">' +
    giturl + '</a><br><br>\n\n' +
    'C9_PROJECT: ' + process.env.C9_PROJECT + '<br>\n' +
    'C9_USER: ' + process.env.C9_USER + '\n' +
    '';

  generateInlinedFile();
  html += '<br><br>Just updated your auto-generated-widget.html file.';
    
  pushToGithub();
  html += '<br><br>Just pushed updates to your Github repo.';
  
  var jsLoad = generateCpLoadStmt();
  html += '<br><br>Sample chilipeppr.load() Javascript for Your Widget\n<pre>' +
    jsLoad +
    '</pre>\n';

  return html;
}

var getGithubUrl = function(callback) {

  // read the git repo meta data to figure this out
  var url = "";
  var path = ".git/FETCH_HEAD";

  if (fs.existsSync(path)) {
    var data = fs.readFileSync(path).toString();
    //console.log("git url:", data);
    data = data.replace(/\s/, "");
    var re = /.*github.com:/;
    var url = data.replace(re, "");
    url = "http://github.com/" + url;
    //console.log("final url:", url);
    return url;
  }
  else {
    return null;
  }

}