const mongoose = require('mongoose');
const Decimal = require("decimal.js");


let s = {
    name: "User",
    schema: new mongoose.Schema({
        username: {
            type: String,
            unique: true
        },
        balance: {
            type: mongoose.Schema.Types.Decimal128,
            default: "0.0"
        },
        addr: {
            type: String
        }
    },{
        timestamps: true
    })
};

s.schema.statics.authUser = async function(token) {
    return new Promise(async (res) => {
        let user = await this.findOne({token: token});
        if (user != null) res(user);
        else res(false);
    });
};

s.schema.statics.authCertainUser = async function (token, username) {
    return new Promise(async (res) => {
        let user = await this.findOne({token: token});
        if (user != null && user.username == username) res(user);
        else res(false);
    });
};

s.schema.statics.tip = async function (tipper, receiver, amount) {
    return this.validateWithdrawAmount(tipper, amount).then(() => {
        return this.findOneAndUpdate({ username: tipper.username }, { $inc : {'balance' : Decimal(0).minus(Decimal(amount).div(1e-8)).toFixed() } }).then(() => {
            return this.findOneAndUpdate({ username: receiver.username }, { $inc : {'balance' : Decimal(amount).div(1e-8).toFixed() } });
        });
    });
};

s.schema.statics.deposit = async function (user, amount) {
    return new Promise((res, rej) => {
        this.validateDepositAmount(user, amount).then(() => {
            this.findOneAndUpdate({ _id: user._id }, { $inc : {'balance' : Decimal(amount).div(1e-8).toFixed() } }).then((r) => res(r));
        }).catch((err) => rej(err));
    });
};

s.schema.statics.withdraw = async function (user, amount) {
    return new Promise((res, rej) => {
        this.validateWithdrawAmount(user, amount).then(() => {
            this.findOneAndUpdate({ _id: user._id }, { $inc : {'balance' : Decimal(0).minus(Decimal(amount).div(1e-8)).toFixed() } }).then((r) => res(r));
        }).catch((err) => rej(err));
    });
};

s.schema.statics.validateDepositAmount = function (user, amount) {
    if (amount <= 0) return Promise.reject({ message: "zero or negative amount not allowed" });

    return Promise.resolve({});
};

s.schema.statics.validateWithdrawAmount = async function (user, amount) {

    amount = Decimal(amount);

    if (amount.isNaN()) return Promise.reject({ message: "amount is not a number" });
    else if (amount.lessThan(0.1)) return Promise.reject({ message: "Requires at least 0.1 pivx" });
    else if (amount.greaterThan(Decimal(user.balance.toString()).mul(1e-8))) return Promise.reject({ message: "insufficient funds" });

    return Promise.resolve({});
};

s.schema.statics.validateTipAmount = async function (user, amount) {

    amount = Decimal(amount);

    if (amount.isNaN()) return Promise.reject({ message: "That amount is not a number." });
    else if (amount.lessThan(0.0001)) return Promise.reject({ message: "The minimum amount allowed to tip is 0.0001 PIVX." });
    else if (amount.greaterThan(Decimal(user.balance.toString()).mul(1e-8))) return Promise.reject({ message: "You do not have sufficient funds!" });

    return Promise.resolve({});
};


s.schema.statics.getBigBalance = function (user) {
    return Decimal(user.balance.toString()).mul(1e-8);
};


module.exports = mongoose.model(s.name, s.schema);
