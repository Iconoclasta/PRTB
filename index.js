const path = require('path');
const { fork } = require('child_process');

const {User} = require('./src/db');

global.srcRoot = path.resolve(__dirname);
global.env = (process.argv[2] === '--production') ? process.env.NODE_ENV : "development";

const Snoowrap = require('snoowrap');

const dotenv = require('dotenv');

dotenv.config({ path: './src/data/config.env' });

const setupDatabase = require('./src/db/setup');

const runPoll = require('./src/handlers/handle_DMs.js');

if (!process.env.USER_AGENT || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.BOT_USERNAME || !process.env.BOT_PASSWORD) {
    console.log('Credentials not found.');
    process.exit(0);
}
const client = new Snoowrap({
    userAgent   : process.env.USER_AGENT,
    clientId    : process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username    : process.env.BOT_USERNAME,
    password    : process.env.BOT_PASSWORD
});

global.welcomeText = `Hello there! I'm /u/pivxtipbot, the official PIVX Reddit Tip Bot! You have interacted with me for the first time, so here's some information about my functionalities and commands. Should any problem arise please contact my maker /u/Bueris.` +
`\n\nTo begin using me, take a look at the following commands:` +
`\n\n    !history - Your history of tips.\n\n    !transactions - Your transactions (deposits/withdrawals)\n\n    !balance - Check your account balance.\n\n    !deposit - Get a new one-time deposit address\n\n    !withdraw [amount] [address] - Withdraw funds from your account` +
`\n\nIf you have existing balance, you can tip others by replying to a post/comment by them with \`/u/pivxtipbot tip [amount]\`. My code is fully open source! You can review it at http://tip.pivx.events . Have fun!`;

global.welcomeMessage = async function (username) {
    return client.composeMessage({ to: username, subject: "Welcome to PIVX Tip Bot!", text: global.welcomeText });
};

global.toFixed = function (num, fixed) {
    var re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
};

setupDatabase().then((result) => {

    global.agenda = result.agenda;

    console.log(`PIVX Tip Bot starting up...`);
    runPoll(client);

    let worker;

    if (process.argv[2] !== '--no-daemon') { worker = fork('./src/worker'); }

    worker.on('message', async (data) => {
        // TODO handle user ID and send message accordingly
        if (data.deposit) await depositMessage(data);
        else await withdrawMessage(data);
    });

});

async function depositMessage (data) {

    const user = await User.findById(data._id);

    if (!user) {
        return console.log('ERR: User not found');
    }

    return client.composeMessage({ to: user.username, subject: "Deposit Success", text: `Your deposit of **${data.amount}** PIVX has been credited.`});
}

async function withdrawMessage (data) {

    const user = await User.findById(data._id);

    if (!user) {
        return console.log('ERR: User not found');
    }

    if (!data.error && data.txid) return client.composeMessage({ to: user.username, subject: "Withdraw Success", text: `Your withdraw of **${data.amount}** PIVX has been sent. Your TXID is: ${data.txid}`});
    else return client.composeMessage({ to: user.username, subject: "Withdraw Failed", text: `Your withdraw of **${data.amount}** PIVX has encountered an error. The error was: ${data.error}`});
}
