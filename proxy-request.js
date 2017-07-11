var request = require('request');

module.exports = (function ProxyRequest () {
    return function proxy_request (req, res, next) {
        var ip = req.headers.ip;

        if (!ip) {
            return next();
        }

        var url = req.url;
        var method = req.method;
        var query = req.query;
        var body = req.body;
        
        var headers = req.headers;
        headers["X-Forwarded-For"] = req.ip;
        delete headers.ip;
        delete headers.hash;
        delete headers.id;

        //console.log("Proxying request to: " + method + " " + "http://" + ip + url + " with " + (method === "GET" ? "qs:" : "body:"));
        //console.log((method === "GET" ? query : body)); 
        //console.log("Headers:");
        //console.log(headers);

        request({
            url: "http://" + ip + url,
            method: method,
            headers: headers,
            qs: query,
            json: body
        }, function (error, response, json) {
            if (error || !response) {
                response = response || {}; 
                if (response.statusCode) {
                    console.log("Status code: " + response.statusCode);
                }
		if (error) {
			if (error == 'Error: socket hang up') {
                             return res.json({});
                        }
                	console.error('PROXY ERR: ' + error);
                }
		else
			console.error('PROXY NO RESPONSE: ' + response.statusCode);

		console.log(response);
		console.log(json);
                return next(error || response.statusCode);
            }

            //console.log("Status code: " + response.statusCode);
            //console.log(json);
            return res.json(json);
        });
    };
})();
