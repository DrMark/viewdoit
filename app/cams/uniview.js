#!/usr/bin/nodejs
// uniview HTTP API Module

var net 		= require('net'),
    events 		= require('events'),
    util		= require('util'),
    request 	= require('request'),
    NetKeepAlive 	= require('net-keepalive'),
    bodyParser = require("body-parser"),
    request = require('request');

var	TRACE		= true;
var	BASEURI		= false;

var uniview = function(options) {
	events.EventEmitter.call(this)
	this.client = this.connect(options)
	TRACE = options.log
	BASEURI = 'http://' + options.user + ':' + options.pass + '@' + options.host + ':' + options.port

  // PTZ command convertions
  this.avCom = {
    'stop decreasing iris': '0x0101',
    'decrease iris': '0x0102',
    'stop increasing iris': '0x0103',
    'increase iris': '0x0104',
    'stop focusing near': '0x0201',
    'focus near': '0x0202',
    'stop focusing far': '0x0203',
    'focus far': '0x0204',
    'stop zooming in': '0x0301',
    'zoom in': '0x0302',
    'stop zooming out': '0x0303',
    'zoom out': '0x0304',
    'up': '0x0402',
    'down': '0x0404',
    'right': '0x0502',
    'left': '0x0504',
    'upper left': '0x0702',
    'lower left': '0x0704',
    'upper right': '0x0802',
    'lower right': '0x0804',
    'stop': '0x0901',
    'wiper on': '0x0A01',
    'wiper off':'0x0A02',
    'light on': '0x0B01',
    'light off': '0x0B02',
    'heater on': '0x0C01',
    'heater off': '0x0C02',
    'ir on': '0x0D01',
    'ir off': '0x0D02'
  }
};

util.inherits(uniview, events.EventEmitter);

// convert common PTZ commands to Uniview compatible values
uniview.prototype.comConvert = function(action) {

  switch(action){
    case 'LeftUp':
      action = 'upper left';
    break;
    case 'RightUp':
      action = 'upper right';
    break;
    case 'LeftDown':
      action = 'lower left';
    break;
    case 'RightDown':
      action = 'lower right';
    break;
    case 'IrisLarge':
      action = 'increase iris';
    break;
    case 'IrisSmall':
      action = 'decrease iris';
    break;
    case 'ZoomWide':
      action = 'zoom out';
    break;
    case 'ZoomTele':
      action = 'zoom in';
    break;
    case 'FocusNear':
      action = 'focus near';
    break;
    case 'FocusFar':
      action = 'focus far';
    break;
  };

  return action;
};

uniview.prototype.connect = function(options) {
	var self = this
	var authHeader = 'Basic ' + new Buffer(options.user + ':' + options.pass).toString('base64');

	// Connect
  var client = {};
	// var client = net.connect(options, function () {
	// 	var header =	'GET /cgi-bin/eventManager.cgi?action=attach&codes=[AlarmLocal,VideoMotion,VideoLoss,VideoBlind] HTTP/1.0\r\n' +
	// 			'Host: ' + options.host + ':' + options.port + '\r\n' +
	// 			authHeader + '\r\n' +
	// 			'Accept: multipart/x-mixed-replace\r\n\r\n';
	// 	client.write(header)
	// 	client.setKeepAlive(true,1000)
	// 	NetKeepAlive.setKeepAliveInterval(client,5000)	// sets TCP_KEEPINTVL to 5s
	// 	NetKeepAlive.setKeepAliveProbes(client, 12)	// 60s and kill the connection.
  //       	handleConnection(self);
	// });

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
};

uniview.prototype.ptzCommand = function (cmd,arg1,arg2,arg3,arg4) {
    	var self = this;
	if ((!cmd) || (isNaN(arg1)) || (isNaN(arg2)) || (isNaN(arg3)) || (isNaN(arg4))) {
		handleError(self,'INVALID PTZ COMMAND')
		return 0
	}

  var selPTZCmd = this.avCom[ptzcommand.toLowerCase()];

  // gen command object
  if(selPTZCmd){
    var com = {
              "PTZCtrl": {
                "PTZCmd": selPTZCmd,
                "ContinueTime": 60,
                "Para1": arg1,
                "Para2": arg2,
                "Para3": arg3
              }
            };

    request.post(BASEURI + '/LAPI/1/PTZ/PtzCtrl', form: com, function (err,httpResponse,body) {
  		if (err) {
  			self.emit("error", 'FAILED TO ISSUE PTZ COMMAND');
  		}
  	});
  } else {
    self.emit("error", 'FAILED TO ISSUE PTZ COMMAND');
  }
};

uniview.prototype.ptzPreset = function (preset) {
		self.emit("error", 'FAILED TO ISSUE PTZ PRESET');
};

uniview.prototype.ptzZoom = function (multiple) {
    	var self = this;

  var zoom = (multiple < 0 ? 'zoom out' : 'zoom in');

  // gen command object
  var selPTZCmd = this.avCom[zoom];

  // gen command object
  if(selPTZCmd){

    var com = {
              "PTZCtrl": {
                    "PTZCmd": selPTZCmd,
                    "ContinueTime": 60,
                    "Para1": multiple
                  }
                };

    request.post(BASEURI + '/LAPI/1/PTZ/PtzCtrl', form: com, function (err,httpResponse,body) {
  		if (err) {
  			self.emit("error", 'FAILED TO ISSUE PTZ COMMAND');
  		}
  	});
  } else {
    self.emit("error", 'FAILED TO ISSUE PTZ COMMAND');
  }

};

uniview.prototype.ptzMove = function (direction,action,speed) {
    	var self = this;
	if (isNaN(speed))	handleError(self,'INVALID PTZ SPEED');
	if ((action !== 'start') || (action !== 'stop')) {
		handleError(self,'INVALID PTZ COMMAND')
		return 0
	};
	if ((direction !== 'Up') || (direction !== 'Down') || (direction !== 'Left') || (direction !== 'Right')
	    (direction !== 'LeftUp') || (direction !== 'RightUp') || (direction !== 'LeftDown') || (direction !== 'RightDown')) {
		handleError(self,'INVALID PTZ DIRECTION')
		return 0
	};

  var move = comConvert(direction);

  // gen command object
  var selPTZCmd = this.avCom[move];

  // gen command object
  if(selPTZCmd){

    // gen command object
    var com = {
              "PTZCtrl": {
                  "PTZCmd": this.avCom[move],
                  "ContinueTime": 60,
                  "Para1": multiple
                }
              };

    request.post(BASEURI + '/LAPI/1/PTZ/PtzCtrl', form: com, function (err,httpResponse,body) {
  		if (err) {
  			self.emit("error", 'FAILED TO ISSUE PTZ COMMAND');
  		}
	});

  } else {
    self.emit("error", 'FAILED TO ISSUE PTZ COMMAND');
  }

};

uniview.prototype.ptzStatus = function () {
	var self = this;

  var com = {
              // "PTZCfg": {
              //   "PtzFactoryName ": "INTERNAL-PTZ",
              //   "PTZAddr": 1
              //  }
            };

  request.get(BASEURI + '/LAPI/Media/VideoEncode/Stream1', form: com, function (err,httpResponse,body) {
		if (err) {
			self.emit("error", 'FAILED TO ISSUE PTZ COMMAND');
		} else {
      self.emit("ptzStatus", json(body));
    }
	});

};


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

exports.uniview = uniview;
