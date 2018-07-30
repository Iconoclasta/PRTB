const path = require('path');
const { fork } = require('child_process');

global.srcRoot = path.resolve(__dirname);
global.env = (process.argv[2] === '--production') ? process.env.NODE_ENV : "development";

const Snoowrap = require('snoowrap');
const snoostream = require('snoostream');
let config;

try {
    config = require('./src/data/config.json');
} catch (e) {
    console.log('No configuration file found.');
    console.log(e);
    process.exit(0);
}

const msgHandler = require('./src/handlers/handle_msg.js');

const setupDatabase = require('./src/db/setup');

const runPoll = require('./src/handlers/handle_DMs.js');

const client = new Snoowrap({
    userAgent   : config.auth.USER_AGENT,
    clientId    : config.auth.CLIENT_ID,
    clientSecret: config.auth.CLIENT_SECRET,
    username    : config.auth.USERNAME,
    password    : config.auth.PASSWORD
});

const text = `Hello there! I'm /u/pivxtipbot, the official PIVX Reddit Tip Bot! Since you have been interacted with me for the first time, I'm here to help you get to know the ropes.` +
`\n\nTo begin using me, take a look at the following commands:` +
`\n\n    !history - Your history of tips.\n\n    !transactions - Your transactions (deposit/withdraw)\n\n    !balance - Check your account balance.\n\n    !deposit - Get a new one-time deposit address\n\n    !withdraw [amount] [address] - Withdraw funds from your account` +
`\n\nIf you have existing balance, you can tip others by replying to a post/comment by them using \`!pivxtip [amount]\`. You can get support and further detail over at /r/pivxtipbot . Have fun!`;

global.welcomeMessage = async function (username) {
    return client.composeMessage({ to: username, subject: "Welcome to PIVX Tip Bot!", text });
};

const snooStream = snoostream(client);

const commentStream = snooStream.commentStream('all', {regex: /([!pivxtip])\w+/g, rate: 2000});

commentStream.on('post', (post) => {
    msgHandler(post, client);
});

setupDatabase().then((result) => {

    global.agenda = result.agenda;

    console.log(`PIVX Tip Bot starting up...`);

    fork('./src/worker');
});

runPoll(client);
