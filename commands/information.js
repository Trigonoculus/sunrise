const Discord = require('discord.js');
const { geonamesSearch, getLightColor } = require('../functions.js');
const commaNumber = require('comma-number');
const tzlookup = require('tz-lookup-oss');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
    name: 'information',
    aliases: ['info', 'place', 'i'],
    description: 'Gets the information for a place',
    run: async (message, args) => {
        let search, tzQuery;
        try {
            message.channel.startTyping();
            search = await geonamesSearch(args.join(' '));
        } catch (err) {
            message.channel.stopTyping();
            console.log(err);
            return message.channel.send('An error has occurred.');
        }
        try {
            tzQuery = tzlookup(search.lat, search.lng);
        } catch (err) {
            message.channel.stopTyping();
            console.log(err);
            return message.channel.send('An error has occurred.');
        }
        const adminName = (!search.adminName1 === '') ? `${search.adminName1}, ` : '';
        const flagEmoji = !(typeof search.countryCode === 'undefined') ? `:flag_${search.countryCode.toLowerCase()}:` : '';
        const embed = new Discord.MessageEmbed()
            .setTitle(`Place Information for ${search.name}`)
            // .setTimestamp()
            .setFooter('☔ It\'s Raining After All')
            .setColor(getLightColor('blue'))
            .addFields(
                { name: search.name, value: `${adminName}${search.countryName} ${flagEmoji}`, inline: false },
                { name: 'Type', value: search.fcodeName, inline: false },
                { name: 'Population', value: commaNumber(search.population), inline: true },
                { name: 'Latitude', value: search.lat, inline: true },
                { name: 'Longitude', value: search.lng, inline: true },
                { name: 'Timezone', value: tzQuery, inline: true },
                { name: 'Current time', value: dayjs(new Date()).tz(tzQuery).format('HH:mm:ssZ'), inline: true },
            );
        message.channel.send(embed);
        message.channel.stopTyping();
    },
};