require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

const { RINKEBY_API_URL, GOERLI_API_URL, PRIVATE_KEY } = process.env;

module.exports = {
  networks: {
    rinkeby: {
      provider: function() {
       return new HDWalletProvider(PRIVATE_KEY, RINKEBY_API_URL);
      },
      network_id: 4
    },
    goerli: {
      provider: function() {
       return new HDWalletProvider(PRIVATE_KEY, RINKEBY_API_URL);
      },
      network_id: 4
    }
  },
  mocha: {},
  compilers: {
    solc: {
      version: "0.8.15",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}
