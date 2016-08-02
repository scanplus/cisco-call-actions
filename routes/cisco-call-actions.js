var express = require('express');
var router = express.Router();
var search = require('../backend/dominoSearch.js');

/* Reply to status check requests. */
router.head('/', function(req, res) {
  res.end();
});

router.post('/', function(req, res) {

  var parser = require('xml2json');
  var ciscoRequest = parser.toJson(req.rawBody);
  ciscoAttributes = JSON.parse(ciscoRequest).Request.Subject.Attribute;
 
  ciscoAttributes = Array.from(ciscoAttributes);
  var phoneNumber = '';
  ciscoAttributes.forEach(function(attr) {
    console.log(attr.AttributeId + ' has value -> ' + attr.AttributeValue);
    if (attr.AttributeId == 'urn:Cisco:uc:1.0:callingnumber') {
      phoneNumber = attr.AttributeValue;
    }
  }); 

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
