var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "gaze eager foster artefact square honey embark pencil fun vacant legal convince";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",   
      port: 8545,            
      network_id: '*',
      gas: 9999999
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};