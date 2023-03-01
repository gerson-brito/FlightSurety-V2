
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    
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

        let newAirline = accounts[2];

        try {
            await config.flightSuretyApp.registerAirline(newArline, {from: config.firstAirline});
        }
        catch(e) {

        }
        let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline);

        assert.equal(result, false, "Airline can't be able to register another airline if hasn't funded");
    });

    it('(airline) can not be funded with less then 10 ether', async () => {

        const fee = web3.utils.toWei('9', "ether");
        let error;
        try {
            await config.flightSuretyApp.fundAirline(config.owner, { from: config.owner, value: fee });
        }
        catch (e) {
            console.log(e)
        }
        let result = await config.flightSuretyData.isAirlineFunded.call(config.owner);
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
        assert.equal(result, true, "Airline can be funded");
    });

    it('(airline) can register other airline using registerAirline()', async () => {
        
        try {
            await config.flightSuretyApp.registerAirline("AIRFRANCE", config.firstAirline, { from: config.owner });
        }
        catch (e) {
            console.log(e);
        }
        let result = await config.flightSuretyData.isAirlineRegistered.call(config.firstAirline);
        assert.equal(result, true, "Second airline can be registered");
    });

    it('Fifth and above airline registered require registration consensus', async () => {

        try {
            await config.flightSuretyApp.registerAirline("Lauda Air", config.testAddresses[5], { from: config.owner });
            await config.flightSuretyApp.registerAirline("RyanAir", config.testAddresses[6], { from: config.owner });
            await config.flightSuretyApp.registerAirline("Portugalia", config.testAddresses[7], { from: config.owner });
        }
        catch (e) {
            console.log(e);
        }
        let result2 = await config.flightSuretyData.isAirlineRegistered.call(config.testAddresses[5]);
        let result3 = await config.flightSuretyData.isAirlineRegistered.call(config.testAddresses[6]);
        let result4 = await config.flightSuretyData.isAirlineRegistered.call(config.testAddresses[7]);
        assert.equal(result2, true, "Second Airline Registered Succesfully.");
        assert.equal(result3, true, "Third Airline Registered Succesfully.");
        assert.equal(result4, false, "Fourth Airline can not been registered and require registration consensus.");
    });

    it('Fifth airline waiting to be registered requires at least 50% consensus votes', async () => {

        const fee = web3.utils.toWei('10', "ether");
        try {
            await config.flightSuretyApp.fundAirline(config.testAddresses[5], { from: config.testAddresses[5], value: fee });
            await config.flightSuretyApp.voteForAirline(config.testAddresses[7], { from: config.testAddresses[5] });
        }
        catch (e) {
            console.log(e);
        }
        let result = await config.flightSuretyData.isAirlineRegistered.call(config.testAddresses[7]);
        assert.equal(result, true, "Fifth airline should be registered after enough vote received.");
    });

    it('(insurence) Pessanger purchase insurence paying 1 ether max', async () => {

        const insuranceAmount = web3.utils.toWei('0.5', "ether");
        const flightName = "LA459";
        const laudaAir = config.testAddresses[3];
        const timeStamp = 1630021956;
        const clientAddress = config.testAddresses[8];
        let error;
        try {
            await config.flightSuretyApp.buy(flightName, laudaAir, timeStamp, { from: clientAddress, value: insuranceAmount });
        }
        catch (e) {
            error = e;
        }
        assert.notEqual(error, undefined, "Client should be able to buy an insurance.")
    });
});
