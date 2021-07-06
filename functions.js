require('dotenv').config();
const Geonames = require('geonames.js');
const geonamesUser = process.env.GEONAMES_USER;
const geonames = Geonames({
    username: geonamesUser,
    lan: 'en',
    encoding: 'JSON',
});
const randomColor = require('randomcolor');
const airportData = require('./data/airports.json');

// init dayjs
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const duration = require('dayjs/plugin/duration');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

module.exports = {
    geonamesSearch: async function(place) {
        const search = await geonames.search({ q: place });
        const firstRes = search.geonames[0];
        return firstRes;
    },
    getLightColor: function(hue) {
        if (!hue) return randomColor({ luminosity: 'light' });
        return randomColor({ luminosity: 'light', hue: hue });
    },
    getSeason: function(lat, date) {
        const month = date.getMonth();
        if (month < 1 || month > 12) return null;
        if (month <= 3 || month > 9) {
            if (lat > 0) return 'winter';
            if (lat <= 0) return 'summer';
        } else {
            if (lat > 0) return 'summer';
            if (lat <= 0) return 'winter';
        }
    },
    findAirport: function(query) {
        if (query === null) return null;
        if (query.length === 3) return airportData.find(ap => ap.iata === query);
        if (query.length === 4) return airportData.find(ap => ap.icao === query);
    },
    convertinHg: function(qnh) { return (qnh * 33.864).toFixed(0); },
    parseRawMetarObsTime: function(metar) {
        // Construct observation date
        const string = metar.split(' ')[1];
        const now = new Date();
        const obsDate = string.slice(0, 2);
        const obsHour = string.slice(2, 4);
        const obsMinute = string.slice(4, 6);
        const curUTCMonth = dayjs(now).tz('UTC').get('month');
        const curUTCYear = dayjs(now).tz('UTC').get('year');
        // Finally we make date object
        const obsTimeObj = new Date(Date.UTC(curUTCYear, curUTCMonth, obsDate, obsHour, obsMinute, 0));
        return obsTimeObj;
    },
};