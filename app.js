require("dotenv").config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var admin = require("firebase-admin");


var fireBaseAdminConfig = require("./key.json")

admin.initializeApp({
  credential: admin.credential.cert(fireBaseAdminConfig)
})
const db = admin.firestore();

db.collection("General").doc("AppInfo").get()
.then(record => {
    db.collection("General").doc("AppInfo").set({
      currentConfess: !record.data() ? 0 : record.data().currentConfess,
      isOpen: !record.data() ? true : record.data().isOpen,
      pageID: !record.data() ? process.env.pageID : record.data().pageID,
      accessToken: !record.data() ? process.env.accessToken : record.data().accessToken,
      adminUsername: process.env.ADMIN_USERNAME || "admin",
      adminPassword: process.env.ADMIN_PASSWORD || "admin"
    })
    console.log("Reloaded Database Success")
})

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

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

