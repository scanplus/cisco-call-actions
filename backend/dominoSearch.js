var rp = require('request-promise');

function searchForPhoneNumber(phoneNumber, callback) {

  var dominoSearchHost = process.env.DOMINO_SEARCH_HOST;
  if (typeof dominoSearchHost != 'string' || dominoSearchHost.trim().length == 0) {
    var err = new Error('DOMINO_SEARCH_HOST is not set');
    callback(err, null);
    return;
  }
  var dominoSearchURL = process.env.DOMINO_SEARCH_URL;
  if (typeof dominoSearchURL != 'string' && dominoSearchURL.trim().length == 0) {
    var err = new Error('DOMINO_SEARCH_URL is not set');
    callback(err, null);
    return;
  }

  dominoSearchURL = dominoSearchHost + dominoSearchURL;

  var dominoReqOptions = {
    uri: dominoSearchURL,
    qs: {
      search: phoneNumber
    },
    json: true
  };

  rp(dominoReqOptions).then(function (response) {
    console.log('Found ' + response.length + ' documents');
    if (response.length == 0) {
      var err = new Error('No results found');
      callback(err, null);
    } else if (response.length == 1) {
      // Load resulting document
      var resultName = 'Unbekannt';
      rp({uri: dominoSearchHost + response[0]['@link'].href, json: true}).then(function (result) {
        if (result.AddressType == '1') {
          resultName = result.Firstname + ' ' + result.Lastname;
        } else if (result.AddressType == '2') {
          resultName = result.Company;
        } else {
          var err = new Error('Unkown AddressType: ' + result.AddressType);
          callback(err, null);
	  return;
	}
        callback(null, resultName);
	return;
      }).catch(function (err) {
	callback(err, null);
	return;
      });
    } else {
      var err = new Error('Too many results found');
      callback(err, null);
      return;
    }
  }).catch(function (err) {
    callback(err, null);
    return;
  });
}

module.exports = searchForPhoneNumber;
