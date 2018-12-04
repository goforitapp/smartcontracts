"use strict";

const GoForItToken = artifacts.require("./GoForItToken.sol");
const GoForItTokenSale = artifacts.require("./GoForItTokenSale.sol");

const BN = web3.BigNumber;
const {expect} = require("chai").use(require("chai-bignumber")(BN));
const {random, time, money, reject, snapshot} = require("./helpers/common");


contract("GoForItTokenSale", ([owner,
                               anyone]) => {
    // Token amount constants                G  M  k  1
    const TOTAL_TOKEN_CAP         = new BN("12500000000e18");  // = 12.500.000.000 e18
    const TOTAL_TOKEN_CAP_OF_SALE = new BN( "1250000000e18");  // =  1.250.000.000 e18
    const TOKEN_SHARE_OF_PRESALE  = new BN( "5511842425e18");  // =  5.511.842.425 e18
    const TOKEN_SHARE_OF_TEAM     = new BN( "1100000000e18");  // =  1.100.000.000 e18
    const TOKEN_SHARE_OF_ADVISORS = new BN( "1087500000e18");  // =  1.087.500.000 e18
    const TOKEN_SHARE_OF_COMPANY  = new BN( "3369407575e18");  // =  3.369.407.575 e18
    const TOKEN_SHARE_OF_BOUNTY   = new BN(  "181250000e18");  // =    181.250.000 e18

    // Sale timing constants
    const SALE_OPENING_TIME = time.from("2020-09-13 14:26:40 +2");
    const SALE_CLOSING_TIME = time.from("2033-05-18 05:33:20 +2");

    // Deployment parameters
    const initialRate = 12345;
    const wallet = random.address();


    describe("deployment", () => {
        let token, sale;

        it("succeeds", async () => {
            token = await GoForItToken.new({from: owner});
            sale = await GoForItTokenSale.new(token.address, initialRate, wallet, {from: owner});
            expect(await web3.eth.getCode(sale.address)).to.be.not.oneOf(["0x", "0x0"]);
        });

        it("sets correct token", async () => {
            expect(await sale.token()).to.be.bignumber.equal(token.address);
        });

        it("sets correct rate", async () => {
            expect(await sale.rate()).to.be.bignumber.equal(initialRate);
        });

        it("sets correct wallet", async () => {
            expect(await sale.wallet()).to.be.bignumber.equal(wallet);
        });
    });

});

