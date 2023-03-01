import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import "babel-polyfill";

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
const accounts = web3.eth.getAccounts();
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

async function registerOracles() {
	const fee = await flightSuretyApp.methods.getRegistrationFee().call()
	const accts = await accounts
	for (const acct of accts) {
		console.log('account=', acct)
		await flightSuretyApp.methods.registerOracle().send({
			from: acct,
			value: fee,
			gas: 9999999
		});
	}
	console.log('[', accts.length, '] Oracles registered');
}

async function simulateOracleResponse(requestedIndex, airline, flight, timestamp) {
	const accts = await accounts
	for (const acct of accts) {
		var indexes = await flightSuretyApp.methods.getMyIndexes().call({ from: account });
		console.log("Oracles indexes: " + indexes + " for account: " + acct);
		for (const index of indexes) {
			try {
				if (requestedIndex == index) {
					console.log("Submitting Oracle response For Flight: " + flight + " at Index: " + index);
					await flightSuretyApp.methods.submitOracleResponse(
						index, airline, flight, timestamp, 20
					).send({ from: acct, gas: 9999999 });

				}
			} catch (e) {
				console.log(e);
			}
		}
	}
}

registerOracles();

flightSuretyApp.events.OracleRequest({}).on('data', async (event, error) => {
	if (!error) {
		await submitOracleResponse(
			event.returnValues[0],
			event.returnValues[1],
			event.returnValues[2],
			event.returnValues[3] 
		);
	}
});

flightSuretyApp.events.FlightStatusInfo({}).on('data', async (event, error) => {
	console.log("event=", event, "error=", error, "FLIGHT STATUS INFO")
});

flightSuretyApp.events.OracleReport({}).on('data', async (event, error) => {
	console.log("event=", event, "error=", error, "ORACLE REPORT")
});

const app = express();
app.get('/api', (req, res) => {
	res.send({
		message: 'An API for use with your Dapp!'
	})
})

export default app;


