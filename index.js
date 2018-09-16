const path = require('path');
const { fork } = require('child_process');

global.srcRoot = path.resolve(__dirname);
global.env = (process.argv[2] === '--production') ? process.env.NODE_ENV : "development";

const Snoowrap = require('snoowrap');

const dotenv = require('dotenv');

dotenv.config({ path: './src/data/config.env' });

const setupDatabase = require('./src/db/setup');

const runPoll = require('./src/handlers/handle_DMs.js');
const client = new Snoowrap({
    userAgent   : process.env.USER_AGENT,
    clientId    : process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username    : process.env.USERNAME,
    password    : process.env.PASSWORD
});

const text = `Hello there! I'm /u/pivxtipbot, the official PIVX Reddit Tip Bot! Since you have been interacted with me for the first time, I'm here to help you get to know the ropes.` +
`\n\nTo begin using me, take a look at the following commands:` +
`\n\n    !history - Your history of tips.\n\n    !transactions - Your transactions (deposit/withdraw)\n\n    !balance - Check your account balance.\n\n    !deposit - Get a new one-time deposit address\n\n    !withdraw [amount] [address] - Withdraw funds from your account` +
`\n\nIf you have existing balance, you can tip others by replying to a post/comment by them using \`!pivxtip [amount]\`. You can get support and further detail over at /r/pivxtipbot . Have fun!`;

global.welcomeMessage = async function (username) {
    return client.composeMessage({ to: username, subject: "Welcome to PIVX Tip Bot!", text });
};

global.toFixed = function (num, fixed) {
    var re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
};

setupDatabase().then((result) => {

    global.agenda = result.agenda;

    console.log(`PIVX Tip Bot starting up...`);
    runPoll(client);

    if (process.argv[2] !== '--no-daemon') fork('./src/worker');
});
