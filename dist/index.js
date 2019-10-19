"use strict";

var _express = _interopRequireDefault(require("express"));

var _multer = _interopRequireDefault(require("multer"));

var _fs = require("fs");

var _path = require("path");

var _crypto = require("crypto");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/** TODO:
 * let user input number of views
 * tests
 * for pictures: display as an html inline
 * style (?)
 * babel config + npm start script
*/
var sqlite = require('sqlite3');

var storage = _multer["default"].diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, (0, _path.join)(_dirname, 'uploads'));
  },
  filename: function filename(req, file, cb) {
    console.log(file.originalname);
    var originalTypeEnd = file.originalname.split('.').pop();
    cb(null, "".concat((0, _crypto.randomBytes)(16).toString('base64'), ".").concat(originalTypeEnd));
  }
});

var filenameRegEx = /[^\\/]+\.[^\\/]+$/;

var _dirname = (0, _path.resolve)();

var db = new sqlite.Database((0, _path.join)(_dirname, 'db.sqlite'));
var app = (0, _express["default"])();
app.use(_express["default"]["static"]('static'));
app.set('views', (0, _path.join)(_dirname, 'views'));
app.set('view engine', 'ejs');
var upload = (0, _multer["default"])({
  storage: storage
});
app.get('/', function (req, res) {
  res.render('index');
});
app.get('/getfile', function (req, res) {
  var fileName = req.query.filename;
  console.log(fileName);

  if (!fileName.match(filenameRegEx)) {
    // error: invalid file name!
    res.render('error', {
      err: 'invalid name'
    });
    return;
  }

  var maybePath = (0, _path.join)(_dirname, '/uploads', fileName);
  console.log("path given: ".concat(maybePath));
  (0, _fs.exists)(maybePath, function (exists) {
    if (!exists) {
      res.render('error', {
        err: 'not found'
      });
      return;
    }

    res.sendFile(maybePath).then(function (re, rj) {
      (0, _fs.unlink)(maybePath);
    });
  });
});
app.post('/fileupload', upload.single('file'), function (req, res) {
  console.log(req.file);
  res.render('upload', {
    url: "/getfile/".concat(req.file.filename)
  });
});
app.listen(8080, function () {
  db.serialize(function () {
    db.run("create table if not exists files(filename text primery key, maxViews integer)");
    console.log('init db');
  });
  console.log('on 8080!');
});