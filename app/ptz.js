'use strict'

/**
 * Module dependencies.
 * @private
 */

var cam = require('../app/cam');

// set default camera
cam.setCam(config.camera);

/**
 * Module exports.
 * @public
 */

module.exports = Ptz

// init obj and vars
function Ptz(){
  // init vars
  var qry = '',
      action = '',
      channel = '',
      code = '',
      arg1 = '',
      arg2 = '',
      arg3 = '',
      arg4 = '',
      direction_array = {
                          'Up':'',
                          'Down':'',
                          'Left':'',
                          'Right':'',
                          'LeftUp':'',
                          'RightUp':'',
                          'LeftDown':'',
                          'RightDown':''
                        },
      response_msg = '';
};

// store incoming requests
Ptz.prototype.storeReqs = function(req, res){

  // gather userdata based on included userid
  var userRole = 0;
  if(typeof req.uuid !== 'undefined' && req.uuid){
    mycon.connect(function(err) {
      if (err) throw err;
      //console.log("Connected!");
      var sql = 'SELECT * FROM users WHERE email = ?';
      mycon.query(sql, req.uuid, function (err, result) {
        if (err) throw err;
        if(result){
          userRole = result[0].role;
        }
      });
    });
  }

  // store selected action value for execution
  if(typeof clientActions[Ptz.action] === 'undefined'){
    clientActions[Ptz.action].cnt = 1;
    clientActions[Ptz.action].qry = [];
  } else {
    clientActions[Ptz.action].cnt += 1;
  }

  // store requested query data
  if(typeof clientActions[Ptz.action].qry[userRole] === 'undefined'){
    clientActions[Ptz.action].qry[userRole] = [];
  }
  clientActions[Ptz.action].qry[userRole].push(req.query);

  // post current status to client
  res.setHeader('Content-Type', 'text/plain;charset=utf-8');
  if(lastStatus == naMessage){
    res.send(lastStatus);
  } else {
    res.status(403).send(naMessage);
  }

};

// clear requests queue
Ptz.prototype.clearReqs = function(){
  clientActions = {};
});

// perform received requests
Ptz.prototype.perfAction = function(){

  // determine top requested action
  var topAction = '',
      topActionCnt = 0,
      topRole = 0,
      i = 0,
      rolesLength;
  for (var property in clientActions) {
    if (object.hasOwnProperty(property)) {
        if(property.cnt > topActionCnt){
          topActionCnt = property.cnt;
          topAction = property;
        }
    }
  }

  // gather stacked role requests
  rolesLength = topAction.qry.length;
  for(i = 0; i < rolesLength; i++){
    if(typeof topAction.qry[i] !== 'undefined' && topAction.qry[i]){
      if(i > topRole) topRole = i;
    }
  }

  // execute top requested action
  if(topAction.qry[topRole]){

    // init vars
    Ptz.qry = topAction.qry[topRole];
    Ptz.action =   Ptz.qry.action;
    Ptz.channel =  Ptz.qry.channel;
    Ptz.code =     Ptz.qry.code;
    Ptz.arg1 =     Ptz.qry.arg1;
    Ptz.arg2 =     Ptz.qry.arg2;
    Ptz.arg3 =     Ptz.qry.arg3;
    Ptz.arg4 =     Ptz.qry.arg4;

    switch(Ptz.action){
      case 'getStatus':

        var cam_response = cam.ptzStatus();
        // Send the response to the browser when it is received in plain text format.
        lastStatus = getStatus;

      break;
      case 'start':
      case 'stop':

        switch(Ptz.code){
          case 'GotoPreset':

            if (Ptz.action == 'start'){

              var cam_response = cam.ptzPreset(Ptz.arg2);
              lastStatus = 'Moved to preset: ' + Ptz.arg2;

            } else {
              lastStatus = naMessage;
            }

            clearReqs();

          break;
          case 'StartTour':

            if (Ptz.action == 'start'){

              var cam_response = cam.ptzCommand('StartTour',Ptz.arg1,Ptz.arg2,Ptz.arg3,Ptz.arg4);
              lastStatus = 'Started Tour: ' + Ptz.arg1;

            } else {
              lastStatus = naMessage;
            }

          break;
          case 'ZoomTele':

            var checkStatus = cam.ptzStatus();
            console.log('inside zoomTele');

            // don't allow the user to zoom for long if they are in a restricted zone and are over the range already
            if (getStatus.status.inRestrictedArea == true) {

               console.log(getStatus.status.message);
               console.log('zooming in restricted area');
               response_msg = getStatus.status.message;
               var cam_response = cam.ptzZoom(Ptz.action,Ptz.code,Ptz.arg2);
               // send the stop command every 0.7 seconds, in case someone just holds down button or doesn't send stop command.
               //setTimeout(function() {
               //   var cam_response2 = dahua.ptzZoom('stop',code,arg2);
               //}, 700);

            } else {

               console.log('zooming outside restricted area');
               response_msg = 'Started Zoom: ' + Ptz.code;
               var cam_response = cam.ptzZoom(Ptz.action,Ptz.code,Ptz.arg2);
               // wait, then send stop command, in case someone just holds down button or doesn't send stop command.
               setTimeout(function() {
                  var cam_response2 = cam.ptzZoom('stop',Ptz.code,Ptz.arg2);
               }, 3000);

            };

            var checkStatus = cam.ptzStatus();
            lastStatus = response_msg;

          break;
          case 'ZoomWide':

            var cam_response = cam.ptzZoom(Ptz.action,Ptz.code,Ptz.arg2);
            var checkStatus = cam.ptzStatus();
            // wait, then send stop command, in case someone just holds down button or doesn't send stop command.
            //setTimeout(function() {
            //   var cam_response2 = dahua.ptzZoom('stop',code,arg2);
            //}, 3000);
            lastStatus = 'Started Zoom: ' + Ptz.code;

          break;
          default:

            if(Ptz.code in Ptz.direction_array) {

              console.log('requesting movement');
              // direction,action,speed
              var cam_response = cam.ptzMove(Ptz.code,Ptz.action,Ptz.arg2);
              var checkStatus = cam.ptzStatus();
              // wait, then send stop command, in case someone just holds down button or doesn't send stop command.
              //setTimeout(function() {
              //   var cam_response2 = dahua.ptzMove(code,'stop',arg2);
              //}, 3000);
              lastStatus = 'requested movement: ' + Ptz.code;

            } else {
              lastStatus = naMessage;
            }

          break;
        }

      break;
      default:

        lastStatus = naMessage;

      break;
    }

  } else {
    lastStatus = naMessage;
  }

  // clear incoming requests storage
  if(lastStatus != naMessage){
    clearReqs();
  } else {
  // or remove only the invalid recent request
    delete clientActions[Ptz.action];
  }

};
