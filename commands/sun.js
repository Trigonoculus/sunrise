const Discord = require('discord.js');
const { geonamesSearch, getLightColor, getSeason } = require('../functions.js');
const tzlookup = require('tz-lookup-oss');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const duration = require('dayjs/plugin/duration');
const SunCalc = require('suncalc');
const prettyms = require('pretty-ms');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

module.exports = {
    name: 'sun',
    aliases: ['sunrise', 'sunset', 's'],
    description: 'Gets the information for a place',
    run: async (message, args) => {
        let search, tzQuery, sun, polarStatus;
        try {
            message.channel.startTyping();
            search = await geonamesSearch(args.join(' '));
        } catch (err) {
            message.channel.stopTyping();
            console.log(err);
            return message.channel.send('An error has occurred while looking up the provided place.');
        }
        try {
            tzQuery = tzlookup(search.lat, search.lng);
        } catch (err) {
            message.channel.stopTyping();
            console.log(err);
            return message.channel.send('An error has occurred.');
        }
        const date = new Date();
        try {
            sun = SunCalc.getTimes(date, search.lat, search.lng);
        } catch (err) {
            message.channel.stopTyping();
            console.log(err);
            return message.channel.send('An error has occurred.');
        }
        if(isNaN(sun.sunrise) || isNaN(sun.sunset)) {
            const season = getSeason(search.lat, date);
            if (season === 'winter') polarStatus = 'Down all day';
            if (season === 'summer') polarStatus = 'Up all day';
        }
        // admin name
        const adminName = !(search.adminName1 === '') ? `${search.adminName1}, ` : '';
        // try flag emoji
        const flagEmoji = !(typeof search.countryCode === 'undefined') ? `:flag_${search.countryCode.toLowerCase()}:` : '';
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
            .setTitle(`Place Information for ${search.name}`)
            // .setTimestamp()
            .setFooter('☔ It\'s Raining After All')
            .setColor(getLightColor('red'))
            .addFields(
                { name: search.name, value: `${adminName}${search.countryName} ${flagEmoji}`, inline: false },
                { name: 'Latitude', value: search.lat, inline: true },
                { name: 'Longitude', value: search.lng, inline: true },
                { name: 'Current time', value: `${dayjs(new Date()).tz(tzQuery).format('HH:mm:ssZ')} - ${tzQuery}`, inline: false },
                { name: 'Sunrise', value: isNaN(sun.sunrise) ? polarStatus : dayjs(sun.sunrise).tz(tzQuery).format('HH:mm'), inline: true },
                { name: 'Sunset', value: isNaN(sun.sunset) ? polarStatus : dayjs(sun.sunset).tz(tzQuery).format('HH:mm'), inline: true },
                { name: 'Day length', value: dayLength, inline: true },
            );
        message.channel.send(embed);
        message.channel.stopTyping();
    },
};