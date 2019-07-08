var express = require('express');
var router = express.Router();
var search = require('../backend/dominoSearch.js');
var mongoose = require('mongoose');
var _ = require('lodash');

/* Reply to status check requests. */
router.head('/', function(req, res) {
  res.end();
});

router.post('/', function(req, res) {
  
  ciscoAttributes = req.body.request.subject[0].attribute;
  var phoneNumber = '';
  var calledNumber = '';
  var transformedcgpn = '';
  var transformedcdpn  = '';
  ciscoAttributes.forEach(function(attr) {
    if ( attr.$.AttributeId === 'urn:Cisco:uc:1.0:callingnumber') {
      phoneNumber = attr.attributevalue[0].toString();
    }
    if ( attr.$.AttributeId === 'urn:Cisco:uc:1.0:callednumber') {
      calledNumber = attr.attributevalue[0].toString();
    }
    if ( attr.$.AttributeId === 'urn:Cisco:uc:1.0:transformedcgpn') {
      transformedcgpn = attr.attributevalue[0].toString();
    }
    if ( attr.$.AttributeId === 'urn:Cisco:uc:1.0:transformedcdpn') {
      transformedcdpn = attr.attributevalue[0].toString();
    }
  });
  if (typeof process.env.MONGO_HOST === 'string' &&
      typeof process.env.MONGO_DB === 'string') {
    var mongoHost = _.trim(process.env.MONGO_HOST);
    var mongoDb = _.trim(process.env.MONGO_DB);

    mongoose.Promise = global.Promise;

    var connectionOptions = { useNewUrlParser: true };
    var connectionString = "";
    if (typeof process.env.MONGO_USER === 'string' &&
      typeof process.env.MONGO_PASS === 'string') {
      connectionOptions.user = _.trim(process.env.MONGO_USER);
      connectionOptions.pass = _.trim(process.env.MONGO_PASS);
    }
    connectionString = 'mongodb://' + mongoHost + '/' + mongoDb;

    var db = mongoose.createConnection(connectionString, connectionOptions);

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
      var callLogSchema = mongoose.Schema({
        fromNumber: String,
        toNumber: String,
        callDate: Date,
	tzOffset: Number,
	transformedCgpn: String,
	transformedCdpn: String
      });
      var CallLog = db.model('callLog', callLogSchema);
      var now = new Date();
      var callLogEntry = new CallLog({
        fromNumber: phoneNumber,
        toNumber: calledNumber,
        callDate: now,
	tzOffset: now.getTimezoneOffset(),
	transformedCgpn: transformedcgpn,
	transformedCdpn: transformedcdpn
      });
      console.log("Saving entry");
      callLogEntry.save(function (err, callLogEntry) {
        if (err) { console.error(err); }
        console.log("Saved entry: " + callLogEntry);
        db.close();
      });
    });
  }
 
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
