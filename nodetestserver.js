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
    "css": "text/css"};

http.createServer(function (req, res) {
  
  var uri = url.parse(req.url).pathname;
  var filename = path.join(process.cwd(), unescape(uri));
  var stats;

  try {
    stats = fs.lstatSync(filename); // throws if path doesn't exist
  } catch (e) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('404 Not Found\n');
    res.end();
    return;
  }
  
  if (stats.isFile()) {
    // path exists, is a file
    var mimeType = mimeTypes[path.extname(filename).split(".").reverse()[0]];
    res.writeHead(200, {'Content-Type': mimeType} );

    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(res);
  } else if (uri == "/") {
    
    res.writeHead(200, {'Content-Type': 'text/html'});
    
    var widgetUrl = 'http://' +
     process.env.C9_PROJECT + '-' +  process.env.C9_USER +
     '.c9users.io/widget.html';
    var editUrl = 'http://ide.c9.io/' +
     process.env.C9_USER + '/' +
     process.env.C9_PROJECT;
    
    var giturl = getGithubUrl();
    
    res.end(
      '<html><body>' +
      'Your ChiliPeppr Widget can be tested at ' +
      '<a href="' + widgetUrl + '">' +
      widgetUrl + '</a><br><br>\n\n' + 
      'Your ChiliPeppr Widget can be edited at ' +
      '<a href="' + editUrl + '">' +
      editUrl + '</a><br><br>\n\n' + 
      'Your ChiliPeppr Widget Github Url for forking ' +
      '<a href="' + giturl + '">' +
      giturl + '</a><br><br>\n\n' + 
      'C9_PROJECT: ' + process.env.C9_PROJECT + '<br>\n' +
      'C9_USER: ' + process.env.C9_USER + '\n' +
      ''
    );
    
  } else if (stats.isDirectory()) {
    // path exists, is a directory
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('Index of '+uri+'\n');
    res.write('TODO, show index?\n');
    res.end();
  } else {
    // Symbolic link, other?
    // TODO: follow symlinks?  security?
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.write('500 Internal server error\n');
    res.end();
  }
  
  
}).listen(process.env.PORT);

var getGithubUrl = function(callback) {
  // read the git repo meta data to figure this out
  var url = "";
  var data = fs.readFileSync(".git/FETCH_HEAD").toString();
  console.log("git url:", data);
  var re = /.*github.com:/;
  var url = data.replace(re, "");
  url = "http://github.com/" + url;
  console.log("final url:", url);
  return url;
}