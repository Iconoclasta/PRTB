const PaymentProcessor = require('../lib/payment_processor.js');

module.exports = function(agenda, snoowrap) {

    let paymentProcessor = new PaymentProcessor({
        agenda: agenda,
        snoowrap: snoowrap
    });

    agenda.define('withdraw_order', async function(job, done) {
        let result = await paymentProcessor.performWithdraw(job);
        if (result.error) return done(result.error);
        done();
    });

    agenda.define('deposit_order', async function(job, done) {
        let result = await paymentProcessor.performDeposit(job);
        if (result.error) return done(result.error);
        done();
    });

    return paymentProcessor;

};
