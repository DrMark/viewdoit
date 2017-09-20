var express = require('express'),
    router = express.Router();

/* GET cgi-bin page. */
router.get('/', function(req, res, next) {
   console.log('in cgi-bin');
    res.status(403).send('Not Acceptable');
});

/* GET cgi-bin/ptz.cgi page. */
/* This should handle PTZ functions & zoom */
router.get('/ptz.cgi', function(req, res, next) {

  ptz.storeReqs(req, res);

});

module.exports = router;
