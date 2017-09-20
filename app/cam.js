'use strict'

/**
 * Module dependencies.
 * @private
 */

 var dahua = require('node-dahua-api'),
     axis = require('../app/axis'),
     uniview = require('../app/uniview');

/**
 * Module exports.
 * @public
 */

module.exports = Cam

/**
 * Create a new Cam object for the given req.
 *
 * @param {object} creds
 * @public
 */

function Cam(){

  // various shared Cam vars
  var dahua = '',
      type = '',
      options = '';

};

Cam.setCam = function(creds){

  Cam.type = creds.type || 'dahua';

  // Cam options:
  Cam.options = {
     host: creds.host,
     port: creds.port,
     user: creds.user,
     pass: creds.pass,
     log: creds.log
  };

  // get the initial status of the Cam.
  switch(Cam.type){
    case 'dahua':

      Cam.cam = new dahua.dahua(Cam.options);

    break;
    case 'dahua':

      Cam.cam = new axis.axis(Cam.options);

    break;
    case 'dahua':
    default:

      Cam.cam = new uniview.uniview(Cam.options);

    break;
  }

  // print errors
  Cam.cam.on('error', function (err) {
     console.log('Error: ' + err);
  });

  /* Update the Cam status when it is checked.
     Also, move the Cam if it is viewing a restricted area
   */
  Cam.cam.on('ptzStatus', function (stat) {
     // Process the incoming data and create the variable when the Cam returns the result from ptzStatus
     // This function doesn't return anything. It sets all of the individual values in the getStatus object
     // from the values returned from the Cam
     processStatus(stat);

     // see if the Cam is currently viewing a restricted zone
     console.log(config.camera.restrictions);
     // check to see if the Cam is in a restricted area and take action, if necessary
     checkRestriction(getStatus.status.position0, getStatus.status.position1, getStatus.status.zoomValue, config.camera.restrictions);
     console.log('getStatus: ' + JSON.stringify(getStatus));
  });

};

// get Cam status
Cam.ptzStatus = function(){
    Cam.cam.ptzStatus();
};

// get Cam preset
Cam.ptzPreset = function(arg){
    Cam.cam.ptzPreset(arg);
};

// send Cam command
Cam.ptzCommand = function(action, code, arg1, arg2, arg3, arg4){
    Cam.cam.ptzCommand(action, arg1, arg2, arg3, arg4);
};

// send Cam move command
Cam.ptzMove = function(action, code, arg){
    Cam.cam.ptzMove(code,action,arg);
};

// send Cam zoom command
Cam.ptzZoom = function(action, code, arg){
    Cam.cam.ptzZoom(action, code, arg);
};

// function to go through the list of variable names and convert them to lowercase first letter.
// Used in a str.replace() function call
Cam.prototype.replacer = function(match, p1, p2, p3, offset, string) {
   // p1 is nondigits, p2 digits, and p3 non-alphanumerics
   return match.toLowerCase();
};

/*
   Code for turning the getStatus response from the Cam into a complete object.
   This builds the complete getStatus object.
 */
Cam.prototype.processStatus = function(getStatusArray) {
   var tempValueArray;
   var tempName;
   var tempValue;
   var getStatusArrayLength = getStatusArray.length;
   //console.log('getStatusArray');
   //console.log(getStatusArray);
   // loop the getStatus result and convert the string into individual values
   for (var i = 0; i < getStatusArrayLength; i++) {
      //console.log('i= '+i);
      getStatusArray[i] = getStatusArray[i].replace(/^status/, 'getStatus.status');
      tempValueArray = getStatusArray[i].split("=");

      // lowercase the first letter after a period to get a better JS variable name
      // strip [ and ] from the variable names
      // Also, replace the misspelling of position (postion => position)
      tempName = tempValueArray[0].replace(/\.[a-zA-Z]/g, replacer).replace(/[\[\]]/g, '').replace(/ostion/g, 'osition');
      tempValue = tempValueArray[1];
      //console.log('tempName= '+tempName);
      //console.log('tempValue= '+tempValue);

      if (tempName.length > 0 && isNaN(tempValue) == false) {
         // the variable has a name and a value that is a number
         //console.log(tempName + ' is a number ' + tempValue);
         eval(tempName + ' = ' + tempValue);
         //console.log(eval(tempName));

      } else if (tempName.length > 0 && isNaN(tempValue) == true) {
         // the variable has a name and a value that is a string
         //console.log(tempName + ' is a string ' + tempValue);
         eval(tempName + ' = ' + '"' + tempValue + '"');
         //console.log(eval(tempName));
      }
   }
};
Cam.prototype.checkRestriction = function(position0, position1, zoomValue, restrictionArray) {
   // The Cam sends zoom values from 100-1700, but takes values from 1-130. This array gives the mapping between the two.
   var zoomValueArray = [
                          100, 120, 130, 150, 180, 200, 210, 230, 260, 270, 290, 310, 330, 350, 370, 390, 410,
                          430, 450, 470, 490, 510, 530, 550, 570, 590, 610, 630, 650, 680, 690, 710, 730, 750,
                          770, 790, 820, 840, 860, 890, 900, 920, 940, 970, 980, 1000, 1020, 1040, 1060, 1080,
                          1100, 1110, 1130, 1150, 1170, 1180, 1200, 1220, 1230, 1250, 1260, 1280, 1290, 1310,
                          1320, 1330, 1340, 1350, 1360, 1370, 1380, 1400, 1410, 1420, 1430, 1440, 1450, 1460,
                          1470, 1470, 1480, 1490, 1490, 1500, 1510, 1520, 1530, 1530, 1540, 1550, 1560, 1570,
                          1580, 1590, 1590, 1590, 1610, 1610, 1610, 1620, 1620, 1620, 1630, 1630, 1640, 1640,
                          1640, 1650, 1650, 1650, 1660, 1660, 1660, 1670, 1670, 1670, 1670, 1680, 1680, 1680,
                          1680, 1680, 1680, 1690, 1690, 1690, 1690, 1700, 1700, 1700
                        ],
       position0, // Horizontal: range 0-360;
       position1, // Vertical: range 0-90;
       zoomValue, // Zoom: range 100-1700;
       restrictionArray, // [[300, 325, 10, 12, 100], [300, 325, 80, 90, 100]]
       restrictionArrayLength = restrictionArray.length;

   // check to see if current position is in horizontal/vertical restricted area
   for (var i = 0; i < restrictionArrayLength; i++) {
      if (((position0 > restrictionArray[i][0]) && (position0 < restrictionArray[i][1])) &&
         (position1 > restrictionArray[i][2]) && (position1 < restrictionArray[i][3]) &&
         (zoomValue > restrictionArray[i][4])
      ) {
         getStatus.status.inRestrictedArea = true;
         if (restrictionArray[i][4] > 100) {
            // zoom the lens to the preset level
            getStatus.status.message = 'Zoom restricted. Changing zoom level.';
            getStatus.status.zoomValueMaxAllowed = restrictionArray[i][4];
            // Look up the appropriate number to use to change the zoom
            zoomValue = zoomValueArray.indexOf(restrictionArray[i][4]);
            console.log('zoomValue ' + zoomValue);
            Cam.cam.ptzCommand('PositionABS',position0,position1,zoomValue,0);
            break;
         } else if (restrictionArray[i][4] == 100) {
            // zoom the lens all the way out
            getStatus.status.message = 'Zoom restricted. Zooming out.';
            getStatus.status.zoomValueMaxAllowed = restrictionArray[i][4];
            Cam.cam.ptzCommand('PositionABS',position0,position1,1,0);
            break;
         } else {
            // move the Cam outside the restricted area
            getStatus.status.message = 'Restricted area. Moving Cam.';
            break;
         }
      } else {
         getStatus.status.inRestrictedArea = false;
         getStatus.status.message = 'View outside restricted areas, so do nothing.';
      }
   }
};
