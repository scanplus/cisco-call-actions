var express = require('express');
var router = express.Router();
var search = require('../backend/dominoSearch.js');

/* Reply to status check requests. */
router.head('/', function(req, res) {
  res.end();
});

router.post('/', function(req, res) {
  
  ciscoAttributes = req.body.request.subject[0].attribute;
  var phoneNumber = '';
  ciscoAttributes.forEach(function(attr) {
    if ( attr.$.AttributeId == 'urn:Cisco:uc:1.0:callingnumber') {
      phoneNumber = attr.attributevalue[0].toString();
    }
  }); 
 
  res.header('Content-Type', 'application/xml');

  if (phoneNumber.length < 5 ) {
    res.render('cisco-res-noop');
    return;
  }

  console.log('Searching for ' + phoneNumber);
  search(phoneNumber, function(err, name) {
    if (err) {
      console.log(err);
      res.render('cisco-res-noop');
      return;
    }
    console.log('Found: ' + name);
    res.render('cisco-res-change-callingname', { res: name });
  });

});

module.exports = router;
