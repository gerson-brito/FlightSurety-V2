// SPDX-License-Identifier: MIT
pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;
    bool private operational;
    uint256 registeredAirlineCounter;
    uint256 totalFunds;
    address[] public clientAddresses;


    struct Client {
        address clientAddress;
        uint256 credit;
        mapping (bytes32 => uint256) insuredFlights;
    }

    struct Airline {
        address airlineAddress;
        string airlineName;
        bool isFunded;
        uint voteCounter;
    }

    mapping(address => Airline) private registeredAirlines;
    mapping(address => Airline) private pendingAirlines;
    mapping(address => Client) private clients;
    mapping(address => bool) private authorizedAppContracts;
    
    
    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    constructor() public {
        contractOwner = msg.sender;
        clientAddresses = new address[](0);
        operational = true;
        registeredAirlineCounter = 0;
        totalFunds = 0;
    }

    
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier requireIsOperational() 
    {
        require(isOperational(), "Contract is currently not operational");
        _;
    }

    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns(bool) {
        return operational;
    }

        function setOperation(bool mode) external requireContractOwner {
        operational = mode;
    }     

    function isAirlineRegistered(address airline) external view returns(bool) {
        return registeredAirlines[airline].airlineAddress != address(0);
    }

    function isAirlinePending(address airline) external view returns(bool) {
        return pendingAirlines[airline].airlineAddress != address(0);
    }

    function getRegisteredAirlineCounter() external view returns(uint256) {
        return registeredAirlineCounter;
    }

    function isAirlineFunded(address airline) external view returns(bool) {
        return registeredAirlines[airline].isFunded;
    }

    function getClientCredit(address insuredClient) external view returns(uint256) {
        return clients[insuredClient].credit;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function registerAirline(string airlineName, address airlineAddress) public requireIsOperational {
        registeredAirlines[airlineAddress] = Airline({
            airlineName: airlineName,
            airlineAddress: airlineAddress,
            isFunded: false,
            voteCounter: 0
        });

        registeredAirlineCounter = registeredAirlineCounter.add(1);
    }

    function addPendingAirline(string airlineName, address airlineAddress) external requireIsOperational {   
        pendingAirlines[airlineAddress] = Airline({
            airlineName: airlineName,
            airlineAddress: airlineAddress,
            isFunded: false,
            voteCounter: 1
        });
    }

    function voteForAirline(address airlineAddress) external requireIsOperational returns (uint256) {
        pendingAirlines[airlineAddress].voteCounter = pendingAirlines[airlineAddress].voteCounter.add(1);
        if (pendingAirlines[airlineAddress].voteCounter >= registeredAirlineCounter.div((2))) {
            registerAirline(pendingAirlines[airlineAddress].airlineName, airlineAddress);
            delete pendingAirlines[airlineAddress];
        }
        return pendingAirlines[airlineAddress].voteCounter;
    }

    function fundAirline(address airlineAddress, uint256 amount) external payable requireIsOperational {
        registeredAirlines[airlineAddress].isFunded = true;
        totalFunds = totalFunds.add(amount);
    }

    function buy(bytes32 flightKey, address clientAddress, uint256 insuredAmount) external payable requireIsOperational {
        if (clients[clientAddress].clientAddress != address(0)) { 
            require(clients[clientAddress].insuredFlights[flightKey] == 0, "This flight is already insured");
            
        } else { 
            clients[clientAddress] = Client({
                clientAddress: clientAddress,
                credit: 0
            });
            clientAddresses.push(clientAddress);
        }
        clients[clientAddress].insuredFlights[flightKey] = insuredAmount;
        totalFunds = totalFunds.add(insuredAmount); 
    }

    function creditInsurees(bytes32 flightKey) external requireIsOperational {
        for (uint256 i = 0; i < clientAddresses.length; i++) {
            if(clients[clientAddresses[i]].insuredFlights[flightKey] != 0) { // Insured flights
                uint256 payedPrice = clients[clientAddresses[i]].insuredFlights[flightKey];
                uint256 savedCredit = clients[clientAddresses[i]].credit;
                clients[clientAddresses[i]].insuredFlights[flightKey] = 0;
                clients[clientAddresses[i]].credit = savedCredit + payedPrice + payedPrice.div(2); // 1.5X the amount they paid
            }
        }
    }

    function pay(address insuredClient) external payable requireIsOperational {
        require(insuredClient == tx.origin, "Contracts are not allowed");
        require(clients[insuredClient].clientAddress != address(0), "The client don't have insurance");
        require(clients[insuredClient].credit > 0, "There is no credit to be withdrawed");
        uint256 credit = clients[insuredClient].credit;
        require(address(this).balance > credit, "The contract don't have enough credit to pay");
        clients[insuredClient].credit = 0;
        insuredClient.transfer(credit);
    }

    function authorizeCaller (address appContract) public {
        authorizedAppContracts[appContract] = true;
    }
 
    function fund() public payable {
    }

    function getFlightKey(address airline, string flight, uint256 timestamp) pure internal returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function() external payable {
        fund();
    }

}

