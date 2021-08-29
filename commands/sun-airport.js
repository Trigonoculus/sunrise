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

function formatAdaptive(date, type) {
    const string = isNaN(date) ? '--:--' : `<t:${(date / 1000).toFixed(0)}:${type}>`;
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
        const sunStringLocal = `**Dawn** at ${dawn} LT\n**Sunrise** at ${sunrise} LT\n**Sunset** at ${sunset} LT\n**Dusk** at ${dusk} LT`;
        const sunStringAdapt = `**Dawn** at ${formatAdaptive(sun.dawn, 't')}\n**Sunrise** at ${formatAdaptive(sun.sunrise, 't')}\n**Sunset** at ${formatAdaptive(sun.sunset, 't')}\n**Dusk** at ${formatAdaptive(sun.dusk, 't')}`;

        const dawnZ = formatSunString(sun.dawn, 'UTC');
        const sunriseZ = formatSunString(sun.sunrise, 'UTC');
        const sunsetZ = formatSunString(sun.sunset, 'UTC');
        const duskZ = formatSunString(sun.dusk, 'UTC');
        const sunStringUtc = `**Dawn** at ${dawnZ} UTC\n**Sunrise** at ${sunriseZ} UTC\n**Sunset** at ${sunsetZ} UTC\n**Dusk** at ${duskZ} UTC`;

        // day length
        let dayLength;
        if (polarStatus) {
            if (polarStatus === 'up all day') dayLength = 'Sun is up all day.';
            if (polarStatus === 'down all day') dayLength = 'Sun is down all day.';
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
                { name: 'Current LT', value: dayjs(new Date()).tz(airportData.tz).format('HH:mm Z'), inline: true },
                { name: 'UTC', value: dayjs(new Date()).tz('UTC').format('HH:mmz'), inline: true },
                { name: 'Day length', value: dayLength, inline: true },
                { name: 'Local', value: sunStringLocal, inline: true },
                { name: 'UTC', value: sunStringUtc, inline: true },
                { name: 'Adaptive', value: sunStringAdapt, inline: true },
            );
        message.channel.send(embed);
        message.channel.stopTyping();
    },
};