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
    return this.validateTipAmount(tipper, amount).then(() => {
        return this.findOneAndUpdate({ username: tipper.username }, { $inc : {'balance' : Decimal(0).minus(Decimal(amount).toFixed(3)) } }).then(() => {
            return this.findOneAndUpdate({ username: receiver.username }, { $inc : {'balance' : Decimal(amount).toFixed(3) } });
        });
    });
};

s.schema.statics.deposit = async function (user, amount) {
    return new Promise((res, rej) => {
        this.validateDepositAmount(user, amount).then(() => {
            this.findOneAndUpdate({ _id: user._id }, { $inc : {'balance' : Decimal(amount).toFixed(3) } }).then((r) => res(r));
        }).catch((err) => rej(err));
    });
};

s.schema.statics.withdraw = async function (user, amount) {
    return new Promise((res, rej) => {
        this.validateWithdrawAmount(user, amount).then(() => {
            this.findOneAndUpdate({ _id: user._id }, { $inc : {'balance' : Decimal(0).minus(Decimal(amount).toFixed(3)) } }).then((r) => res(r));
        }).catch((err) => rej(err));
    });
};

s.schema.statics.validateDepositAmount = function (user, amount) {
    if (amount <= 0) return Promise.reject({ message: "Zero or negative amount not allowed" });

    return Promise.resolve({});
};

s.schema.statics.validateWithdrawAmount = async function (user, amount) {

    amount = Decimal(amount);

    if (amount.isNaN()) return Promise.reject({ message: "That amount is not a number." });
    else if (amount.lessThan(0.1)) return Promise.reject({ message: "The minimum amount allowed to withdraw is 0.1 PIVX." });
    else if (amount.greaterThan(user.balance.toString())) return Promise.reject({ message: "You do not have sufficient funds!" });

    return Promise.resolve({});
};

s.schema.statics.validateTipAmount = async function (user, amount) {

    amount = Decimal(amount);

    if (amount.isNaN()) return Promise.reject({ message: "That amount is not a number." });
    else if (amount.lessThan(0.001)) return Promise.reject({ message: "The minimum amount allowed to tip is 0.001 PIVX." });
    else if (amount.greaterThan(user.balance.toString())) return Promise.reject({ message: "You do not have sufficient funds!" });

    return Promise.resolve({});
};


module.exports = mongoose.model(s.name, s.schema);
