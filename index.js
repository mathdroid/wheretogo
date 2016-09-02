'use strict';
const got = require('got');
const promisify = require('promisify-node');
const geocoder = require('geocoder');
const moment = require('moment')

const baseUrl = 'https://a.omgwhen.com/Yoosh/YooshFeService/json2/'

const endpoints = {
  'getEventsByGeoEntity': 'getEventsByGeoEntity',
  'getEventsByPointAndRadius': 'getEventsByPointAndRadius'
}

function getGeocode (str, callback) {
  geocoder.geocode(str, callback)
}
let wrap = promisify(getGeocode)

function newDate () {
  let timeStr = new Date()
  // timeStr.setHours(4, 0, 0, 0)
  // console.log(timeStr.toISOString())
  return moment(timeStr).format()
}

function searchFilters (obj) {
  if (obj.googleGeoObject) {
    return `{
      "hoursAhead":5,
      "radius":5,
      "time":"${newDate()}",
      "googleGeoObject":${obj.googleGeoObject},
      "ongoingHours":0,
      "promoted":false
    }`
  }
  if (obj.pointAndRadius) {
    return `{
      "coordinates": {
        "lat": ${obj.pointAndRadius.lat},
        "lng": ${obj.pointAndRadius.lng}
      },
      "ongoingHours":1,
      "radius": ${obj.pointAndRadius.radius},
      "searchTerm": "",
      "time":"${newDate()}",
    }`
  }

}

let options = obj => {
  let opt = {
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
      "SearchFilters": ${searchFilters(obj)}
    }`
  }
  // console.log(opt)
  return opt

}

module.exports = (str, uri, opts) => {
  if (uri) {
    return got.post(uri, options).then(res => JSON.parse(res.body)).then(set => {
      // console.log(set.ResultSet.Events.length)
      return {
        status: set.Successful,
        events: set.ResultSet && set.ResultSet.Events,
        cursor: set.ResultSet && set.ResultSet.cursor,
      }
    })
  } else {
    let uri
    if (str.includes(',')) {
      // point and radius
      let loc =  str.slice(1, str.length - 1).split(',')
      uri = baseUrl + 'getEventsByPointAndRadius'
      return got.post(uri, options({
        pointAndRadius: {
          lat: loc[0],
          lng: loc[1],
          radius: loc[2]
        }
      })).then(res => {
        // console.log(res.body)
        let result = {}
        try {
          result = JSON.parse(res.body)
        }
        catch (e) {
          result = {
            Successful: false,
            msg: e
          }
        }
        return result
      }).then(set => {
        return {
          status: set.Successful,
          events: set.ResultSet && set.ResultSet.Events,
          cursor: set.ResultSet && set.ResultSet.cursor,
          uri
        }
      })

    } else {
      // location search
      return wrap(str).then(res => {
          return res.results.map(place => JSON.stringify(place))
        }).then(googleGeoObject => {
          uri = baseUrl + 'getEventsByGeoEntity'
          return got.post(uri, options({googleGeoObject: googleGeoObject}))
        }).then(res => JSON.parse(res.body)).then(set => {
          return {
            status: set.Successful,
            events: set.ResultSet && set.ResultSet.Events,
            cursor: set.ResultSet && set.ResultSet.cursor,
            uri
          }
        })
    }
  }
}
