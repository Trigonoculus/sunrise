const Discord = require('discord.js');
const { getLightColor } = require('../functions.js');
const airportDiscovery = require('@airport-discovery/metars-tafs');

module.exports = {
    name: 'metar',
    aliases: ['m'],
    description: 'Gets the latest METAR for an airport',
    run: async (message, args) => {
        // Search METAR
        if(!args[0]) return message.channel.send('An ICAO airport code is needed.');
        const airport = args[0];
        let metar;
        try {
            metar = await airportDiscovery.metars(airport);
        } catch(err) {
            console.log(err);
            return message.channel.send('An error has occurred while looking up the METAR.');
        }
        // Check undefined
        if (typeof metar === undefined) {
            return message.channel.send(`No data returned. Either an incorrect airport was given (${airport}) or no METARs are available at this time.`)
        }
        // Make embed
        const embed = new Discord.MessageEmbed()
            .setTitle(`Weather information for ${airport}`)
            .setTimestamp()
            .setColor(getLightColor('gray'))
            .addFields(
                // { name: search.name, value: `${adminName}${search.countryName} ${flagEmoji}`, inline: false },
            );
    },
};