'use strict';
const got = require('got');
const promisify = require('promisify-node');
const geocoder = require('geocoder');

// module.exports = str => got('emoji.getdango.com/api/emoji', {
// 	json: true,
// 	query: {
// 		q: str
// 	}
// }).then(res => res.body.results.map(x => x.text));

// "SearchFilters":{
//   "hoursAhead":5,
//   "tree":{"Sub":{"Popular":{}}},
//   "radius":5,
//   "time":"${newDate()}",
//   "googleGeoObject":${googleGeoObject},
//   "ongoingHours":0,
//   "promoted":false}}`,

function getGeocode (str, callback) {
  geocoder.geocode(str, callback)
}
let wrap = promisify(getGeocode)

function newDate () {
  let timeStr = new Date()
  // timeStr.setHours(4, 0, 0, 0)
  // console.log(timeStr.toISOString())
  return timeStr.toISOString()
}

module.exports = str => wrap(str).then(res => {
  return res.results.map(place => JSON.stringify(place))
}).then(googleGeoObject => got.post('https://a.omgwhen.com/Yoosh/YooshFeService/json2/getEventsByGeoEntity', {
  headers: {
    'Origin': 'https://omgwhen.com',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.8,id;q=0.6,ms;q=0.4',
    'Authorization': 'Yoo-sess null',
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
    'Cache-Control': 'max-age=0',
    'Referer': 'https://omgwhen.com/',
    'Connection': 'keep-alive',
  },
  body: `{
    "APIKey":"1.0.0___3659E990-DDBB-42F6-B9DA-5E39B301FE74",
    "DeviceType":2,
    "DeviceId":null,
    "RequestingUserId":"00000000-0000-0000-0000-000000000001",
    "SearchFilters":{
      "hoursAhead":5,
      "radius":5,
      "time":"${newDate()}",
      "googleGeoObject":${googleGeoObject},
      "ongoingHours":0,
      "promoted":false}}`,
})).then(res => JSON.parse(res.body)).then(res => res.ResultSet).then(set => {
  if (set.Events.length > 0) {
    return set.Events
  } else {
    return []
  }
})
