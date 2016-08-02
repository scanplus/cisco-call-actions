var express = require('express');
var router = express.Router();
var search = require('../backend/dominoSearch.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  var phoneNumber = req.query.phone;
  
  if( typeof phoneNumber != 'undefined' && phoneNumber.trim() != '') {
    console.log('Searching for ' + phoneNumber);
    search(phoneNumber, function(err, name) {
      console.log('Found: ' + name);
      res.render('index', { res: name, phone: phoneNumber });
    });
  } else{
    res.render('index', { });
  }

});

module.exports = router;
