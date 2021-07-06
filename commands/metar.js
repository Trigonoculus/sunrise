const Discord = require('discord.js');
const { findAirport, convertinHg, parseRawMetarObsTime, getSeason } = require('../functions.js');
const airportDiscovery = require('@airport-discovery/metars-tafs');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const duration = require('dayjs/plugin/duration');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
const SunCalc = require('suncalc');

function formatSunString(date, tz) {
    const string = isNaN(date) ? '--:--' : dayjs(date).tz(tz).format('HH:mm');
    return string;
}

module.exports = {
    name: 'metar',
    aliases: ['m', 'wx'],
    description: 'Gets the latest METAR for an airport',
    run: async (message, args) => {
        // checks
        if(!args[0]) return message.channel.send('An 3-letter airport code (IATA) or an ICAO code is needed.');
        if(!(args[0].length === 3 | args[0].length === 4)) return message.channel.send('Invalid length. Only airport codes are accepted');
        // start
        message.channel.startTyping();
        let airport = args[0].toUpperCase();
        console.log(airport);
        // Find airport
        let airportData;
        try {
            airportData = await findAirport(airport);
        } catch(err) {
            console.error(err);
            message.channel.stopTyping();
            return message.channel.send(`An error occurred while finding airport data for ${airport}.`);
        }
        // Check undefined
        if (typeof airportData === 'undefined' || airportData.tz === '\\N') {
            message.channel.stopTyping();
            return message.channel.send(`No data found. Looks like an incorrect airport was given (${airport}).`);
        }
        if (airport.length === 3) airport = airportData.icao;
        // METAR query
        let metar;
        try {
            metar = await airportDiscovery.metars(airport);
        } catch(err) {
            console.error(err);
            message.channel.stopTyping();
            return message.channel.send('An error has occurred while looking up the METAR.');
        }
        // Check undefined
        if (typeof metar === 'undefined') {
            message.channel.stopTyping();
            return message.channel.send(`No data found. No METARs are available for ${airport} at this time.`);
        }
        // Wind formatting
        let windFormat;
        if (metar.wind.speedKt <= 3) {
            windFormat = 'Wind calm';
        } else {
            windFormat = `${metar.wind.directionDegrees}° at ${metar.wind.speedKt} knots`;
        }
        // Get observation time + difference
        const obsTime = parseRawMetarObsTime(metar.rawText);
        const obsTimeDifference = new Date() - obsTime;
        const obsTimeDifferenceMins = obsTimeDifference / 60000;
        // Sun calculation
        let sun, polarStatus;
        const tz = airportData.tz;
        try {
            sun = SunCalc.getTimes(new Date(), airportData.lat, airportData.long);
        } catch (err) {
            message.channel.stopTyping();
            console.error(err);
            return message.channel.send('An error has occurred.');
        }
        if(isNaN(sun.sunrise) || isNaN(sun.sunset)) {
            const season = getSeason(airportData.lat, new Date());
            if (season === 'winter') polarStatus = 'down all day';
            if (season === 'summer') polarStatus = 'up all day';
        }
        // Sun string formatting
        const dawn = formatSunString(sun.dawn, tz);
        const sunrise = formatSunString(sun.sunrise, tz);
        const sunset = formatSunString(sun.sunset, tz);
        const dusk = formatSunString(sun.dusk, tz);
        const sunString = `${dawn} ↗️ ${sunrise} ☀️ ${sunset} ↘️ ${dusk}${(polarStatus) ? ' [' + polarStatus + ']' : ''}`;
        // Make embed
        const embed = new Discord.MessageEmbed()
            .setTitle(`Weather information for ${!(airportData.iata === '\\N') ? airportData.iata + ' / ' : ''}${airportData.icao}`)
            .setFooter(`Observed ${obsTimeDifferenceMins.toFixed(0)} minutes ago`)
            .setTimestamp(obsTime)
            .setColor((obsTimeDifferenceMins <= 60) ? '#A7DB42' : '#FF7F7F')
            .addFields(
                { name: airportData.name, value: `${airportData.city}, ${airportData.country.toUpperCase()}`, inline: false },
                { name: 'Airport information', value: sunString, inline: false },
                { name: 'Local time', value: dayjs(new Date()).tz(airportData.tz).format('HH:mm Z'), inline: true },
                { name: 'Elevation', value: `${airportData.altitude}ft`, inline: true },
                { name: 'Coordinates', value: `${airportData.lat.toFixed(3)}, ${airportData.long.toFixed(3)}`, inline: true },
                { name: 'Raw METAR', value: '`' + metar.rawText + '`', inline: false },
                { name: 'Wind', value: `${windFormat}`, inline: true },
                { name: 'Temperature / Dew', value: `${metar.temperatureC}°C / ${metar.dewPointC}°C`, inline: true },
                { name: 'Pressure', value: `${convertinHg(metar.altimInHg)} hPa`, inline: true },
            );
        message.channel.send(embed);
        message.channel.stopTyping();
    },
};