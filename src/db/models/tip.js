const mongoose = require('mongoose');

let s = {
    name: "Tip",
    schema: new mongoose.Schema({
        tipper: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        tipped: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: {
            type: mongoose.Schema.Types.Decimal128
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
