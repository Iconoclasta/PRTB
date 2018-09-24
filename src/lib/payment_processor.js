global.srcRoot = require('path').resolve('./');
const {Transaction, User, Job} = require('../db');

const PIVXClient = require('./pivx_client.js');

class PaymentProcessor {
    constructor (options) {
        this.agenda = options.agenda;
        this.pivxClient = options.pivxClient || new PIVXClient();
        this.parent = options.parent || null;
    }

    reportException (e) {
        console.error(e);
    }

    async performWithdraw (options) {
        return this.withdraw(options).then(() => { return { success: true }; }).catch(err => { return {error: err}; });
    }

    async performDeposit (options) {
        try {
            await this.deposit(options);
            return { success: true };
        } catch (e) {
            console.error(e);
            return new Error(e);
        }
    }

    async getAddress (options) {
        try {
            return this.pivxClient.accountCreate();
        } catch (e) {
            this.reportException(e);
            return { error: e };
        }
    }

    async checkDeposit () {
        return this.pivxClient.listTransactions().then(txs => {
            const promises = txs.map(tx => {
                return new Promise((resolve, reject) => {
                    if (tx.account === process.env.RPC_ACC) {
                        Transaction.findOne({ txid: tx.txid }).then(async result => {
                            if (!result) {
                                await this.createDepositOrder(tx.txid, tx.address, tx.amount);
                                resolve(true);
                            }
                        }).catch(reject);
                    }
                });
            });
            return Promise.all(promises);
        }).catch((err) => {
            console.error('Daemon connection error: ' + err.stack);
            return err;
        });
    }

    async createDepositOrder (txID, recipientAddress, amount) {
        let job = await Job.findOne({ 'data.txid': txID });

        if (!job) {
            console.log('New transaction! TXID: ' + txID);

            job = await this.agenda.create('deposit_order', { recipientAddress: recipientAddress, txid: txID, amount: amount });
            return new Promise((resolve, reject) => {
                job.save();
                resolve();
            });
        }

        return job;
    }

    /*
        amount: {String}
    */
    async withdraw (job) {
    // parameters
        const userId = job.attrs.data.userId;
        const recipientAddress = job.attrs.data.recipientAddress;
        const amount = job.attrs.data.amount;

        // Validate if user is present
        let user = await User.findById(userId);
        if (!user) throw new Error(`User ${userId} not found`);

        // Step 1: Process transaction
        let sendID;

        // Step 2: Update user balance
        if (!job.attrs.userStepCompleted) {
            await new Promise((resolve, reject) => {
                User.withdraw(user, amount).then(() => {
                    Job.findByIdAndUpdate(job.attrs._id, { 'data.userStepCompleted': true }).then(() => {
                        resolve(true);
                    }).catch(err => {
                        reject(err);
                    });
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                process.send({ id: user.id, amount, address: recipientAddress, txid: null, error: err.message });
                throw new Error(err);
            });
        }

        if (job.attrs.sendStepCompleted) {
            sendID = job.attrs.txid;
        } else {
            const sent = new Promise(resolve => resolve('test')); // this.pivxClient.send(recipientAddress, amount)

            await new Promise((resolve, reject) => {
                sent.then((txid) => {
                    resolve(txid);
                }).catch(async err => {
                    if (err) {
                        await User.deposit(user, amount);
                        process.send({ id: user.id, amount, address: recipientAddress, txid: null, error: err.message });
                        reject(err);
                    }
                });
            }).then(async (txid) => {
                await Job.findOneAndUpdate({ _id: job.attrs._id }, { 'data.sendStepCompleted': true, 'data.txid': txid });
                sendID = txid;
            }).catch(err => {
                throw new Error(err);
            });
        }

        if (!job.attrs.transactionStepCompleted) {
            // console.log(sendID);
            await Transaction.create({ userId: userId, withdraw: amount, txid: sendID });
            await Job.findByIdAndUpdate(job.attrs._id, { 'data.transactionStepCompleted': true });
        }

        // Step 3: Record Transaction

        await new Promise(resolve => { process.send({ id: user.id, amount, address: recipientAddress, txid: sendID }); resolve(); });

        return sendID;
    }

    async deposit (job) {
    // parameters
        const txid = job.attrs.data.txid;
        const recipientAddress = job.attrs.data.recipientAddress;
        const amount = job.attrs.data.amount;

        // Validate if user is present
        let user = await User.findOne({ addr: recipientAddress });

        if (!user) throw new Error(`User with address ${recipientAddress} not found`);

        if (!job.attrs.userStepCompleted) {
            await User.deposit(user, amount, txid);
            await Job.findByIdAndUpdate(job.attrs._id, { 'data.userStepCompleted': true });
        }

        if (!job.attrs.transactionStepCompleted) {
            await Transaction.create({ userId: user._id, deposit: parseInt(amount), txid: txid });
            await Job.findByIdAndUpdate(job.attrs._id, { 'data.transactionStepCompleted': true });
        }

        if (process.send) process.send({ id: user.id, amount, deposit: true });

        return txid;
    }
}

module.exports = PaymentProcessor;
