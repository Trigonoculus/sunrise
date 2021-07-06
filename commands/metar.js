const Discord = require('discord.js');
const { getLightColor, findAirport, convertinHg, parseRawMetarObsTime } = require('../functions.js');
const airportDiscovery = require('@airport-discovery/metars-tafs');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const duration = require('dayjs/plugin/duration');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

module.exports = {
    name: 'metar',
    aliases: ['m'],
    description: 'Gets the latest METAR for an airport',
    run: async (message, args) => {
        // Search METAR
        if(!args[0]) return message.channel.send('An ICAO airport code is needed.');
        message.channel.startTyping();
        const airport = args[0];
        console.log(airport);
        let metar;
        try {
            metar = await airportDiscovery.metars(airport);
        } catch(err) {
            console.log(err);
            message.channel.stopTyping();
            return message.channel.send('An error has occurred while looking up the METAR.');
        }
        console.log(metar);
        // Check undefined
        if (typeof metar === undefined) {
            message.channel.stopTyping();
            return message.channel.send(`No data returned. Either an incorrect airport was given (${airport}) or no METARs are available at this time.`);
        }
        // Find airport
        let airportData;
        try {
            airportData = await findAirport(airport);
            console.log(airportData);
        } catch(err) {
            console.log(err);
            message.channel.stopTyping();
            return message.channel.send(`An error occurred while finding airport data for ${airport}.`);
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
        // Make embed
        const embed = new Discord.MessageEmbed()
            .setTitle(`Weather information for ${airport}`)
            .setFooter(`Observed ${obsTimeDifferenceMins.toFixed(0)} minutes ago`)
            .setTimestamp(obsTime)
            .setColor(getLightColor('gray'))
            .addFields(
                { name: airportData.name, value: `${airportData.city}, ${airportData.country.toUpperCase()}`, inline: false },
                { name: 'Airport Information', value: `**${dayjs(new Date()).tz(airportData.tz).format('HH:mm')}** | ${airportData.lat.toFixed(3)}, ${airportData.long.toFixed(3)} | ${airportData.altitude}ft`, inline: false },
                { name: 'Raw METAR', value: '`' + metar.rawText + '`', inline: false },
                { name: 'Wind', value: `${windFormat}`, inline: true },
                { name: 'Temperature / Dew', value: `${metar.temperatureC}°C / ${metar.dewPointC}°C`, inline: true },
                { name: 'Pressure', value: `${convertinHg(metar.altimInHg)} hPa`, inline: true },
            );
        message.channel.send(embed);
        message.channel.stopTyping();
    },
};