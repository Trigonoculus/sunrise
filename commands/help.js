require('dotenv').config();
const prefix = process.env.BOT_PREFIX;

module.exports = {
    name: 'help',
    aliases: ['h'],
    description: 'Lists all available commands or information about a specific command.',
    run: async (message, args) => {
        const data = [];
        const { commands } = message.client;
        if (!args.length) {
            data.push('Available commands:' + '`' + commands.map(command => command.name).join('`, `') + '`');
            data.push(`\nYou can send \`${prefix}help [command name]\` to get info on a specific command.`);

            return message.author.send(data, { split: true })
                .then(() => {
                    if (message.channel.type === 'dm') return;
                    message.channel.send('I\'ve sent you a DM with all my commands :)');
                })
                .catch(error => {
                    console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
                    message.channel.send('It seems like I can\'t DM you! Do you have DMs disabled?');
                });
        }
        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

        if (!command) {
            return message.channel.send('That\'s not a valid command.');
        }

        data.push(`**Command:** ${command.name}`);

        if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
        if (command.description) data.push(`**Description:** ${command.description}`);
        if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);

        message.channel.send(data, { split: true });

    },
};