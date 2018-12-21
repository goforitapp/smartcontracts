"use strict";

const GoForItToken = artifacts.require("./GoForItToken.sol");
const GoForItTokenSale = artifacts.require("./GoForItTokenSale.sol");

const BN = web3.BigNumber;
const {expect} = require("chai").use(require("chai-bignumber")(BN));
const {random, time, money, reject, snapshot} = require("./helpers/common");


contract("GoForItTokenSale", ([owner,
                               investor,
                               anyone,
                               wallet]) => {
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
    //const wallet = random.address();

    let initialState;


    before("Save initial state", async () => {
        initialState = await snapshot.new();
    });

    after("Revert initial state", async () => {
        await initialState.revert();
    });

    it("Token amounts sum up to total cap", async () => {
        let sum = TOTAL_TOKEN_CAP_OF_SALE
                  .plus(TOKEN_SHARE_OF_PRESALE)
                  .plus(TOKEN_SHARE_OF_TEAM)
                  .plus(TOKEN_SHARE_OF_ADVISORS)
                  .plus(TOKEN_SHARE_OF_COMPANY)
                  .plus(TOKEN_SHARE_OF_BOUNTY);

        expect(sum).to.be.bignumber.equal(TOTAL_TOKEN_CAP);
    });

    describe("Deployment", () => {
        let token, sale;

        it("succeeds", async () => {
            token = await GoForItToken.new({from: owner});
            sale = await GoForItTokenSale.new(token.address, initialRate, wallet, {from: owner});
            expect(await web3.eth.getCode(sale.address)).to.be.not.oneOf(["0x", "0x0"]);
        });

        it("has correct total token cap", async () => {
            expect(await sale.TOTAL_TOKEN_CAP()).to.be.bignumber.equal(TOTAL_TOKEN_CAP);
        });

        it("has correct total token cap of sale", async () => {
            expect(await sale.TOTAL_TOKEN_CAP_OF_SALE()).to.be.bignumber.equal(TOTAL_TOKEN_CAP_OF_SALE);
        });

        it("has correct token share of presale", async () => {
            expect(await sale.TOKEN_SHARE_OF_PRESALE()).to.be.bignumber.equal(TOKEN_SHARE_OF_PRESALE);
        });

        it("has correct token share of team", async () => {
            expect(await sale.TOKEN_SHARE_OF_TEAM()).to.be.bignumber.equal(TOKEN_SHARE_OF_TEAM);
        });

        it("has correct token share of advisors", async () => {
            expect(await sale.TOKEN_SHARE_OF_ADVISORS()).to.be.bignumber.equal(TOKEN_SHARE_OF_ADVISORS);
        });

        it("has correct token share of bounty", async () => {
            expect(await sale.TOKEN_SHARE_OF_BOUNTY()).to.be.bignumber.equal(TOKEN_SHARE_OF_BOUNTY);
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

        it("sets correct sale opening time", async () => {
            expect(await sale.openingTime()).to.be.bignumber.equal(SALE_OPENING_TIME);
        });

        it("sets correct sale closing time", async () => {
            expect(await sale.closingTime()).to.be.bignumber.equal(SALE_CLOSING_TIME);
        });
    });

    context("BEFORE SALE OPENS", () => {
        let startState;
        let token, sale;

        before("Create start state", async () => {
            await initialState.restore();
            token = await GoForItToken.new({from: owner});
            sale = await GoForItTokenSale.new(token.address, initialRate, wallet, {from: owner});
            await token.transferOwnership(sale.address, {from: owner});
            startState = await snapshot.new();
        });

        afterEach("Restore start state", async () => {
            await startState.restore();
        });

        describe("Sale", () => {

            it("is not ongoing", async () => {
                expect(await sale.goForItSaleOngoing()).to.be.false;
            });
        });

        describe("Rate change", () => {

            it("is forbidden if new rate is zero", async () => {
                let reason = await reject.call(sale.setRate(0, {from: owner}));
                expect(reason).to.be.equal("rate change is too big");
            });

            it("is forbidden for anyone but owner", async () => {
                let rate = await sale.rate();
                let reason = await reject.call(sale.setRate(rate.plus(1), {from: anyone}));
                expect(reason).to.be.equal("");
            });

            it("is forbidden if new rate is an order of magnitude bigger", async () => {
                let rate = await sale.rate();
                let reason = await reject.call(sale.setRate(rate.times(10), {from: owner}));
                expect(reason).to.be.equal("rate change is too big");
            });

            it("is forbidden if new rate is an order of magnitude smaller", async () => {
                let rate = await sale.rate();
                let reason = await reject.call(sale.setRate(rate.divToInt(10), {from: owner}));
                expect(reason).to.be.equal("rate change is too big");
            });

            it("does nothing if new rate equals old one", async () => {
                let rate = await sale.rate();
                let tx = await sale.setRate(rate, {from: owner});
                let log = tx.logs.find(log => log.event === "RateChanged");
                expect(log).to.not.exist;
            });

            it("is possible", async () => {
                let rate = await sale.rate();
                await sale.setRate(rate.times(2).plus(1), {from: owner});
            });

            it("gets logged", async () => {
                let rate = await sale.rate();
                let newRate = rate.times(2).plus(1);
                let tx = await sale.setRate(newRate, {from: owner});
                let log = tx.logs.find(log => log.event === "RateChanged");
                expect(log).to.exist;
                expect(log.args.newRate).to.be.bignumber.equal(newRate);
            });
        });

        describe("Investor verification", () => {

            it("is forbidden for anyone but owner", async () => {
                let reason = await reject.call(sale.verifyInvestors([investor], {from: anyone}));
                expect(reason).to.be.equal("");
            });

            it("does nothing if investors were verified already", async () => {
                await sale.verifyInvestors([investor], {from: owner});
                let tx = await sale.verifyInvestors([investor], {from: owner});
                let log = tx.logs.find(log => log.event === "InvestorVerified");
                expect(log).to.not.exist;
            });

            it("is possible", async () => {
                await sale.verifyInvestors([investor], {from: owner});
                let [isVerified] = await sale.investments(investor);
                expect(isVerified).to.be.true;
            });

            it("gets logged", async () => {
                let tx = await sale.verifyInvestors([investor], {from: owner});
                let log = tx.logs.find(log => log.event === "InvestorVerified");
                expect(log).to.exist;
                expect(log.args.investor).to.be.bignumber.equal(investor);
            });
        });

        describe("Token purchase", () => {

            it("is forbidden", async () => {
                let reason = await reject.call(sale.buyTokens(investor, {from: investor, value: money.ether(1)}));
                expect(reason).to.be.equal("");
            });
        });

        describe("Investment withdrawal", () => {

            it("is forbidden", async () => {
                let reason = await reject.call(sale.withdrawInvestment({from: investor}));
                expect(reason).to.be.equal("sale has not closed yet");
            });
        });

        describe("Finalization", () => {

            it("is forbidden", async () => {
                let reason = await reject.call(sale.finalize({from: owner}));
                expect(reason).to.be.equal("");
            });
        });
    });

    context("WHILE SALE IS OPEN", () => {
        let startState;
        let token, sale;

        before("Create start state", async () => {
            await initialState.restore();
            token = await GoForItToken.new({from: owner});
            sale = await GoForItTokenSale.new(token.address, initialRate, wallet, {from: owner});
            await token.transferOwnership(sale.address, {from: owner});
            await time.increaseTo((await sale.openingTime()).plus(time.minutes(1)));
            startState = await snapshot.new();
        });

        afterEach("Restore start state", async () => {
            await startState.restore();
        });

        describe("Sale", () => {

            it("is ongoing", async () => {
                expect(await sale.goForItSaleOngoing()).to.be.true;
            });
        });

        describe("Rate change", () => {

            it("is forbidden if new rate is zero", async () => {
                let reason = await reject.call(sale.setRate(0, {from: owner}));
                expect(reason).to.be.equal("rate change is too big");
            });

            it("is forbidden for anyone but owner", async () => {
                let rate = await sale.rate();
                let reason = await reject.call(sale.setRate(rate.plus(1), {from: anyone}));
                expect(reason).to.be.equal("");
            });

            it("is forbidden if new rate is an order of magnitude bigger", async () => {
                let rate = await sale.rate();
                let reason = await reject.call(sale.setRate(rate.times(10), {from: owner}));
                expect(reason).to.be.equal("rate change is too big");
            });

            it("is forbidden if new rate is an order of magnitude smaller", async () => {
                let rate = await sale.rate();
                let reason = await reject.call(sale.setRate(rate.divToInt(10), {from: owner}));
                expect(reason).to.be.equal("rate change is too big");
            });

            it("does nothing if new rate equals old one", async () => {
                let rate = await sale.rate();
                let tx = await sale.setRate(rate, {from: owner});
                let log = tx.logs.find(log => log.event === "RateChanged");
                expect(log).to.not.exist;
            });

            it("is possible", async () => {
                let rate = await sale.rate();
                await sale.setRate(rate.times(2).plus(1), {from: owner});
            });

            it("gets logged", async () => {
                let rate = await sale.rate();
                let newRate = rate.times(2).plus(1);
                let tx = await sale.setRate(newRate, {from: owner});
                let log = tx.logs.find(log => log.event === "RateChanged");
                expect(log).to.exist;
                expect(log.args.newRate).to.be.bignumber.equal(newRate);
            });
        });

        describe("Investor verification", () => {

            it("is forbidden for anyone but owner", async () => {
                let reason = await reject.call(sale.verifyInvestors([investor], {from: anyone}));
                expect(reason).to.be.equal("");
            });

            it("is forbidden if not enough available", async () => {
                let remaining = await sale.remainingTokensForSale();
                let rate = await sale.rate();
                let value = remaining.divToInt(rate);
                while (value.gt(money.ether(10))) {
                    rate = rate.times(9);
                    await sale.setRate(rate, {from: owner});
                    value = remaining.divToInt(rate);
                }
                value = value.plus(money.wei(1));
                await sale.buyTokens(investor, {from: investor, value});
                let reason = await reject.call(sale.verifyInvestors([investor], {from: owner}));
                expect(reason).to.be.equal("not enough tokens available");
            });

            it("does nothing if investors were verified already", async () => {
                await sale.verifyInvestors([investor], {from: owner});
                let tx = await sale.verifyInvestors([investor], {from: owner});
                let log = tx.logs.find(log => log.event === "InvestorVerified");
                expect(log).to.not.exist;
            });

            it("is possible", async () => {
                await sale.verifyInvestors([investor], {from: owner});
                let [isVerified] = await sale.investments(investor);
                expect(isVerified).to.be.true;
            });

            it("gets logged", async () => {
                let tx = await sale.verifyInvestors([investor], {from: owner});
                let log = tx.logs.find(log => log.event === "InvestorVerified");
                expect(log).to.exist;
                expect(log.args.investor).to.be.bignumber.equal(investor);
            });

            it("resets pending tokens", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(2)});
                let balance = await token.balanceOf(investor);
                await sale.verifyInvestors([investor], {from: owner});
                let [_0, _1, pending] = await sale.investments(investor);
                expect(pending).to.be.bignumber.zero;
            });

            it("delivers pending tokens", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(2)});
                let balance = await token.balanceOf(investor);
                let [_0, _1, pending] = await sale.investments(investor);
                await sale.verifyInvestors([investor], {from: owner});
                expect(await token.balanceOf(investor)).to.be.bignumber.equal(balance.plus(pending));
            });

            it("token delivery gets logged", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(2)});
                let [_0, _1, pending] = await sale.investments(investor);
                let tx = await sale.verifyInvestors([investor], {from: owner});
                let log = tx.logs.find(log => log.event === "TokensDelivered");
                expect(log).to.exist;
                expect(log.args.investor).to.be.bignumber.equal(investor);
                expect(log.args.amount).to.be.bignumber.equal(pending);
            });

            it("forwards held back funds", async () => {
                let value = money.ether(2);
                await sale.buyTokens(investor, {from: investor, value});
                let balance = await web3.eth.getBalance(wallet);
                await sale.verifyInvestors([investor], {from: owner});
                expect(await web3.eth.getBalance(wallet))
                    .to.be.bignumber.least(balance.plus(value).minus(money.finney(10)));
            });
        });

        describe("Token purchase by unverified investors", () => {

            it("is forbidden for the benefit of somebody else", async () => {
                let reason = await reject.call(sale.buyTokens(anyone, {from: investor, value: money.ether(1)}));
                expect(reason).to.be.equal("beneficiary is not the buyer");
            });

            it("is possible", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
            });

            it("increases individual investments", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
                let [_0, investment] = await sale.investments(investor);
                let value = money.ether(2);
                await sale.buyTokens(investor, {from: investor, value});
                let [_1, totalInvestment] = await sale.investments(investor);
                expect(totalInvestment).to.be.bignumber.equal(investment.plus(value));
            });

            it("increases pending tokens", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
                let [_0, _1, pending] = await sale.investments(investor);
                let value = money.ether(2);
                let amount = value.times(await sale.rate());
                await sale.buyTokens(investor, {from: investor, value});
                let [_2, _3, totalPending] = await sale.investments(investor);
                expect(totalPending).to.be.bignumber.equal(pending.plus(amount));
            });

            it("doesn't decrease remaining tokens", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
                let remaining = await sale.remainingTokensForSale();
                await sale.buyTokens(investor, {from: investor, value: money.ether(2)});
                expect(await sale.remainingTokensForSale()).to.be.bignumber.equal(remaining);
            });

            it("doesn't deliver tokens", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
                let balance = await token.balanceOf(investor);
                await sale.buyTokens(investor, {from: investor, value: money.ether(2)});
                expect(await token.balanceOf(investor)).to.be.bignumber.equal(balance);
            });

            it("increases sale's balance", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
                let balance = await web3.eth.getBalance(sale.address);
                let value = money.ether(2);
                await sale.buyTokens(investor, {from: investor, value});
                expect(await web3.eth.getBalance(sale.address)).to.be.bignumber.equal(balance.plus(value));
            });

            it("doesn't forward funds", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
                let balance = await web3.eth.getBalance(wallet);
                await sale.buyTokens(investor, {from: investor, value: money.ether(2)});
                expect(await web3.eth.getBalance(wallet)).to.be.bignumber.equal(balance);
            });
        });

        describe("Token purchase by verified investors", async () => {

            beforeEach("verify investor", async () => {
                await sale.verifyInvestors([investor], {from: owner});
            });

            it("is forbidden for the benefit of somebody else", async () => {
                let reason = await reject.call(sale.buyTokens(anyone, {from: investor, value: money.ether(1)}));
                expect(reason).to.be.equal("beneficiary is not the buyer");
            });

            it("is forbidden if not enough available", async () => {
                let remaining = await sale.remainingTokensForSale();
                let rate = await sale.rate();
                let value = remaining.divToInt(rate);
                while (value.gt(money.ether(10))) {
                    rate = rate.times(9);
                    await sale.setRate(rate, {from: owner});
                    value = remaining.divToInt(rate);
                }
                value = value.plus(money.wei(1));
                let reason = await reject.call(sale.buyTokens(investor, {from: investor, value}));
                expect(reason).to.be.equal("not enough tokens available");
            });

            it("is possible", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
            });

            it("increases individual investments", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
                let [_0, investment] = await sale.investments(investor);
                let value = money.ether(2);
                await sale.buyTokens(investor, {from: investor, value});
                let [_1, totalInvestment] = await sale.investments(investor);
                expect(totalInvestment).to.be.bignumber.equal(investment.plus(value));
            });

            it("doesn't increase pending tokens", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
                let [_0, _1, pending] = await sale.investments(investor);
                await sale.buyTokens(investor, {from: investor, value: money.ether(2)});
                let [_2, _3, totalPending] = await sale.investments(investor);
                expect(totalPending).to.be.bignumber.equal(pending);
            });

            it("decreases remaining tokens", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
                let remaining = await sale.remainingTokensForSale();
                let value = money.ether(2);
                let amount = value.times(await sale.rate());
                await sale.buyTokens(investor, {from: investor, value});
                expect(await sale.remainingTokensForSale()).to.be.bignumber.equal(remaining.minus(amount));
            });

            it("delivers tokens", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
                let balance = await token.balanceOf(investor);
                let value = money.ether(2);
                let amount = value.times(await sale.rate());
                await sale.buyTokens(investor, {from: investor, value});
                expect(await token.balanceOf(investor)).to.be.bignumber.equal(balance.plus(amount));
            });

            it("token delivery gets logged", async () => {
                let value = money.ether(2);
                let amount = value.times(await sale.rate());
                let tx = await sale.buyTokens(investor, {from: investor, value});
                let log = tx.logs.find(log => log.event === "TokensDelivered");
                expect(log).to.exist;
                expect(log.args.investor).to.be.bignumber.equal(investor);
                expect(log.args.amount).to.be.bignumber.equal(amount);
            });

            it("doesn't increase sale's balance", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
                let balance = await web3.eth.getBalance(sale.address);
                await sale.buyTokens(investor, {from: investor, value: money.ether(2)});
                expect(await web3.eth.getBalance(sale.address)).to.be.bignumber.equal(balance);
            });

            it("forwards funds", async () => {
                await sale.buyTokens(investor, {from: investor, value: money.ether(1)});
                let balance = await web3.eth.getBalance(wallet);
                let value = await money.ether(2);
                await sale.buyTokens(investor, {from: investor, value});
                expect(await web3.eth.getBalance(wallet)).to.be.bignumber.equal(balance.plus(value));
            });
        });

        describe("Investment withdrawal", () => {

            it("is forbidden", async () => {
                let reason = await reject.call(sale.withdrawInvestment({from: investor}));
                expect(reason).to.be.equal("sale has not closed yet");
            });
        });

        describe("Finalization", () => {

            it("is forbidden", async () => {
                let reason = await reject.call(sale.finalize({from: owner}));
                expect(reason).to.be.equal("");
            });
        });
    });

    context("AFTER SALE CLOSED", () => {
        let startState;
        let token, sale;

        before("Create start state", async () => {
            await initialState.restore();
            token = await GoForItToken.new({from: owner});
            sale = await GoForItTokenSale.new(token.address, initialRate, wallet, {from: owner});
            await token.transferOwnership(sale.address, {from: owner});
            await time.increaseTo((await sale.openingTime()).plus(time.minutes(1)));
            await sale.buyTokens(investor, {from: investor, value: money.ether(3)});
            await time.increaseTo((await sale.closingTime()).plus(time.minutes(2)));
            startState = await snapshot.new();
        });

        afterEach("Restore start state", async () => {
            await startState.restore();
        });

        describe("Sale", () => {

            it("is not ongoing", async () => {
                expect(await sale.goForItSaleOngoing()).to.be.false;
            });
        });

        describe("Rate change", () => {

            it("is forbidden if new rate is zero", async () => {
                let reason = await reject.call(sale.setRate(0, {from: owner}));
                expect(reason).to.be.equal("rate change is too big");
            });

            it("is forbidden for anyone but owner", async () => {
                let rate = await sale.rate();
                let reason = await reject.call(sale.setRate(rate.plus(1), {from: anyone}));
                expect(reason).to.be.equal("");
            });

            it("is forbidden if new rate is an order of magnitude bigger", async () => {
                let rate = await sale.rate();
                let reason = await reject.call(sale.setRate(rate.times(10), {from: owner}));
                expect(reason).to.be.equal("rate change is too big");
            });

            it("is forbidden if new rate is an order of magnitude smaller", async () => {
                let rate = await sale.rate();
                let reason = await reject.call(sale.setRate(rate.divToInt(10), {from: owner}));
                expect(reason).to.be.equal("rate change is too big");
            });

            it("does nothing if new rate equals old one", async () => {
                let rate = await sale.rate();
                let tx = await sale.setRate(rate, {from: owner});
                let log = tx.logs.find(log => log.event === "RateChanged");
                expect(log).to.not.exist;
            });

            it("is possible", async () => {
                let rate = await sale.rate();
                await sale.setRate(rate.times(2).plus(1), {from: owner});
            });

            it("gets logged", async () => {
                let rate = await sale.rate();
                let newRate = rate.times(2).plus(1);
                let tx = await sale.setRate(newRate, {from: owner});
                let log = tx.logs.find(log => log.event === "RateChanged");
                expect(log).to.exist;
                expect(log.args.newRate).to.be.bignumber.equal(newRate);
            });
        });

        describe("Investor verification", () => {

            it("is forbidden for anyone but owner", async () => {
                let reason = await reject.call(sale.verifyInvestors([investor], {from: anyone}));
                expect(reason).to.be.equal("");
            });

            it("does nothing if investors were verified already", async () => {
                await sale.verifyInvestors([investor], {from: owner});
                let tx = await sale.verifyInvestors([investor], {from: owner});
                let log = tx.logs.find(log => log.event === "InvestorVerified");
                expect(log).to.not.exist;
            });

            it("is possible", async () => {
                await sale.verifyInvestors([investor], {from: owner});
                let [isVerified] = await sale.investments(investor);
                expect(isVerified).to.be.true;
            });

            it("gets logged", async () => {
                let tx = await sale.verifyInvestors([investor], {from: owner});
                let log = tx.logs.find(log => log.event === "InvestorVerified");
                expect(log).to.exist;
                expect(log.args.investor).to.be.bignumber.equal(investor);
            });

            it("resets pending tokens", async () => {
                let balance = await token.balanceOf(investor);
                await sale.verifyInvestors([investor], {from: owner});
                let [_0, _1, pending] = await sale.investments(investor);
                expect(pending).to.be.bignumber.zero;
            });

            it("delivers pending tokens", async () => {
                let balance = await token.balanceOf(investor);
                let [_0, _1, pending] = await sale.investments(investor);
                await sale.verifyInvestors([investor], {from: owner});
                expect(await token.balanceOf(investor)).to.be.bignumber.equal(balance.plus(pending));
            });

            it("token delivery gets logged", async () => {
                let [_0, _1, pending] = await sale.investments(investor);
                let tx = await sale.verifyInvestors([investor], {from: owner});
                let log = tx.logs.find(log => log.event === "TokensDelivered");
                expect(log).to.exist;
                expect(log.args.investor).to.be.bignumber.equal(investor);
                expect(log.args.amount).to.be.bignumber.equal(pending);
            });

            it("forwards held back funds", async () => {
                let balance = await web3.eth.getBalance(wallet);
                let [_, investment] = await sale.investments(investor);
                await sale.verifyInvestors([investor], {from: owner});
                expect(await web3.eth.getBalance(wallet))
                    .to.be.bignumber.least(balance.plus(investment).minus(money.finney(10)));
            });
        });

        describe("Token purchase", () => {

            it("is forbidden", async () => {
                let reason = await reject.call(sale.buyTokens(investor, {from: investor, value: money.ether(1)}));
                expect(reason).to.be.equal("");
            });
        });

        describe("Investment withdrawal", () => {

            it("is forbidden for verified investors", async () => {
                await sale.verifyInvestors([investor], {from: owner});
                let reason = await reject.call(sale.withdrawInvestment({from: investor}));
                expect(reason).to.be.equal("investor was verified already");
            });

            it("is forbidden for anyone", async () => {
                let reason = await reject.call(sale.withdrawInvestment({from: anyone}));
                expect(reason).to.be.equal("investment is zero");
            });

            it("is possible", async () => {
                let [_, investment] = await sale.investments(investor);
                let balance = await web3.eth.getBalance(investor);
                await sale.withdrawInvestment({from: investor});
                expect(await web3.eth.getBalance(investor))
                    .to.be.bignumber.least(balance.plus(investment).minus(money.finney(10)));
            });

            it("gets logged", async () => {
                let [_, investment] = await sale.investments(investor);
                let tx = await sale.withdrawInvestment({from: investor});
                let log = tx.logs.find(log => log.event === "InvestmentWithdrawn");
                expect(log).to.exist;
                expect(log.args.investor).to.be.bignumber.equal(investor);
                expect(log.args.value).to.be.bignumber.equal(investment);
            });

            it("resets pending tokens", async () => {
                await sale.withdrawInvestment({from: investor});
                let [_0, _1, pending] = await sale.investments(investor);
                expect(pending).to.be.bignumber.zero;
            });

            it("resets investment", async () => {
                await sale.withdrawInvestment({from: investor});
                let [_, investment] = await sale.investments(investor);
                expect(investment).to.be.bignumber.zero;
            });
        });

        describe("Finalization", () => {

            it("is forbidden for anyone but owner", async () => {
                let reason = await reject.call(sale.finalize({from: anyone}));
                expect(reason).to.be.equal("");
            });

            it("is possible", async () => {
                await sale.finalize({from: owner});
                expect(await sale.isFinalized()).to.be.true;
            });

            it("gets logged", async () => {
                let tx = await sale.finalize({from: owner});
                let log = tx.logs.find(log => log.event === "Finalized");
                expect(log).to.exist;
            });

            it("creates a vesting contract", async () => {
                await sale.finalize({from: owner});
                let vesting = await sale.vesting();
                expect(vesting).to.be.not.bignumber.zero;
                expect(await web3.eth.getCode(vesting)).to.be.not.oneOf(["0x", "0x0"]);
            });

            it("mints shares for the benefit of the vesting contract", async () => {
                await sale.finalize({from: owner});
                expect(await token.balanceOf(await sale.vesting())).to.be.bignumber.equal(
                    TOKEN_SHARE_OF_ADVISORS.plus(TOKEN_SHARE_OF_TEAM.times(75).divToInt(100)));
            });

            it("mints shares for the benefit of the wallet", async () => {
                let balance = await token.balanceOf(wallet);
                await sale.finalize({from: owner});
                expect(await token.balanceOf(wallet)).to.be.bignumber.equal(
                    balance
                    .plus(TOKEN_SHARE_OF_PRESALE)
                    .plus(TOKEN_SHARE_OF_COMPANY)
                    .plus(TOKEN_SHARE_OF_BOUNTY)
                    .plus(TOKEN_SHARE_OF_TEAM.times(25).divToInt(100)));
            });

            it("finishes minting", async () => {
                await sale.finalize({from: owner});
                expect(await token.mintingFinished()).to.be.true;
            });

            it("unpauses the token", async () => {
                await sale.finalize({from: owner});
                expect(await token.paused()).to.be.false;
            });
        });
    });

    context("AFTER FINALIZATION", () => {
        let startState;
        let token, sale;

        before("Create start state", async () => {
            await initialState.restore();
            token = await GoForItToken.new({from: owner});
            sale = await GoForItTokenSale.new(token.address, initialRate, wallet, {from: owner});
            await token.transferOwnership(sale.address, {from: owner});
            await time.increaseTo((await sale.openingTime()).plus(time.minutes(1)));
            await sale.buyTokens(investor, {from: investor, value: money.ether(3)});
            await time.increaseTo((await sale.closingTime()).plus(time.minutes(3)));
            await sale.finalize({from: owner});
            startState = await snapshot.new();
        });

        afterEach("Restore start state", async () => {
            await startState.restore();
        });

        describe("Sale", () => {

            it("is not ongoing", async () => {
                expect(await sale.goForItSaleOngoing()).to.be.false;
            });
        });

        describe("Rate change", () => {

            it("is forbidden if new rate is zero", async () => {
                let reason = await reject.call(sale.setRate(0, {from: owner}));
                expect(reason).to.be.equal("rate change is too big");
            });

            it("is forbidden for anyone but owner", async () => {
                let rate = await sale.rate();
                let reason = await reject.call(sale.setRate(rate.plus(1), {from: anyone}));
                expect(reason).to.be.equal("");
            });

            it("is forbidden if new rate is an order of magnitude bigger", async () => {
                let rate = await sale.rate();
                let reason = await reject.call(sale.setRate(rate.times(10), {from: owner}));
                expect(reason).to.be.equal("rate change is too big");
            });

            it("is forbidden if new rate is an order of magnitude smaller", async () => {
                let rate = await sale.rate();
                let reason = await reject.call(sale.setRate(rate.divToInt(10), {from: owner}));
                expect(reason).to.be.equal("rate change is too big");
            });

            it("does nothing if new rate equals old one", async () => {
                let rate = await sale.rate();
                let tx = await sale.setRate(rate, {from: owner});
                let log = tx.logs.find(log => log.event === "RateChanged");
                expect(log).to.not.exist;
            });

            it("is possible", async () => {
                let rate = await sale.rate();
                await sale.setRate(rate.times(2).plus(1), {from: owner});
            });

            it("gets logged", async () => {
                let rate = await sale.rate();
                let newRate = rate.times(2).plus(1);
                let tx = await sale.setRate(newRate, {from: owner});
                let log = tx.logs.find(log => log.event === "RateChanged");
                expect(log).to.exist;
                expect(log.args.newRate).to.be.bignumber.equal(newRate);
            });
        });

        describe("Investor verification", () => {

            it("is forbidden", async () => {
                let reason = await reject.call(sale.verifyInvestors([investor], {from: owner}));
                expect(reason).to.be.equal("sale was finalized already");
            });
        });

        describe("Token purchase", () => {

            it("is forbidden", async () => {
                let reason = await reject.call(sale.buyTokens(investor, {from: investor, value: money.ether(1)}));
                expect(reason).to.be.equal("");
            });
        });

        describe("Investment withdrawal", () => {

            it("is forbidden for anyone", async () => {
                let reason = await reject.call(sale.withdrawInvestment({from: anyone}));
                expect(reason).to.be.equal("investment is zero");
            });

            it("is possible", async () => {
                let [_, investment] = await sale.investments(investor);
                let balance = await web3.eth.getBalance(investor);
                await sale.withdrawInvestment({from: investor});
                expect(await web3.eth.getBalance(investor))
                    .to.be.bignumber.least(balance.plus(investment).minus(money.finney(10)));
            });

            it("gets logged", async () => {
                let [_, investment] = await sale.investments(investor);
                let tx = await sale.withdrawInvestment({from: investor});
                let log = tx.logs.find(log => log.event === "InvestmentWithdrawn");
                expect(log).to.exist;
                expect(log.args.investor).to.be.bignumber.equal(investor);
                expect(log.args.value).to.be.bignumber.equal(investment);
            });

            it("resets pending tokens", async () => {
                await sale.withdrawInvestment({from: investor});
                let [_0, _1, pending] = await sale.investments(investor);
                expect(pending).to.be.bignumber.zero;
            });

            it("resets investment", async () => {
                await sale.withdrawInvestment({from: investor});
                let [_, investment] = await sale.investments(investor);
                expect(investment).to.be.bignumber.zero;
            });
        });

        describe("Finalization", () => {

            it("is forbidden", async () => {
                let reason = await reject.call(sale.finalize({from: owner}));
                expect(reason).to.be.equal("");
            });
        });
    });

});

