process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const Bitcoin = require('bitcoin-core');

const config = require('../data/config.json');

class PivxClient {

    constructor() {
        this.rpc = new Bitcoin({
            port: config.auth.RPC_PORT,
            username: config.auth.RPC_USER,
            password: config.auth.RPC_PASS
        });

        this.SATOSHI_VALUE = 1e-8;

    }

    async accountCreate() {
        return this.rpc.getNewAddress(config.auth.RPC_ACC);
    }

    async send(addr, amount) {
        return this.rpc.sendToAddress(addr, amount);
    }

    async listTransactions() {
        return this.rpc.listUnspent();
    }

}


module.exports = PivxClient;
