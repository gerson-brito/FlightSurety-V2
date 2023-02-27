
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperation(false, { from: config.testAddresses[2] });
        }
        catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperation(false);
        }
        catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

        await config.flightSuretyData.setOperation(false);

        let reverted = false;
        try {
            await config.flightSurety.setTestingMode(true);
        }
        catch (e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");

        // Set it back for other tests to work
        await config.flightSuretyData.setOperation(true);

    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

        let error;
        try {
            await config.flightSuretyApp.registerAirline("ND1309", config.firstAirline, { from: config.owner });
        }
        catch (e) {
            error = e;
        }
        let result = await config.flightSuretyData.isAirlineRegistered.call(config.firstAirline);
        assert.notEqual(error, undefined, "Error must be thrown")
        assert.isAbove(error.message.search("It is not possible to register the airline, the sender is not funded."), -1, 
            "Airline should not be able to register another airline if it hasn't provided funding");
        assert.equal(result, false, "Airline was registered and it should not be");

    });

    it('(airline) can not be funded with less then 10 ether', async () => {

        const fee = web3.utils.toWei('9', "ether");
        let error;
        try {
            await config.flightSuretyApp.fundAirline(config.owner, { from: config.owner, value: fee });
        }
        catch (e) {
            error = e;
        }
        let result = await config.flightSuretyData.isAirlineFunded.call(config.owner);
        assert.notEqual(error, undefined, "Error must be thrown")
        assert.isAbove(error.message.search("Airline can not be funded, Ether amount is not enough"), -1, 
            "Airline can not be funded, Ether amount is not enough");
        assert.equal(result, false);
    });

    it('(airline) can be funded with 10 or more ether only', async () => {

        const fee = web3.utils.toWei('10', "ether");
        try {
            await config.flightSuretyApp.fundAirline(config.owner, { from: config.owner, value: fee });
        }
        catch (e) {
            console.log(e);
        }
        let result = await config.flightSuretyData.isAirlineFunded.call(config.owner);
        assert.equal(result, true, "Airline should be funded");
    });

    it('Funded Airline can register other airline', async () => {
        
        try {
            await config.flightSuretyApp.registerAirline("ND1309", config.firstAirline, { from: config.owner });
        }
        catch (e) {
            console.log(e);
        }
        let result = await config.flightSuretyData.isAirlineRegistered.call(config.firstAirline);
        assert.equal(result, true, "Second airline should be registered");
    });

    it('Fifth and above airline registered require registration consensus', async () => {

        try {
            await config.flightSuretyApp.registerAirline("Second Air", config.testAddresses[2], { from: config.owner });
            await config.flightSuretyApp.registerAirline("Third Air", config.testAddresses[3], { from: config.owner });
            await config.flightSuretyApp.registerAirline("Fourth Airlines", config.testAddresses[4], { from: config.owner });
        }
        catch (e) {
            console.log(e);
        }
        let result2 = await config.flightSuretyData.isAirlineRegistered.call(config.testAddresses[2]);
        let result3 = await config.flightSuretyData.isAirlineRegistered.call(config.testAddresses[3]);
        let result4 = await config.flightSuretyData.isAirlineRegistered.call(config.testAddresses[4]);
        assert.equal(result2, true, "Second Airline Registered Succesfully.");
        assert.equal(result3, true, "Third Airline Registered Succesfully.");
        assert.equal(result4, false, "Fourth airline should not registered and require registration consensus.");
    });

    it('Fifth airline waiting to be registered requires at least 50% consensus votes', async () => {

        const fee = web3.utils.toWei('10', "ether");
        try {
            await config.flightSuretyApp.fundAirline(config.testAddresses[2], { from: config.testAddresses[2], value: fee });
            await config.flightSuretyApp.voteForAirline(config.testAddresses[4], { from: config.testAddresses[2] });
        }
        catch (e) {
            console.log(e);
        }
        let result = await config.flightSuretyData.isAirlineRegistered.call(config.testAddresses[4]);
        assert.equal(result, true, "Fifth airline should be registered after enough vote received.");
    });

    it('(insurence) Pessanger purchase insurence paying 1 ether max', async () => {

        const insuranceAmount = web3.utils.toWei('0.5', "ether");
        const flightName = "Third Air";
        const thirdAirline = config.testAddresses[3];
        const timeStamp = 1630021956;
        const passengerAddress = config.testAddresses[8];
        let error;
        try {
            await config.flightSuretyApp.buy(flightName, thirdAirline, timeStamp, { from: passengerAddress, value: insuranceAmount });
        }
        catch (e) {
            error = e;
        }
        assert.notEqual(error, undefined, "Passenger should be able to buy an insurance.")
    });
});
