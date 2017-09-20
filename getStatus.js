var env = process.env.NODE_ENV || 'development';
config = require('./config')[env];

//getStatus = {status: {focus:{focusPosition:851.000000,status:"Unknown"},
//   iris:{irisValue:4.000000,status:"Idle"},
//   status:'Unknown',
//   moveStatus:'Idle',
//   pts:0,
//   position0:311.100000,
//   position1:11.100000,
//   position2:4.000000,
//   presetID:0,
//   sequence:0,
//   utc:0,
//   zoomStatus:0,
//   zoomValue:0
//}
//};

getStatus = {};
getStatus['status'] = {};
getStatus['status']['focus'] = {};
getStatus['status']['focus']['focusPosition'] = 851.00000;
getStatus['status']['iris'] = {};
getStatus['status']['iris']['irisValue'] = 4.00000;
getStatus['status']['iris']['status'] = 4.00000;
getStatus['status']['moveStatus'] = 'Idle';
getStatus['status']['pTS'] = 0;
getStatus['status']['position0'] = 311.100000;
getStatus['status']['position1'] = 11.100000;
getStatus['status']['position2'] = 4.000000;
getStatus['status']['presetID'] = 0;
getStatus['status']['sequence'] = 0;
getStatus['status']['uTC'] = 0;
getStatus['status']['zoomStatus'] = 'Idle';
getStatus['status']['zoomValue'] = 170;



/* the getStatus query results in an array of values like this:
["status.Focus.FocusPosition=1053.000000","status.Focus.Status=Unknown","status.Iris.IrisValue=4.000000","status.Iris.Status=Idle","status.MoveStatus=Idle","status.PTS=0","status.Postion[0]=311.100000","status.Postion[1]=11.100000","status.Postion[2]=4.000000","status.PresetID=0","status.Sequence=0","status.UTC=0","status.ZoomStatus=Idle","status.ZoomValue=170",""];
Note that the last value in the array is an empty string.

This file loops over all of the elements in the getStatus array. It creates a variable from the string and sets that variable equal
to the value in the string.
*/

var getStatusArray = ["status.Focus.FocusPosition=1053.000000","status.Focus.Status=Unknown","status.Iris.IrisValue=4.000000","status.Iris.Status=Idle","status.MoveStatus=Idle","status.PTS=0","status.Postion[0]=311.100000","status.Postion[1]=11.100000","status.Postion[2]=4.000000","status.PresetID=0","status.Sequence=0","status.UTC=0","status.ZoomStatus=Idle","status.ZoomValue=170",""];
// set the mainArray from the getStatus call in app.js
//mainArray = getStatus;

// function to go through the list of variable names and convert them to lowercase first letter.
// Used in a str.replace() function call
function replacer(match, p1, p2, p3, offset, string) {
   // p1 is nondigits, p2 digits, and p3 non-alphanumerics
   return match.toLowerCase();
};

function processStatus(getStatusArray) {
   var tempValueArray;
   var tempName;
   var tempValue;
   var getStatusArrayLength = getStatusArray.length;
   console.log('getStatusArray');
   console.log(getStatusArray);
   // loop the getStatus result and convert the string into individual values
   for (var i = 0; i < getStatusArrayLength; i++) {
      //console.log('i= '+i);
      getStatusArray[i] = getStatusArray[i].replace(/^status/,'getStatus.status');
      tempValueArray = getStatusArray[i].split("=");

      // lowercase the first letter after a period to get a better JS variable name
      // strip [ and ] from the variable names
      // Also, replace the misspelling of position (postion => position)
      tempName = tempValueArray[0].replace(/\.[a-zA-Z]/g,replacer).replace(/[\[\]]/g,'').replace(/ostion/g,'osition');
      tempValue = tempValueArray[1];
      //console.log('tempName= '+tempName);
      //console.log('tempValue= '+tempValue);

      if (tempName.length > 0 && isNaN(tempValue)==false) {
         // the variable has a name and a value that is a number
         console.log(tempName + ' is a number ' + tempValue);
         eval(tempName + ' = ' + tempValue);
         //console.log(eval(tempName));

      } else if (tempName.length > 0 && isNaN(tempValue)==true) {
         // the variable has a name and a value that is a string
         console.log(tempName + ' is a string ' + tempValue);
         eval(tempName + ' = ' + '"' + tempValue + '"');
         //console.log(eval(tempName));
      }
   }
};

function checkRestriction(position0, position1, zoomValue, restrictionArray) {
   var position0; // Horizontal: range 0-360;
   var position1; // Vertical: range 0-90;
   var zoomValue; // Zoom: range 100-1700;
   var restrictionArray; // [[300, 325, 10, 12, 100], [300, 325, 80, 90, 100]]
   var restrictionArrayLength = restrictionArray.length;

   // check to see if current position is in horizontal/vertical restricted area
   for (var i = 0; i < restrictionArrayLength; i++) {
      if (((position0 > restrictionArray[i][0]) && (position0 < restrictionArray[i][1])) &&
           (position1 > restrictionArray[i][2]) && (position1 < restrictionArray[i][3]) &&
           (zoomValue > restrictionArray[i][4])
         ) {
         if (restrictionArray[i][4] > 100) {
            // zoom the lens to the preset level
            console.log('Zoom restricted. Changing zoom level.');
            break;
         } else if (restrictionArray[i][4] == 100) {
            // zoom the lens all the way out
            console.log('Zoom restricted. Zooming out.');
            break;
         } else {
            // move the camera outside the restricted area
            console.log('Restricted area. Moving camera.');
            break;
         }
      } else {
         console.log('view outside restriction range');
      }
   }
};

checkRestriction(getStatus.status.position0, getStatus.status.position1, getStatus.status.zoomValue, config.camera.restrictions);

// This function doesn't return anything. It sets all of the individual values in the getStatus object.
processStatus(getStatusArray);

console.log('getStatus ' + JSON.stringify(getStatus));
console.log('getStatus.status.position0 ' + getStatus.status.position0);
console.log('getStatus.status.position1 ' + getStatus.status.position1);
console.log('getStatus.status.position2 ' + getStatus.status.position2);
console.log('getStatus.status.zoomValue ' + getStatus.status.zoomValue);
