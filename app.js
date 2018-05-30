var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var settings = require('./settings');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session)
var flash = require('connect-flash')
var multer  = require('multer');
var fs = require('fs'); // 引入文件系统
var accessLog = fs.createWriteStream('access.log', {flags: 'a'}); // 保存文件
var errorLog = fs.createWriteStream('error.log', {flags: 'a'}); // 保存文件
var exphbs  = require('express-handlebars');

var app = express();

// view engine setup
//app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
/*
app.engine('hbs', exphbs({
    layoutsDir: 'views',
    defaultLayout: 'layout',
    extname: '.hbs'
}));*/
//app.set('view engine', 'hbs')
app.use(flash())
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(session({
    secret: settings.cookieSecret,
    key: settings.db,
    cookie: {maxAge:1000*60*60*24*30},
    store: new MongoStore({
        db: settings.db,
        host: settings.host,
        port: settings.port
    })
}))
// 文件上传插件
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/user')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
var upload = multer({ storage: storage });
var cpUpload = upload.any();
app.use(cpUpload);

app.use(logger('dev'));
app.use(logger({stream: accessLog}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(function (err, req, res, next) {
    var meta = '[' + new Date() + '] ' + req.url + '\n';
    errorLog.write(meta + err.stack + '\n');
    next();
});
//app.use('/', routes); 官方给出了最简单的路由分配，然后再去index.js中招到对应的路由函数，最终实现路由功能
//app.use('/users', users);修改后app.js里只有一个总的路由接口
routes(app)
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
app.listen(app.get('port'), function() {
    console.log('lzmlzmlzm----------------Express server listening on port ' + app.get('port'));
});

module.exports = app;
