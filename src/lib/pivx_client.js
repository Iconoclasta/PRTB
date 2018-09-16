process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const Bitcoin = require('bitcoin-core');

class PivxClient {
    constructor () {
        this.rpc = new Bitcoin({
            port: process.env.RPC_PORT,
            username: process.env.RPC_USER,
            password: process.env.RPC_PASS
        });

        this.SATOSHI_VALUE = 1e-8;
    }

    async accountCreate () {
        return this.rpc.getNewAddress(process.env.RPC_ACC);
    }

    async send (addr, amount) {
        return this.rpc.sendToAddress(addr, amount);
    }

    async listTransactions () {
        return this.rpc.listUnspent();
    }
}

module.exports = PivxClient;
