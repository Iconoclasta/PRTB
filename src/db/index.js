const {readdirSync} = require('fs');
const path = require('path');

let names = readdirSync(path.join(__dirname, "./models"));
let models = {};

names.forEach(n => {
    let model = require('./models/' + n);
    models[model.modelName] = model;

    console.log(`Loaded ${model.modelName} model.`);
});

module.exports = models;
