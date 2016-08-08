var express = require('express');
var router = express.Router();
var rp = require('request-promise');

function checkDominoBackend(callback) {
  var dominoSearchHost = process.env.DOMINO_SEARCH_HOST;
  if (typeof dominoSearchHost != 'string' || dominoSearchHost.trim().length == 0) {
    var err = new Error('DOMINO_SEARCH_HOST is not set');
    callback(err, null);
    return;
  }
  var reqOptions = {
    uri: dominoSearchHost + '/',
    resolveWithFullResponse: true,
    timeout: 1000
  }

  rp(reqOptions).then(function (response) {
    if (response.statusCode == 200) {
      callback(null, true);
      return;
    } else {
      var err = new Error('DOMINO_SEARCH_HOST send status code:' + response.statusCode);
      callback(err, null);
      return;
    }
  }).catch(function (err) {
    callback(err, null);
    return;
  });
}

function check(req, res) {
  checkDominoBackend(function(err, checkResult) {
    if(err) {
      console.error(err);
      res.status(500).end();
      return;
    }
    if(checkResult) {
      res.status(200).end();
      return;
    }
    res.status(500).end();
  });
}

router.get('/live', function(req, res, next) {
  check(req, res);
});

router.get('/ready', function(req, res, next) {
  check(req, res);
});

module.exports = router;
