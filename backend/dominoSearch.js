var rp = require('request-promise');
var _ = require('lodash');

function buildDisplayName(addressDoc) {
  var firstname = _.trim(addressDoc.Firstname);
  var lastName = _.trim(addressDoc.Lastname);
  var company = _.trim(addressDoc.Company);

  var displayName = firstname + ' ' + lastName;
  if (!_.isEmpty(company)) {
    displayName = displayName + ' (' + company + ')';
  }
  return _.trim(displayName);
}

function addAuthIfPresent(reqOptions) {
  var dominoUser = '';
  if (typeof process.env.DOMINO_USER == 'string') {
    dominoUser = _.trim(new Buffer(process.env.DOMINO_USER, 'base64').toString());
  }
  var dominoPass = '';
  if (typeof process.env.DOMINO_PASS == 'string') {
    dominoPass = _.trim(new Buffer(process.env.DOMINO_PASS, 'base64').toString());
  }
  if (!_.isEmpty(dominoUser) && !_.isEmpty(dominoPass)) {
    reqOptions.auth = {
      user: dominoUser,
      pass: dominoPass
    }
  }
  return reqOptions;
}

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
    resolveWithFullResponse: true,
    qs: {
      search: phoneNumber
    },
    json: true
  };

  addAuthIfPresent(dominoReqOptions);

  rp(dominoReqOptions).then(function (response) {
    if (response.headers['content-type'] != 'application/json') {
      var err = new Error('No JSON response received');
      callback(err, null);
      return;
    }
    var searchResult = response.body;
    console.log('Found ' + searchResult.length + ' documents');

    if (searchResult.length == 0) {
      var err = new Error('No results found');
      callback(err, null);
    } else if (searchResult.length == 1) {
      // Load resulting document
      var resultName = 'Unbekannt';
      rp(addAuthIfPresent({uri: dominoSearchHost + searchResult[0]['@link'].href, json: true})).then(function (result) {
        if (result.AddressType == '1') {
          resultName = buildDisplayName(result);
        } else if (result.AddressType == '2') {
          resultName = result.Company;
        } else {
          var err = new Error('Unknown AddressType: ' + result.AddressType);
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
