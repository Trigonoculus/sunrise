module.exports = {
    name: 'ping',
    aliases: [],
    description: 'Ping!',
    run: async (message) => {
        return message.channel.send('Pong.');
    },
};