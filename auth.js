var config = require('./config.js');
var crypto = require('crypto');
var moment = require('moment');
var MongoClient = require('mongodb').MongoClient;

module.exports = (function Auth () {
    function parseRequestSignature (req) {
        var path = req.path;
        var qs = '';
        var i = 0;
        var params = {};

        //console.log(req.method);
        if (req.method === "GET") {
            params = req.query;
        } else {
            params = req.body;
        }

        //console.log(params);

        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                if (!i) {
                    qs += '?';
                }

                qs += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
                i++;
            }
        }

        qs = qs.replace(/\&$/, '');
        //console.log(path+qs);
        return path + qs;
    }

    function handleRedisError(client, err, next) {
        client.quit();
        return next(err);
    }
    
    return {
        checkRole: function checkRole (req, res, next) {
            if (!req.user || !req.user.isAdmin) {
                return next(new Error("User is not admin"));
            }

            return next();
        },
        auth: function auth (req, res, next) {
            //console.log('Authenticating request...');

            var incomingHash = req.headers.hash;
            var incomingUser = req.headers.id;
            var signature = parseRequestSignature(req);
       
            // Get token from mongo
            MongoClient.connect(config.connectionString, function (err, db) {
                if (err) {
                    console.error("Error connecting to mongodb");
                    console.error(err);
                    return res.sendStatus(500);
                }

                var collection = db.collection('users');
                collection.findOne({_id: incomingUser}, function (err, document) {
                    if (err) {
                        console.error('error querying db');
                        console.error(err);
                        db.close();
                        return res.sendStatus(500);
                    }

                    if (!document) {
                        console.log('token does not exist');
                        db.close();
                        return res.sendStatus(401);
                    }

                    // check expiration
                    var now = moment().valueOf();
                    var exp = moment(document.exp).valueOf();

                    if (now >= exp) {
                        console.log('token is expired');
                        db.close();
                        return res.sendStatus(401);
                    }

                    // create HMAC
                    var token = document.token;
                    var hmac = crypto.createHmac('sha256', token);
                    hmac.update(signature);
                    var hash = hmac.digest('hex');

                    // check against incoming hash
                    if (hash !== incomingHash) {
                        console.log('invalid hash');
                        db.close();
                        return res.sendStatus(401);
                    }

                    // authentication successful
                    req.user = {};
                    req.user.id = document._id;
                    req.user.isAdmin = document.isAdmin;
                    //console.log('Authentication successful');
                    db.close();
                    return next();
                });
            });
        },

        login: function login (req, res, next) {
            //console.log('Received login request');

            MongoClient.connect(config.connectionString, function (err, db) {
                if (err) {
                    console.error('Error connecting to mongodb');
                    console.error(err);
                    
                    if (db && db.close) {
                        db.close();
                    }
                    
                    return next(err);
                }

                // check credentials
                var incomingCredentials = req.body.credentials;
                var incomingUsername = req.body.username;

                db.collection('users').findOne({_id: incomingUsername}, function (err, user) {
                    if (err || !user) {
                        console.error('User ' + incomingUsername + ' not found');
                        db.close();
                        return res.sendStatus(401);
                    }

                    var username = user._id;
                    var password = user.password;
                    var credHash = crypto.createHash('sha256');
                    var isAdmin = !!user.isAdmin;
                    credHash.update(username + ':' + password);
                    var credentials = credHash.digest('hex');

                    if (incomingCredentials !== credentials) {
                        console.log('Access denied');
                        db.close();
                        return res.sendStatus(401);
                    }

                    // Generate new token
                    var seed = moment().format('MMDDYYYYHHmmss') + Math.random();
                    var hash = crypto.createHash('sha256');
                    hash.update(seed);
                    var token = hash.digest('hex');
                    var exp = moment().add(config.tokenExpireSeconds, 'seconds').toDate();
                    
                    db.collection('users').replaceOne({_id: username}, {_id: username, password: password, token: token, exp: exp, isAdmin: isAdmin}, {upsert: true}, function (err, result) { 
                        if (err) {
                            console.error('error updating user document');
                            console.error(err);
                            db.close();
                            return next(err);
                        }

                        //console.log('Update successful');
                        //console.log('login will expire at ' + moment(exp).format('MM/DD/YYYY H:mm:ss a'));
                        db.close();
                        return res.json({
                            id: username,
                            token: token,
                            isAdmin: !!user.isAdmin
                        });
                    });
                });
            });
        }
    };
})();
