const Discord = require('discord.js');
const { findAirport, getSeason } = require('../functions.js');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const duration = require('dayjs/plugin/duration');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
const SunCalc = require('suncalc');
const prettyms = require('pretty-ms');
const dateparser = require('any-date-parser');

function formatSunString(date, tz) {
    const string = isNaN(date) ? '--:--' : dayjs(date).tz(tz).format('HH:mm');
    return string;
}

module.exports = {
    name: 'sun-airport',
    aliases: ['sa', 's-a', 'sun-a', 'as'],
    description: 'Gets sun times for an airport.',
    run: async (message, args) => {
        // checks
        if(!args[0]) return message.channel.send('An 3-letter airport code (IATA) or an ICAO code is needed.');
        if(!(args[0].length === 3 | args[0].length === 4)) return message.channel.send('Invalid length. Only airport codes are accepted');

        // start
        message.channel.startTyping();
        const airport = args[0].toUpperCase();

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

        // Check if date is provided
        let dateProvided, dateObj;
        if (!args[1]) {
            dateProvided = false;
            dateObj = new Date();
        } else {
            const providedDate = args;
            providedDate.shift();
            dateObj = dateparser.fromString(providedDate.join(' '));
        }

        // Sun calculation
        let sun, polarStatus;
        const tz = airportData.tz;
        try {
            sun = SunCalc.getTimes(dateObj, airportData.lat, airportData.long);
        } catch (err) {
            message.channel.stopTyping();
            console.error(err);
            return message.channel.send('An error has occurred.');
        }
        const season = getSeason(airportData.lat, new Date());
        if (isNaN(sun.sunrise) || isNaN(sun.sunset)) {
            if (season === 'winter') polarStatus = 'down all day';
            if (season === 'summer') polarStatus = 'up all day';
        }

        // Sun string formatting
        const dawn = formatSunString(sun.dawn, tz);
        const sunrise = formatSunString(sun.sunrise, tz);
        const sunset = formatSunString(sun.sunset, tz);
        const dusk = formatSunString(sun.dusk, tz);
        const sunStringLocal = `${dawn} ↗️ ${sunrise} ☀️ ${sunset} ↘️ ${dusk}${(polarStatus) ? ' [' + polarStatus + ']' : ''}`;
        const sunStringAdapt = `<t:${(sun.dawn / 1000).toFixed(0)}:t> ↗️ <t:${(sun.sunrise / 1000).toFixed(0)}:t> ☀️ <t:${(sun.sunset / 1000).toFixed(0)}:t> ↘️ <t:${(sun.dusk / 1000).toFixed(0)}:t>${(polarStatus) ? ' [' + polarStatus + ']' : ''}`;

        const dawnZ = formatSunString(sun.dawn, 'UTC');
        const sunriseZ = formatSunString(sun.sunrise, 'UTC');
        const sunsetZ = formatSunString(sun.sunset, 'UTC');
        const duskZ = formatSunString(sun.dusk, 'UTC');
        const sunStringUtc = `${dawnZ} ↗️ ${sunriseZ} ☀️ ${sunsetZ} ↘️ ${duskZ}${(polarStatus) ? ' [' + polarStatus + ']' : ''}`;

        // day length
        let dayLength;
        if (polarStatus) {
            if (polarStatus === 'Up all day') dayLength = '24 hours';
            if (polarStatus === 'Down all day') dayLength = 'None';
        } else {
            dayLength = prettyms(sun.sunset - sun.sunrise, { secondsDecimalDigits: 0 });
        }

        // Make embed
        const embed = new Discord.MessageEmbed()
            .setTitle(`Sun information for ${!(airportData.iata === '\\N') ? airportData.iata + ' / ' : ''}${airportData.icao}`)
            .setTimestamp(dateObj)
            .setColor('#A7DB42')
            .addFields(
                { name: airportData.name, value: `${airportData.city}, ${airportData.country.toUpperCase()}`, inline: false },
                { name: 'Local time', value: dayjs(new Date()).tz(airportData.tz).format('HH:mm Z'), inline: true },
                { name: 'UTC', value: dayjs(new Date()).tz('UTC').format('HH:mmz'), inline: true },
                { name: 'Day length', value: dayLength, inline: true },
                { name: 'Sun: Local', value: sunStringLocal, inline: false },
                { name: 'Sun: UTC', value: sunStringUtc, inline: false },
                { name: 'Sun: Adaptive', value: sunStringAdapt, inline: false },
            );
        message.channel.send(embed);
        message.channel.stopTyping();
    },
};