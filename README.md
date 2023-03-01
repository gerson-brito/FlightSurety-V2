# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.


## Requirements
------------
* Solidity v0.4.24
* Node v14.16.0
* Node Package Manager (npm)
* Truffle v5.4.5
* Ganache-cli v6.12.2
* Infura
* Webpack v4.6.0
* Web3.js v1.2.0

## Install, Test, & Run
--------------------
1. `npm install`
2. `ganache-cli -a 20 -l 9999999 -m "gaze eager foster artefact square honey embark pencil fun vacant legal convince"`
3. `truffle test`
4. `truffle migrate --network development`
5. `npm run server`
6. `npm run dapp`
7. Navigate to http://localhost:8000/


## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)