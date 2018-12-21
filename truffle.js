
module.exports = {

    networks: {
        ganache: {
            network_id: "*",
            host: "localhost",
            port: 8545,
        },
    },

    mocha: {
        reporter: "eth-gas-reporter",
    },

    coverage: {
        network_id: "*",
        host: "localhost",
        port: 8555,
        gas: 0xfffffffffff,
        gasPrice: 0x01,
    },

};
