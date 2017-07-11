var child_process = require('child_process');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var config = require('./config.js');

module.exports = (function Services () {
    // need to save the feed process so it can be killed by a second rest call if it doesn't exit by itself
    var feedProcess = null;

    function saveLog (message) {
        MongoClient.connect(config.connectionString, function (err, db) {
            if (err) {
                console.error('error connecting to mongodb');
                console.error(err);
                return next(err);
            }

            var log = {id: new Date(), message: message};
            db.collection('logs').insertOne(log, function (err, results) {
                if (err) {
                    console.error(err);
                    db.close();
                }
                db.close();
            });
       });
    }

    function readTempAndHumidity (req, res, next) {
        //console.log('Calling thsensor python script');
        var proc = child_process.spawn('python', [__dirname + '/python/Adafruit_Python_DHT/examples/thsensor2.py']);

        proc.stdout.on('data', function receiveTHData (data) {
            data = data.toString();
            //console.log('got data from python script');
            //console.log(data);
            var temp = null;
            var hum = null;
            if (data) {
                data = data.split('C ');
                temp = (data[0] + 'C').replace('Temp: ', '');
                hum = (data[1] || '').replace('Humidity: ', '');
            }
           
            var numeric = parseFloat(temp);
            var fahrenheit = isNaN(numeric) ? null : numeric * 1.8 + 32;

            var result = {
                temperature_celsius: temp,
                temperature_fahrenheit: fahrenheit ? fahrenheit + ' F' : null,
                humidity: hum
            };
            //console.log(result);
            return res.json(result);
        });
    }

    function readWaterTemp (req, res, next) {
        //console.log('Calling wt python script');
        var proc = child_process.spawn('python', [__dirname + '/python/temp.py']);

        proc.stdout.on('data', function receiveWTData (data) {
            data = data.toString();
            //console.log('got data from python script');
            //console.log(data);
            var temp = null;
            if (data) {
                temp = data;
            }
           
            var fahrenheit = temp;

            var result = {
                temperature_fahrenheit: fahrenheit
            };
            //console.log(result);
            return res.json(result);
        });
    }

    function turnLightsOn (req, res, next) {
        console.log('Turning light on');

        var proc = child_process.spawn('python', [__dirname + '/python/pin20on.py']);
        proc.on('close', function closeLightOnProcess (code) {
            return res.json({
                code: code
            });
        });
    }

    function turnLightsOff (req, res, next) {
        console.log('Turning light off');
        
        var proc = child_process.spawn('python', [__dirname + '/python/pin20off.py']);
        proc.on('close', function closeLightOnProcess (code) {
            return res.json({
                code: code
            });
        });
    }
   
    function getFeedCount(callback) {
        MongoClient.connect(config.connectionString, function (err, db) {
            if (err) {
                console.error('error connecting to mongo db');
                console.error(err);
                return callback(err);
            }

            var currentDate = new Date();
            var dateKey = currentDate.getDate() + '-' + currentDate.getMonth() + '-' + currentDate.getFullYear();

            db.collection('feedcount').findOne({id: dateKey}, function(err, feed) {
                if (err) {
                    console.error("error getting current feed count from mongo");
                    console.error(err);
                    return callback(err);
                }
        
                var currentCount = 0;

                if (feed) {
                    currentCount = feed.num;
                }

                db.close();
                return callback(null, currentCount);
            });
        });
    }

    function updateFeedCount(num) {
        MongoClient.connect(config.connectionString, function (err, db) {
            if (err) {
                console.error('error connecting to mongo db');
                console.error(err);
                return false;
            }

            var currentDate = new Date();
            var dateKey = currentDate.getDate() + '-' + currentDate.getMonth() + '-' + currentDate.getFullYear();

            db.collection('feedcount').findOne({id: dateKey}, function(err, feedCount) {
                if (err) {
                    console.error("error getting current feed count from mongo");
                    console.error(err);
                    return false;
                }
        
                var currentCount = 0;
                if (feedCount) {
                    currentCount = feedCount.num;
                    currentCount += num;
                    feedCount.num = currentCount;
 
                    db.collection('feedcount').save(feedCount, {w:1}, function (err, results) {
                        if (err) {
                            console.error('error saving feed count');
                            console.error(err);
                            return false;
                        }

                        db.close();
                        console.log('feed count update successful');
                        return true;
                    });
                } else {
                     currentCount += num;
                     var newFeedCount = {id: dateKey, num: currentCount};
                     db.collection('feedcount').insertOne(newFeedCount, function (err, results) {
                         if (err) {
                             console.error(err);
                             db.close();
                             return false;
                         }

                         console.log('feed count update successful');
                         db.close();
                         return true;
                     });
                }
            });
        });
    }

    function getMaxFeedValue (callback) {
        MongoClient.connect(config.connectionString, function (err, db) {
            if (err) {
                console.error('error connecting to mongo db');
                console.error(err);
                return callback(err);
            }

            db.collection('maxfeed').findOne({}, function (err, doc) {
                if (err) {
                    console.error("error getting max feed from mongo");
                    console.error(err);
                    return callback(err);
                }

		var val = (doc || {max:0}).max;
                db.close();

                return callback(null, val);
            });
        });
    }

    function getMaxFeedService (req, res, next) {
        getMaxFeedValue(function (err, max) {
            if (err) {
                return next(err);
            }

            return res.json({max: max});
        });
    }

    function saveMaxFeed (req, res, next) {
        if (req.user && !req.user.isAdmin) return res.sendStatus(200);

        MongoClient.connect(config.connectionString, function (err, db) {
            if (err) {
                console.error('error connecting to mongodb');
                console.error(err);
                return next(err);
            }

            db.collection('maxfeed').findOne({}, function (err, feedLimit) {
                if (err) {
                    console.error("error getting max feed from mongo");
                    console.error(err);
                    return callback(err);
                }

                if (feedLimit) {
                    feedLimit.max = req.body.max;

                    db.collection('maxfeed').save(feedLimit, {w:1}, function (err) {
                        if (err) {
                            console.error('error saving max feed');
                            return next(err);
                        }

                        db.close();
                        console.log('max feed update successful');
                        return res.sendStatus(200);
                    });
                } else {
                     var newMax = { max: req.body.max };
                     db.collection('maxfeed').insertOne(newMax, function (err, results) {
                         if (err) {
                             console.error(err);
                             db.close();
                             return next(err);
                         }

                         console.log('Max feed creation successful!');
                         db.close();
                         return res.sendStatus(200);
                     });
                }
            });
        });
    }

    function startFeeder (req, res, next) {
        console.log('Starting feeder');
        
        if (!req.body.units) {
            console.log('no units specified');
            return next(new Error('No units specified'));
        }

        if (isNaN(parseInt(req.body.units, 10))) {
            console.log('units invalid, please send integer');
            return next(new Error('Units invalid, please send integer'));
        }

	getFeedCount(function (err, currentCount) {
            if (err) {
                return next(err);
            }

            getMaxFeedValue(function (err, feedLimit) {
                if (err) {
                    return next(err);
                }

                // ignore if admin or feedLimit is 0
                if (feedLimit && feedLimit > 0 && (currentCount + req.body.units > feedLimit)) {
                    console.log('Limit reached');
                    saveLog('Feed count reached');
                    return next(new Error('Feed limit reached!'));
                }

                console.log('Dispensing ' + req.body.units + ' units');

                if (!feedProcess) {
                    feedProcess = child_process.spawn('python', [__dirname + '/python/feederod.py', parseInt(req.body.units, 10)]);
                    
                    feedProcess.on('close', function handleFeedProcessClose (code) {
                        updateFeedCount(req.body.units);

                        console.log('feed process exited with code ' + code);
                        feedProcess = null;
                        return res.sendStatus(200);
                    });
                } else {
                    return next(new Error('Feed process already exists!'));
                }
            });
        });
    }
    
    function stopFeeder (req, res, next) {
        console.log('Stopping feeder');

        if (feedProcess) {
            feedProcess.kill('SIGINT');
            feedProcess = null;
            return res.sendStatus(200);
        } else {
            return next(new Error('Feed process does not exist.'));
        }
    }

    function createSchedule (req, res, next) {
        var schedule = req.body;
        var msg = '';

        if (!schedule.time || !schedule.units) {
            msg = 'Missing time and/or units';
            console.log(msg);
            return next(new Error(msg));
        }

        if (!/\d+:\d{2}:\d{2}/.test(schedule.time)) {
            msg = 'Invalid time format, please send string in H:mm:ss format (24hr)';
            console.log(msg);
            return next(new Error(msg));
        }

        if (isNaN(parseInt(schedule.units, 10))) {
            msg = 'Invalid units format, please send integer';
            console.log(msg);
            return next(new Error(msg));
        }

        MongoClient.connect(config.connectionString, function (err, db) {
            if (err) {
                msg = 'Failed to connect to mongodb';
                console.error(msg);
                console.error(err);
                return next(err);
            }

            db.collection('schedule').insertOne(schedule, function (err, results) {
                if (err) {
                    msg = 'Failed to insert schedule';
                    console.error(msg);
                    console.error(err);
                    db.close();
                    return next(err);
                }

                console.log('Schedule creation successful!');
                schedule._id = results.insertedId.toString();
                db.close();
                return res.json(schedule);
            });
        });
    }

    function getSchedule (req, res, next) {
        var msg = '';

        MongoClient.connect(config.connectionString, function (err, db) {
            if (err) {
                msg = 'Failed to connect to mongodb';
                console.error(msg);
                console.error(err);
                return next(err);
            }

            db.collection('schedule').find().toArray(function (err, documents) {
                if (err) {
                    msg = 'Find failed';
                    console.error(msg);
                    console.error(err);
                    db.close();
                    return next(err);
                }
                
                console.log(documents);
                db.close();
                return res.json({
                    schedules: documents
                });
            });
        });
    }

    function deleteSchedule (req, res, next) {
        var msg = '';

        MongoClient.connect(config.connectionString, function (err, db) {
            if (err) {
                msg = 'Failed to connect to mongodb';
                console.error(msg);
                console.error(err);
                return next(err);
            }

            db.collection('schedule').deleteOne({_id: new ObjectID(req.params.id)}, function (err, results) {
                if (err) {
                    msg = 'Failed to delete schedule ' + req.params.id;
                    console.error(msg);
                    console.error(err);
                    return next(err);
                }

                console.log('Deleted ' + results.deletedCount + ' documents');

                if (results.deletedCount) {
                    console.log('Successfully deleted schedule ' + req.params.id);
                }

                db.close();
                return res.json({
                    count: results.deletedCount
                });
            });
        });
    }

    function updateSchedule (req, res, next) {
        var schedule = req.body;
        var msg = '';

        if (schedule.time && !/\d+:\d{2}:\d{2}/.test(schedule.time)) {
            msg = 'Invalid time format, please send string in H:mm:ss format (24hr)';
            console.log(msg);
            return next(new Error(msg));
        }

        if (schedule.units && isNaN(parseInt(schedule.units, 10))) {
            msg = 'Invalid units format, please send integer';
            console.log(msg);
            return next(new Error(msg));
        }

        MongoClient.connect(config.connectionString, function (err, db) {
            if (err) {
                msg = 'Failed to connect to mongodb';
                console.error(msg);
                console.error(err);
                return next(err);
            }

            db.collection('schedule').save({_id: new ObjectID(req.params.id), time: schedule.time, units: schedule.units, lastExecuted: schedule.lastExecuted ? new Date(schedule.lastExecuted) : null}, {w:1}, function (err, results) {
                if (err) {
                    msg = 'Update failed';
                    console.error(msg);
                    console.error(err);
                    db.close();
                    return next(err);
                }

                console.log(results.result);

                console.log('Updated ' + results.result.n + ' document(s)');
                if (results.result.n) {
                    console.log('Successfully updated schedule ' + req.params.id);
                }

                db.close();
                return res.json({
                    count: results.result.n
                });
            });
        });
    }

    function getConfig (req, res, next) {
        MongoClient.connect(config.connectionString, function (err, db) {
            if (err) {
                console.error('error connecting to mongo db');
                console.error(err);
                return next(err);
            }

            db.collection('config').find().toArray(function (err, docs) {
                if (err) {
                    console.error('error fetching config');
                    console.error(err);
                    return next(err);
                }
                
                db.close();
                //console.log('got config');
                //console.log(docs);
                return res.json(docs);
            });
        });
    }

    function updateConfig (req, res, next) {
        MongoClient.connect(config.connectionString, function (err, db) {
            if (err) {
                console.error('error connecting to mongo db');
                console.error(err);
                return next(err);
            }

            db.collection('config').save({_id: req.body.name, ipAddress: req.body.ipAddress}, {w:1}, function (err, results) {
                if (err) {
                    console.error('error saving config');
                    console.error(err);
                    return next(err);
                }

                db.close();
                console.log('config update successful');
                console.log(req.body);
                return res.sendStatus(200);
            });
        });
    }

    function proxyRequest (req, res, next) {
        var method = req.body.method;
        var ip = req.body.ip;
        var route = req.body.route;
        var params = req.body.params;

        if (!method || !ip || !route || !params) {
            console.error('Missing parameters to proxy');
            return next('Missing parameters to proxy');
        }
    }

    return {
        readTempAndHumidity: readTempAndHumidity,
	readWaterTemp: readWaterTemp,
        turnLightsOn: turnLightsOn,
        turnLightsOff: turnLightsOff,
        startFeeder: startFeeder,
        stopFeeder: stopFeeder,
        createSchedule: createSchedule,
        getSchedule: getSchedule,
        deleteSchedule: deleteSchedule,
        updateSchedule: updateSchedule,
        getConfig: getConfig,
        updateConfig: updateConfig,
        proxyRequest: proxyRequest,
        getMaxFeed: getMaxFeedService,
        saveMaxFeed: saveMaxFeed
    };
})();
