require('dotenv').config();
const Geonames = require('geonames.js');
const geonamesUser = process.env.GEONAMES_USER;
const geonames = Geonames({
    username: geonamesUser,
    lan: 'en',
    encoding: 'JSON',
});
const randomColor = require('randomcolor');

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
};