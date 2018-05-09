var express = require('express');
var cors = require('cors')
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var engine = require('./engine');
var index = require('./routes/index');
var squads = require('./routes/squads');
var debug = require('./routes/debug');
var dscontrol = require('./routes/dscontrol');
var deathstar = require('./routes/deathstar');
var reactorCore = require('./routes/reactorCore');
var tieFighters = require('./routes/tieFighters');
var logs = require('./routes/logs');
var spy = require('./routes/spy');
var shield = require('./routes/shield');
var fueltank = require('./routes/fuelTank');
var cron = require('node-cron');

var app = express();
app.use(cors())
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended : false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/squads', squads);
app.use('/dscontrol', dscontrol);
app.use('/reactorCore', reactorCore);
app.use('/fighters', tieFighters);
app.use('/deathstar', deathstar);
app.use('/logs', logs);
app.use('/spy', spy);
app.use('/shield', shield);
app.use('/debug', debug);
app.use('/fueltank', fueltank);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
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
engine.update();
cron.schedule('* * * * *', function() {
	engine.update();
});

module.exports = app;
