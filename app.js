var express = require('express'),
    session = require('express-session'),
    MongoDBStore = require('connect-mongodb-session')(session),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
//var cookieParser = require('cookie-parser');
    bodyParser = require('body-parser'),
    cors = require('cors'),
    mysql = require('mysql'),
    env = process.env.NODE_ENV || 'development';

config = require('./config')[env];

// myql connection
global.mycon = mysql.createConnection({
 host: config.mysqldb.host,
 user: config.mysqldb.user,
 password: config.mysqldb.password
 database: config.mysqldb.database
});

// init globals
// init the full getStatus object
global.getStatus = {
  'status': {
    'focus': {
      'focusPosition': 0.00000
    },
    'iris': {
      'irisValue': 0.00000,
      'status': 0.00000
    },
    'moveStatus': 'Idle',
    'pTS': 0,
    'position0': 0.000000,
    'position1': 45.000000,
    'position2': 1.000000,
    'presetID': 0,
    'sequence': 0,
    'uTC': 0,
    'zoomStatus': 'Idle',
    'zoomValue': 100,
    'zoomValueMaxAllowed': 1700,
    'inRestrictedArea': false,
    'message': ''
  }
};

// client actions store
global.naMessage = 'Not Acceptable';
global.clientActions = {};
global.lastStatus = 'no change';
global.updateInterval = 1000;
var ptz = require('../app/ptz'),
global.ptz = new ptz()

// define routes
var routes = require('./routes/index'),
    cgibin = require('./routes/cgibin'),
    users = require('./routes/users');

// init app
var app = express();
app.set('x-powered-by', false);

// init backoffice
var store = new MongoDBStore(
   {
      uri: 'mongodb://'+config.database.host+':'+config.database.port+'/connect_mongodb_session_test',
      collection: config.database.db
   });

var corsOptions = {
   origin: 'http://www.viewitdoit.com'
};
app.use(cors(corsOptions));

app.use(require('express-session')({
   secret: '6d729912aa9eb128f052bc8becdba9af6ca9645dbe1bf38909cf32520488787e2c9f55db3b3ff65dad3313e7f5d2c96bf8fa86aaac09a08604126406cc005668',
   cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
   },
   resave: true,
   saveUninitialized: true,
   store: store
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/cgi-bin', cgibin);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
   var err = new Error('Not Found');
   err.status = 404;
   next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
   app.use(function (err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
         message: err.message,
         error: err
      });
   });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
   res.status(err.status || 500);
   res.render('error', {
      message: err.message,
      error: {}
   });
});

app.listen(config.server.port, function () {
   console.log("Express app running on port " + config.server.port);
});

process.on('uncaughtException', function(err) {
  console.log(err);
});

// trigger camera action
var fireCamAction = function(){

  // initialize action at defined interval
  ptz.perfAction();

}

// fire off camera action every one second
setInterval(fireCamAction, updateInterval);

module.exports = app;
