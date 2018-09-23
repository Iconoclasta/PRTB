const PrivateMessage = require('snoowrap').objects.PrivateMessage;
const Comment = require('snoowrap').objects.Comment;
const {User, Job, Tip, Transaction} = require('../db');
const PivxClient = require('../lib/pivx_client');
const PIVXClient = new PivxClient();
const Decimal = require('decimal.js');
const handleMessage = require('./handle_msg.js');

async function filterMessages(msgs,  client) {
    let arr = [];
    for (let msg of msgs) {
        console.log('Reading message ' + msg.id);
        arr.push(msg);
        if (msg instanceof PrivateMessage) await handlePrivateMessage(msg, client);
        else if (msg instanceof Comment) await handleMessage(msg, client);
    }
    if (arr.length > 0) {
        console.log('Clearing ' + arr.length + ' messages.');
        return client.markMessagesAsRead(arr);
    }
    else return Promise.resolve();
}

async function handlePoll(client) {
    const msgs = await client.getUnreadMessages({ filter: 'mentions' });


    return filterMessages(msgs, client);
}

async function createNewUser(username) {
    return new Promise(async (res) => {
        const addr = await getNewAddress();
        welcomeMessage(username);
        const newUser = new User({username: username, addr});
        res(await newUser.save());
    });
}

async function getNewAddress() {
    return PIVXClient.accountCreate().catch((err) => {
        if (err) return err;
    });
}

async function updateUser(user) {
    return new Promise(async (res, rej) => {
        const addr = await getNewAddress();
        user.addr = addr;
        user.save((err) => {
            if (err) rej(err);
            res(user);
        });
    });
}

async function deposit(msg) {
    let user = await User.findOne({username: await msg.author.name});

    if (!user) user = await createNewUser(await msg.author.name);
    else user = await updateUser(user);

    return msg.reply('Your **one-time** deposit address is: ' + user.addr);
}

async function withdraw(msg, args) {

    let amount = args[1];
    const addr = args[2];

    if (!addr || addr.length !== 34 ) return msg.reply(addr + " is not a valid PIVX address.");

    const user = await User.findOne({username: await msg.author.name});

    if (!user) {
        await createNewUser(await msg.author.name);
        return msg.reply("You did not have an account, so I created one for you! You have no balance to withdraw.");
    }

    return User.validateWithdrawAmount(user, amount).then(async () => {

        amount = Decimal(amount);

        const job = global.agenda.create('withdraw_order', {userId: user._id, recipientAddress: addr, amount: amount.toNumber() });
        job.save((err) => {
            if (err) return false;

            return msg.reply('Withdrawing your coins. Check !transactions to confirm your tx.');
        });
    }).catch(({message}) => {
        //TODO handle
        return msg.reply(message);
    });
}

async function balance(msg) {

    let user = await User.findOne({username: await msg.author.name});

    if (!user) user = await createNewUser(await msg.author.name);

    return msg.reply('Your balance is ' + user.balance.toString() + " PIVX");

}

async function findHistory(username) {
    let user = await User.findOne({username: username});

    if (!user) user = await createNewUser(username);

    const tips = await Tip.find({tipper: user._id});

    const recv = await Tip.find({tipped: user._id});

    return { tips, recv };
}

async function history(msg) {
    const { tips, recv } = await findHistory(await msg.author.name);

    let tip_msg = "Received tips:\n";

    for (let tip of recv) {
        const tipper = await User.findOne({_id:tip.tipper});
        const timestamp = new Date(tip.createdAt).toString();
        tip_msg += `\n    From: ${tipper.username} | Amount: ${tip.amount} PIVX | ${timestamp}\n`;
    }

    let recv_msg = "Sent tips:\n";

    for (let tip of tips) {
        const tipped = await User.findOne({ _id: tip.tipped });
        const timestamp = new Date(tip.createdAt).toString();
        recv_msg += `\n   To: ${tipped.username} | Amount: ${tip.amount} PIVX | ${timestamp}\n`;
    }

    const text = tip_msg + "\n" + recv_msg;

    return msg.reply(text);
}

async function getTransactions (msg) {
    return new Promise(async (res) => {
        const user = await User.findOne({username: await msg.author.name }) || await createNewUser(await msg.author.name);

        const withdraws_pend = await Job.find({ userId: user._id, completed: { "$exists": false }}).limit(100).sort({ lastFinishedAt: 'desc' });

        const tx_raw = await Transaction.find({ userId: user._id }).limit(100).sort({ lastFinishedAt: 'desc' });

        const deposits = { txs: [] }; const withdraws = { pending: [], txs: [] };

        for (let tx of tx_raw) {
            if (tx.deposit !== '0.0') {
                if (Decimal(tx.deposit).moreThan(0)) deposits.txs.push(tx);
                else if (Decimal(tx.withdraw).moreThan(0)) withdraws.txs.push(tx);
            }
        }

        for (let tx of withdraws_pend) {
            withdraws.pending.push(tx.data);
        }

        res({ deposits, withdraws });

    });
}

async function transactions(msg) {

    const { deposits, withdraws } = await getTransactions(msg);

    let pend_msg = "**Pending transactions:**\n";

    let tx_msg = "\n**Completed transactions**:\n";

    for (let txd of deposits.txs) {
        tx_msg += `\nDeposit Amount: ${txd.deposit} PIVX | TXID: ${txd.txid}\n`;
    }

    for (let pend of withdraws.pending) {
        pend_msg += `\nWithdraw Amount: ${pend.withdraw} PIVX  | Pending\n`;
    }

    for (let txd of withdraws.txs) {

        tx_msg += `\nWithdraw Amount: ${txd.withdraw} PIVX | TXID: ${txd.txid}\n`;
    }

    const text = pend_msg + "\n" + tx_msg;

    return msg.reply(text);

}

async function help(msg) {

    const text = `**List of Commands**\n\n!history - Your history of tips.\n\n!transactions - Your transactions (deposit/withdraw)\n\n!balance - Check your account balance.\n\n!deposit - Get a new one-time deposit address\n\n!withdraw [amount] [address] - Withdraw funds from your account`;

    return msg.reply(text);
}

async function handlePrivateMessage(msg, client) {

    const args = msg.body.match(/\S+/g);

    console.log('Handling message..');


    switch (args[0]) {
    case '!deposit':
        //deposit address
        await deposit(msg);
        break;
    case '!withdraw':
        //withdraw amount confirmation -> handleWithdraw
        await withdraw(msg, args);
        break;
    case '!balance':
        //balance
        await balance(msg);
        break;
    case '!history':
        //tip history
        await history(msg);
        break;
    case '!transactions':
        await transactions(msg);
        break;
    case '!help':
        await help(msg);
        break;
    case '/u/pivxtipbot':
        await handleMessage(msg, client);
        break;
    default:
        //handleInvalid
        await msg.reply(args[0] + " is an invalid command.");
    }

    await msg.markAsRead();

}

module.exports = async (client) => {

    setInterval(await handlePoll, 10000, client);

};
