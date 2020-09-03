var createError = require('http-errors');
var express = require('express');
var path = require('path');

var cookieParser = require('cookie-parser');

var logger = require('morgan');

const passport = require('passport');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');


//All Routers are declared here 
var accountsRouter = require('./routes/users');
var apiRouter = require('./routes/api');
var shopRouter = require('./routes/shop');


//Database connection and test 
const db = require('./config/database');
try {
  db.authenticate()
  
} catch (error) {
  console.error('Unable to connect to the database:', error);
  
}


const flash = require('connect-flash');
const session = require('express-session');

//Express 
var app = express();


//Passport config and middleware 
require('./config/passport')(passport); 
app.use(passport.initialize()); 
app.use(passport.session()); 



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));// parse application/x-www-form-urlencoded
app.use(bodyParser.json());// parse application/json
app.use(flash()); //to display flash messages 

// Express Session Middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

app.use(express.static('public'))


//Global variable

app.get('*', function(req, res, next){
  res.locals.user = req.session.user || null;
  next();
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));




// view engine setup
app.use('/', express.Router().get('/',(req,res,next)=> {
  res.render('index');
})); //anything starting with '/' such as http://site/
app.use('/accounts', accountsRouter); //anything starting with /accounts such as http://site/accounts 
app.use('/api', apiRouter); //anything starting with /accounts such as http://site/api 
app.use('/shop', shopRouter);


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
