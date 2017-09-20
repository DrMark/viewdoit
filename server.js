var http = require('http');
var ipcamera = require('node-dahua-api');

// Options:
var options = {
    host	: '70.161.216.90',
    port : '554',
    user : 'studioc',
    pass : 'studioc1234',
    log 	: true
};

var dahua = new ipcamera.dahua(options);

dahua.on('error', function (err) {
   console.log('Error: ' + err);
});

dahua.on('ptzStatus', function (stat) {
   console.log('got ptzStatus: ' + stat);
});

// PTZ Go to preset 10
console.log('get status test');
console.log(dahua.ptzStatus());

// Zoom in by 10 units
// console.log("Zoom -500");
// dahua.ptzZoom(5);
//console.log("Get status");
//dahua.ptzStatus();



//dahua.on('error', (function(_this) {
//    return function(error) {
//        console.log('Error: ' + error.message + ' ' + Date());
//    };
//})(this));
