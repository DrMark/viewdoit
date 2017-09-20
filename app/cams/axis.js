#!/usr/bin/nodejs
// axis HTTP API Module

var 	net 		= require('net');
var  	events 		= require('events');
var 	util		= require('util');
var 	request 	= require('request');
var	NetKeepAlive 	= require('net-keepalive');

var	TRACE		= true;
var	BASEURI		= false;

var axis = function(options) {
	events.EventEmitter.call(this)
	this.client = this.connect(options)
	TRACE = options.log
	BASEURI = 'http://' + options.user + ':' + options.pass + '@' + options.host + ':' + options.port
};

util.inherits(axis, events.EventEmitter);

axis.prototype.connect = function(options) {
	var self = this
	var authHeader = 'Basic ' + new Buffer(options.user + ':' + options.pass).toString('base64');

	// Connect
	var client = net.connect(options, function () {
		var header =	'GET /axis-cgi/admin/videocontrol.cgi?action=connect HTTP/1.0\r\n' +
				'Host: ' + options.host + ':' + options.port + '\r\n' +
				authHeader + '\r\n' +
				'Accept: multipart/x-mixed-replace\r\n\r\n';
		client.write(header)
		client.setKeepAlive(true,1000)
		NetKeepAlive.setKeepAliveInterval(client,5000)	// sets TCP_KEEPINTVL to 5s
		NetKeepAlive.setKeepAliveProbes(client, 12)	// 60s and kill the connection.
        	handleConnection(self);
	});

	client.on('timeout', function() {
		console.log("10 mins of inactivity")
		//self.abort()
		//self.connect(options)
	});

	client.on('data', function(data) {
       		handleData(self, data)
	});

	client.on('close', function() {		// Try to reconnect after 30s
	        setTimeout(function() { self.connect(options) }, 30000 );
		handleEnd(self)
	});

	client.on('error', function(err) {
		handleError(self, err)
	});
}

axis.prototype.ptzCommand = function (cmd,arg1,arg2,arg3,arg4) {
    	var self = this;
			self.emit("error", 'Command not available.');
}

axis.prototype.ptzPreset = function (preset) {
    	var self = this;
	if (isNaN(preset))	handleError(self,'INVALID PTZ PRESET');
	request(BASEURI + '/axis-cgi/com/ptz.cgi?camera=1&gotoserverpresetname=' + preset, function (error, response, body) {
		if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
			self.emit("error", 'FAILED TO ISSUE PTZ PRESET');
		}
	})
}

axis.prototype.ptzZoom = function (multiple) {
    	var self = this;
	if (isNaN(multiple))	handleError(self,'INVALID PTZ ZOOM');
	if (multiple > 0)	cmd = 'ZoomTele';
	if (multiple < 0)	cmd = 'ZoomWide';
	if (multiple === 0)	return 0;

	request(BASEURI + '/axis-cgi/com/ptz.cgi?camera=1&zoom=' + multiple, function (error, response, body) {
		if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
			self.emit("error", 'FAILED TO ISSUE PTZ ZOOM');
		}
	})
}

axis.prototype.ptzMove = function (direction,action,speed) {
    	var self = this;
	if (isNaN(speed))	handleError(self,'INVALID PTZ SPEED');
	if ((action !== 'start') || (action !== 'stop')) {
		handleError(self,'INVALID PTZ COMMAND')
		return 0
	}
	if ((direction !== 'Up') || (direction !== 'Down') || (direction !== 'Left') || (direction !== 'Right')
	    (direction !== 'LeftUp') || (direction !== 'RightUp') || (direction !== 'LeftDown') || (direction !== 'RightDown')) {
		handleError(self,'INVALID PTZ DIRECTION')
		return 0
	}
	request(BASEURI + '/axis-cgi/com/ptz.cgi?camera=1&move=' + direction + '&speed=' + speed, function (error, response, body) {
		if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
			self.emit("error", 'FAILED TO ISSUE PTZ UP COMMAND');
		}
	})
}

axis.prototype.ptzStatus = function () {
    	var self = this;
	request(BASEURI + '/axis-cgi/com/ptzqueue.cgi?camera=1&control=query', function (error, response, body) {
		if ((!error) && (response.statusCode === 200)) {
			body = body.toString().split('\r\n')
			self.emit("ptzStatus", body);
		} else {
			self.emit("error", 'FAILED TO QUERY STATUS');
		}
	})
}

function handleData(self, data) {
	if (TRACE)	console.log('Data: ' + data.toString());
	data = data.toString().split('\r\n')
	var i = Object.keys(data);
	i.forEach(function(id){
		if (data[id].startsWith('Code=')) {
			var	alarm = data[id].split(';')
			var	code = alarm[0].substr(5)
			var	action = alarm[1].substr(7)
			var	index = alarm[2].substr(6)
			self.emit("alarm", code,action,index);
		}
	});
}

function handleConnection(self) {
	if (TRACE)	console.log('Connected to ' + options.host + ':' + options.port)
    	//self.socket = socket;
	self.emit("connect");
}

function handleEnd(self) {
	if (TRACE)	console.log("Connection closed!");
	self.emit("end");
}

function handleError(self, err) {
	if (TRACE)	console.log("Connection error: " + err);
	self.emit("error", err);
}

String.prototype.startsWith = function (str){
	return this.slice(0, str.length) == str;
};

exports.axis = axis;
