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
const client = new Snoowrap({
    userAgent   : process.env.USER_AGENT,
    clientId    : process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username    : process.env.USERNAME,
    password    : process.env.PASSWORD
});

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

    return client.composeMessage({ to: user.username, subject: "Deposit Success", text: `Your deposit of **${data.amount}** PIVX has been credited to your account.`});
}

async function withdrawMessage (data) {

    const user = await User.findById(data._id);

    if (!user) {
        return console.log('ERR: User not found');
    }

    if (!data.error && data.txid) return client.composeMessage({ to: user.username, subject: "Withdraw Success", text: `Your withdraw of **${data.amount}** PIVX has been executed successfully. Your TXID is: ${data.txid}`});
    else return client.composeMessage({ to: user.username, subject: "Withdraw Failed", text: `Your withdraw of **${data.amount}** PIVX has encountered an error. The error was: ${data.error}`});
}
