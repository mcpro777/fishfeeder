var express = require('express');
var bodyParser = require('body-parser');
var services = require('./services.js');
var config = require('./config.js');

// Create server
var app = express();

// Configure middleware
app.use(bodyParser.json()); // for parsing appplication/json
app.use(function logRequest (req, res, next) {
    console.log('Received request: ' + req.url);
    return next();
});

/*
app.all('/', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
});

app.options('*', function (req, res, next) {
    return res.sendStatus(200);
});
*/

app.get('/th', services.readTempAndHumidity);
app.get('/wt', services.readWaterTemp);
app.post('/light/on', services.turnLightsOn);
app.post('/light/off', services.turnLightsOff);
app.post('/feeder/start', services.startFeeder);
app.post('/feeder/stop', services.stopFeeder);
app.get('/feed/max', services.getMaxFeed);
app.post('/feed/max', services.saveMaxFeed);
app.get('/schedule', services.getSchedule);
app.post('/schedule', services.createSchedule);
app.put('/schedule/:id', services.updateSchedule);
app.delete('/schedule/:id', services.deleteSchedule);

// error handler
app.use(function errorHandler(err, req, res, next) {
    res.status(500).json({'error': 'An error occurred ' + err});
});

app.listen(config.secondaryPort, function listen () {
   console.log("Secondary server listening at port " + config.secondaryPort);
});
