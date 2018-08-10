const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const assert = chai.assert;

const Decimal = require("decimal.js");

global.env = process.env.NODE_ENV ? process.env.NODE_ENV : "test";

const models = require('../db');
const setupDatabase = require('../db/setup');
const mongoose = require('mongoose');

chai.use(chaiAsPromised);

const createUser = async () => {
    const random = Math.random().toString();

    const attributes = {
        username: random,
        addr: random,
        balance: Decimal("1").div(1e-8).toString()
    };

    //console.o

    const r = await models.User.create(attributes);
    r.password = random;
    return r;
};

const processParallelTransactions = (user, transactions) => {
    const promises = transactions.map((amount) => {
        if (amount < 0) {
            return models.User.withdraw(user, Math.abs(amount));
        } else {
            return models.User.deposit(user, Math.abs(amount));
        }
    });

    return Promise.all(promises);
};



before(function() {
    return setupDatabase().then((result) => {
        global.agenda = result.agenda;
        return mongoose.connection.db.dropDatabase();
    }).then(() => {
        return models.User.findOne({}); // initializes model (temp hack)
    });
});


describe('Withdraw', function() {
    let user;

    beforeEach(async function() {
        user = await createUser();
        await models.Job.remove(); // clear jobs
    });



    it('should not allow withdraw more than user balance', async function () {
        let amount = user.balance + 1;

        return assert.isRejected(models.User.withdraw(user, amount), { message: "insufficient funds" });
    });

    it('should not allow withdraw more than user balance - string input', async function () {
        let amount = "1.1";

        return assert.isRejected(models.User.withdraw(user, amount), { message: "insufficient funds" });
    });

    it('should not allow withdraw negative amount', async function () {
        let amount = -100;

        return assert.isRejected(models.User.withdraw(user, amount), { message: "zero or negative amount not allowed" });
    });

    it('should not allow withdraw negative amount', async function () {
        let amount = 0;

        return assert.isRejected(models.User.withdraw(user, amount), { message: "zero or negative amount not allowed" });
    });

});

describe('Deposit', function() {
    let user;

    beforeEach(async function() {
        user = await createUser();
    });

    it('should not allow deposit negative amount', async function () {
        let amount = -100;

        return assert.isRejected(models.User.deposit(user, amount), "negative amount not allowed");
    });

    it('should update balance w/ deposit', async function () {
        const amount = 0.01;
        const newBalance = Decimal(user.balance.toString()).plus(Decimal(amount).div(1e-8));
        await models.User.deposit(user, amount);

        user = await models.User.findOne({ username: user.username });
        assert.equal(user.balance.toString(), newBalance.toString() + '.000');
    });
});

describe('Deposit/Withdraw Race Conditions', function() {
    let user;

    beforeEach(async function() {
        user = await createUser();
    });

    it('immediate withdraw and deposit should result in proper balance', async function () {
        const transactions = [-0.5, 2];
        const amount = Decimal(transactions.reduce((a, b) => a + b, 0)).div(1e-8);
        const newBalance = Decimal(user.balance.toString()).plus(amount);

        return processParallelTransactions(user, transactions).then(async () => {
            user = await models.User.findOne({ username: user.username });
            assert.equal(user.balance.toString(), newBalance.toString() + '.000');
        });
    });
});
