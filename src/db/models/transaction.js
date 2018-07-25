const mongoose = require('mongoose');

let s = {
    name: "Transaction",
    schema: new mongoose.Schema({
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        deposit: {
            type: mongoose.Schema.Types.Decimal128,
            default: "0.0"
        },
        withdraw: {
            type: mongoose.Schema.Types.Decimal128,
            default: "0.0"
        },
        txid: {
            type: String,
            unique: true
        }
    },{
        timestamps: true
    })

};

s.schema.methods.toJSON = function() {
    var attrs = this.toObject();

    return {
        deposit: attrs.deposit.toString(),
        withdraw: attrs.withdraw.toString(),
        txid: attrs.txid,
        createdAt: attrs.createdAt
    };
};

module.exports = mongoose.model(s.name, s.schema);
