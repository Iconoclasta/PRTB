const mongoose = require('mongoose');
const Agenda = require('agenda');

module.exports = async (options = {}) => {
    let dbName = "data_pivx_" + global.env;

    if (global.env === "development" && !options.silent) {
        mongoose.set('debug', true);
    }

    let mongoConnectionString = `mongodb://localhost:27017/${dbName}`;
    let db = await mongoose.connect(mongoConnectionString);
    let agenda = new Agenda({ mongo: db.connection, db: { collection: "jobs" } });

    return {
        db: db,
        agenda: agenda
    };
};
