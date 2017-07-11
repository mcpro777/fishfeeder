var express = require('express');
var bodyParser = require('body-parser');
var Auth = require('./auth.js');
var auth = Auth.auth;
var services = require('./services.js');
var proxy_request = require('./proxy-request.js');
var request = require('request');

// Create server
var app = express();

// Configure middleware
app.use(bodyParser.json()); // for parsing appplication/json
app.use(function logRequest (req, res, next) {
    //console.log('Received request: ' + req.url);
    return next();
});

// Configure static files
app.use(express.static('app'));

// Login route
app.post('/login', Auth.login);

// Ping route to check auth
app.head('/ping', auth, function (req, res, next) {
    return res.sendStatus(200);
});

// config routes (unique to master pi)
app.get('/config', auth, services.getConfig);
app.put('/config', auth, services.updateConfig);

// temp & humidity sensor (only for master)
app.get('/th', auth, services.readTempAndHumidity);

// Services which also exist on secondary servers (and therefore should be proxied)
app.get('/wt', auth, proxy_request, services.readWaterTemp);
app.post('/light/on', auth, proxy_request, services.turnLightsOn);
app.post('/light/off', auth, proxy_request, services.turnLightsOff);
app.post('/feeder/start', auth, proxy_request, services.startFeeder);
app.post('/feeder/stop', auth, proxy_request, services.stopFeeder);
app.get('/feed/max', auth, proxy_request, services.getMaxFeed);
app.post('/feed/max', auth, proxy_request, services.saveMaxFeed);
app.get('/schedule', auth, proxy_request, services.getSchedule);
app.post('/schedule', auth, proxy_request, services.createSchedule);
app.put('/schedule/:id', auth, proxy_request, services.updateSchedule);
app.delete('/schedule/:id', auth, proxy_request, services.deleteSchedule);

app.get('/camImage', function(req, res) {
	var ip = req.query.ip;
	var url = 'http://' + ip + ':81/html/cam_pic.php';

        request({
            url: url,
            auth: {
		'user': 'pi',
		'password': 'aquaponics',
		'sendImmediately': false
	    }
        }).pipe(res);
});

// error handler
app.use(function errorHandler(err, req, res, next) {
    res.status(500).json({'error': 'An error occurred ' + err});
});

app.listen(80, function listen () {
   console.log("Master Server listening at port 80.");
});
