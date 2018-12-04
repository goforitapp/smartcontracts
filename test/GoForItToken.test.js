"use strict";

const GoForItToken = artifacts.require("./GoForItToken.sol");

const BN = web3.BigNumber;
const {expect} = require("chai").use(require("chai-bignumber")(BN));
const {random, time, money, reject, snapshot} = require("./helpers/common");


contract("GoForItToken", ([owner, anyone]) => {
    const TOKEN_NAME = "Goin Token";
    const TOKEN_SYMBOL = "GOI";
    const TOKEN_DECIMALS = 18;

    describe("deployment", () => {
        let token;

        it("succeeds", async () => {
            token = await GoForItToken.new({from: owner});
            expect(await web3.eth.getCode(token.address)).to.be.not.oneOf(["0x", "0x0"]);
        });

        it("sets correct name", async () => {
            expect(await token.name()).to.be.equal(TOKEN_NAME);
        });

        it("sets correct symbol", async () => {
            expect(await token.symbol()).to.be.equal(TOKEN_SYMBOL);
        });

        it("sets correct decimals", async () => {
            expect(await token.decimals()).to.be.bignumber.equal(TOKEN_DECIMALS);
        });

        it("sets to paused state", async () => {
            expect(await token.paused()).to.be.true;
        });
    });

});

