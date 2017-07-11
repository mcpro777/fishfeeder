var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
var config = require('./config.js');
var services = require('./services.js');

MongoClient.connect(config.connectionString, function (err, db) {
    if (err) {
        console.error('Failed to connect to mongo db');
        console.error('Fatal error, shutting down');
        console.error(err);
        return;
    }

    console.log('Starting schedule runner. Will execute every ' + config.scheduleInterval + ' seconds');
    
    setInterval(function checkFeedingSchedules () {
        var current = moment();
        var timestamp = current.format('MM/DD/YYYY h:mm:ss a');
        var today = current.format('MM/DD/YYYY');
        var collection = db.collection('schedule');
        
        try {
            collection.find().toArray(function (err, items) {
                if (err) {
                    console.error(timestamp + ' - error returned from find operation');
                    console.error(err);
                    return;
                }

                var updateArray = [];
                for (var i = 0; i < items.length; i++) {
                    if (!items[i].time) {
                        console.error(timestamp + ' - No time found on schedule. Skipping.');
                        continue;
                    }

                    if (!items[i].units) {
                        console.error(timestamp + ' - no units found on schedule. Skipping.');
                        continue;
                    }

                    var scheduleTimestamp = moment(today + ' ' + items[i].time, 'MM/DD/YYYY H:mm:ss');
                    var units = items[i].units;
                    var lastExecuted = items[i].lastExecuted ? moment(items[i].lastExecuted) : null;

                    //console.log("Current: " + timestamp);
                    //console.log("Timestamp: " + scheduleTimestamp.format('MM/DD/YYYY h:mm:ss a'));

                    if (current.isAfter(scheduleTimestamp)) {
                        //console.log(timestamp + ' - Past Time');
                        if (lastExecuted) {
                            //console.log("Last Executed: " + lastExecuted.format('MM/DD/YYYY h:mm:ss a'));
                        } else {
                            //console.log("Never been executed");
                        }

                        if (!lastExecuted || scheduleTimestamp.isAfter(lastExecuted)) {
                            //console.log(timestamp + ' - Running schedule ID: ' + items[i]._id + ' - feeding ' + units + ' units');
                            updateArray.push({ _id: items[i]._id, time: items[i].time, units: items[i].units });
                            
                            // Mock req and res objects to use in services
                            var req = {
                                body: {
                                    units: units
                                }
                            };

                            var res = {
                                json: function (data) {
                                    console.log(timestamp + ' - Got data from service');
                                    console.log(data);
                                },
                                sendStatus: function (status) {
                                    console.log(timestamp + ' - Got status from service');
                                    console.log(status);
                                }
                            };

                            var logStr = timestamp + ' - starting feeder for ' + scheduleTimestamp.format('h:mm:ss a') + ' feeding, ' + units + ' units';
                            //console.log(logStr);

                            var log = {id: new Date(), message: logStr};
                            db.collection('logs').insertOne(log, function (err, results) {
                                if (err) {
                                    console.error(err);
                                }
                            });

                            services.startFeeder(req, res, function next (err) {
                                if (err) {
                                    console.error(timestamp + ' - error occurred in feeder service');
                                    console.error(err);
                                }

                                console.log(timestamp + ' - feeding successful!');
                            });
                        } else {
                            //console.log("Last executed is after scheduled timestamp. No need to run.");
                        }
                    }
                }

                for (var i = 0; i < updateArray.length; i++) {
                    // update lastExecuted timestamps
                    collection.update({ _id: updateArray[i]._id }, {time: updateArray[i].time, units: updateArray[i].units, lastExecuted: current.toDate()}, function (err) {
                        if (err) {
                            console.error(timestamp + ' - error occurred during document update');
                            console.error(err);
                        }

                        //console.log(timestamp + ' - document update successful');
                    });
                }
            });
        } catch(e) {
            console.error(timestamp + ' - exception thrown operation');
            console.error(e);
        }
    }, 1000 * config.scheduleInterval);
});
