require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const prefix = process.env.BOT_PREFIX;

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

const loadCommands = async () => {
    const files = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    for (const file of files) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
        // assign aliases
        if ('aliases' in command) {
            command.aliases.forEach(alias => client.aliases.set(alias, command.name));
        }
    }
};

loadCommands().then(() => client.login(process.env.TOKEN));

client.once('ready', async () => {
    console.log('Ready');
});

client.on('message', async message => {
    // ignore bots, non text channels, non guild channels, and messages without prefix
    if (message.author.bot || message.channel.type !== 'text' || !message.content.startsWith(prefix) || message.guild === null) return;

    // split message to arguments
    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const cmd = args.shift().toLowerCase();

    // find command
    let command;
    if (client.commands.has(cmd)) command = client.commands.get(cmd);
    else if (client.aliases.has(cmd)) command = client.commands.get(client.aliases.get(cmd));
    else return;

    command.run(message, args, client);
});
