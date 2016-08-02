var rp = require('request-promise');

function searchForPhoneNumber(phoneNumber, callback) {

  var dominoSearchHost = 'http://ln01app.scanplus.local';
  var dominoSearchURL = dominoSearchHost + '/scanplus/elwis/apps/elwis_sales_d.nsf/api/data/collections/unid/DC1BD152E06692A2C12571C500409560';

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
	}
        callback(null, resultName);
      });
    } else {
      var err = new Error('Too many results found');
      callback(err, null);
    }
  });
}

module.exports = searchForPhoneNumber;
