const mongoose = require('mongoose');

let s = {
    name: "Job",
    schema: new mongoose.Schema({
        name: { type: String },
        data: {},
        failCount: {
            type: Number,
        },
        lastFinishedAt: {
            type: Date
        },
        completed: {
            type: String
        }
    })
};

s.schema.methods.toJSON = function() {
    var attrs = this.toObject();

    delete attrs.data["userId"];

    return {
        name: attrs.name,
        data: attrs.data,
        nextRunAt: attrs.nextRunAt,
        lastFinishedAt: attrs.lastFinishedAt,
        failCount: attrs.failCount,
        completed: attrs.completed
    };
};

module.exports = mongoose.model(s.name, s.schema);
