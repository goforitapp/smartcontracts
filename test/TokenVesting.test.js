"use strict";

const GoForItToken = artifacts.require("./GoForItToken.sol");
const TokenVesting = artifacts.require("./TokenVesting.sol");

const BN = web3.BigNumber;
const {expect} = require("chai").use(require("chai-bignumber")(BN));
const {random, time, money, reject, snapshot} = require("./helpers/common");


contract("TokenVesting", ([owner,
                           member1,
                           member2,
                           anyone]) => {
    const END_OF_VESTING_PERIOD = time.now() + time.years(1);

    let initialState;


    before("Save initial state", async () => {
        initialState = await snapshot.new();
    });

    after("Revert initial state", async () => {
        await initialState.revert();
    });

    describe("Deployment", () => {
        let token, vesting;

        before("Deploy token", async () => {
            token = await GoForItToken.new({from: owner});
        });

        it("succeeds", async () => {
            vesting = await TokenVesting.new(token.address, END_OF_VESTING_PERIOD, {from: owner});
            expect(await web3.eth.getCode(vesting.address)).to.be.not.oneOf(["0x", "0x0"]);
        });

        it("sets correct token", async () => {
            expect(await vesting.token()).to.be.bignumber.equal(token.address);
        });

        it("sets correct end of vesting period", async () => {
            expect(await vesting.endOfVestingPeriod()).to.be.bignumber.equal(END_OF_VESTING_PERIOD);
        });
    });

    context("WITHIN VESTING PERIOD", () => {
        let startState;
        let token, vesting;

        before("Create start state", async () => {
            await initialState.restore();
            token = await GoForItToken.new({from: owner});
            vesting = await TokenVesting.new(token.address, END_OF_VESTING_PERIOD, {from: owner});
            await token.mint(vesting.address, new BN("1000"), {from: owner});
            await token.finishMinting({from: owner});
            await token.unpause({from: owner});
            startState = await snapshot.new();
        });

        afterEach("Restore start state", async () => {
            await startState.restore();
        });

        describe("Token allocation", () => {

            it("is forbidden for anyone but owner", async () => {
                let available = (await token.balanceOf(vesting.address)).minus(await vesting.totalAllocation());
                let amount = await available.divToInt(2);
                let reason = await reject.call(vesting.allocate([member1], [amount], {from: anyone}));
                expect(reason).to.be.equal("");
            });

            it("fails if #beneficiaries is less than #amounts", async () => {
                let available = (await token.balanceOf(vesting.address)).minus(await vesting.totalAllocation());
                let amount1 = available.divToInt(2);
                let amount2 = available.divToInt(3);
                let reason = await reject.call(vesting.allocate([member1], [amount1, amount2], {from: owner}));
                expect(reason).to.be.equal("given array lengths differ");
            });

            it("fails if #beneficiaries is greater than #amounts", async () => {
                let available = (await token.balanceOf(vesting.address)).minus(await vesting.totalAllocation());
                let amount = available.divToInt(2);
                let reason = await reject.call(vesting.allocate([member1, member2], [amount], {from: owner}));
                expect(reason).to.be.equal("given array lengths differ");
            });

            it("fails if total allocation exceeds balance", async () => {
                let available = (await token.balanceOf(vesting.address)).minus(await vesting.totalAllocation());
                let amount = available.plus(1);
                let reason = await reject.call(vesting.allocate([member1], [amount], {from: owner}));
                expect(reason).to.be.equal("allocation exceeds balance");
            });

            it("is possible", async () => {
                let available = (await token.balanceOf(vesting.address)).minus(await vesting.totalAllocation());
                let amount1 = available.divToInt(2);
                let amount2 = available.divToInt(3);
                await vesting.allocate([member1, member2], [amount1, amount2], {from: owner});
                expect(await vesting.allocations(member1)).to.be.bignumber.equal(amount1);
                expect(await vesting.allocations(member2)).to.be.bignumber.equal(amount2);
            });

            it("gets logged", async () => {
                let available = (await token.balanceOf(vesting.address)).minus(await vesting.totalAllocation());
                let amount = available.divToInt(2);
                let tx = await vesting.allocate([member1], [amount], {from: owner});
                let log = tx.logs.find(log => log.event === "Allocation");
                expect(log).to.exist;
                expect(log.args.beneficiary).to.be.bignumber.equal(member1);
                expect(log.args.amount).to.be.bignumber.equal(amount);
            });

            it("increases total allocation", async () => {
                let available = (await token.balanceOf(vesting.address)).minus(await vesting.totalAllocation());
                let amount1 = available.divToInt(2);
                let amount2 = available.divToInt(3);
                await vesting.allocate([member1, member2], [amount1, amount2], {from: owner});
                expect(await vesting.totalAllocation()).to.be.bignumber.equal(amount1.plus(amount2));
            });

            it("updates allocations correctly", async () => {
                let available = (await token.balanceOf(vesting.address)).minus(await vesting.totalAllocation());
                let amount1 = available.divToInt(2);
                let amount2 = available.divToInt(3);
                let amount3 = available.divToInt(4);
                await vesting.allocate([member1, member1, member2], [amount1, amount2, amount3], {from: owner});
                await vesting.allocate([member2], [amount1], {from: owner});
                expect(await vesting.allocations(member1)).to.be.bignumber.equal(amount2);
                expect(await vesting.allocations(member2)).to.be.bignumber.equal(amount1);
            });

            it("updates total allocation correctly", async () => {
                let available = (await token.balanceOf(vesting.address)).minus(await vesting.totalAllocation());
                let amount1 = available.divToInt(2);
                let amount2 = available.divToInt(3);
                let amount3 = available.divToInt(4);
                await vesting.allocate([member1, member1, member2], [amount1, amount2, amount3], {from: owner});
                expect(await vesting.totalAllocation()).to.be.bignumber.equal(amount2.plus(amount3));
                await vesting.allocate([member2], [amount1], {from: owner});
                expect(await vesting.totalAllocation()).to.be.bignumber.equal(amount2.plus(amount1));
            });
        });

        describe("Token withdrawal", () => {

            it("is forbidden", async () => {
                let available = (await token.balanceOf(vesting.address)).minus(await vesting.totalAllocation());
                let amount = available.divToInt(2);
                await vesting.allocate([member1], [amount], {from: owner});
                let reason = await reject.call(vesting.withdraw({from: member1}));
                expect(reason).to.be.equal("tokens are still locked");
            });
        });

        describe("Token withdrawal for someone else", () => {

            it("is forbidden", async () => {
                let available = (await token.balanceOf(vesting.address)).minus(await vesting.totalAllocation());
                let amount = available.divToInt(2);
                await vesting.allocate([member1], [amount], {from: owner});
                let reason = await reject.call(vesting.withdrawFor([member1], {from: owner}));
                expect(reason).to.be.equal("tokens are still locked");
            });
        });

        describe("Destruction", () => {

            it("is forbidden", async () => {
                let reason = await reject.call(vesting.destruct({from: owner}));
                expect(reason).to.be.equal("destruction not possible yet");
            });
        });
    });

    context("WITHIN FIRST YEAR AFTER VESTING PERIOD ENDED", () => {
        let startState;
        let token, vesting;

        before("Create start state", async () => {
            await initialState.restore();
            token = await GoForItToken.new({from: owner});
            vesting = await TokenVesting.new(token.address, END_OF_VESTING_PERIOD, {from: owner});
            await token.mint(vesting.address, new BN("1000"), {from: owner});
            await token.finishMinting({from: owner});
            await token.unpause({from: owner});
            await vesting.allocate([member1, member2], [new BN("500"), new BN("300")], {from: owner});
            await time.increaseTo(END_OF_VESTING_PERIOD);
            startState = await snapshot.new();
        });

        afterEach("Restore start state", async () => {
            await startState.restore();
        });

        describe("Token allocation", () => {

            it("is still possible", async () => {
                let amount1 = (await vesting.allocations(member1)).divToInt(2);
                let amount2 = (await vesting.allocations(member2)).divToInt(3);
                await vesting.allocate([member1, member2], [amount1, amount2], {from: owner});
                expect(await vesting.allocations(member1)).to.be.bignumber.equal(amount1);
                expect(await vesting.allocations(member2)).to.be.bignumber.equal(amount2);
            });
        });

        describe("Token withdrawal", () => {

            it("does nothing if allocation is zero", async () => {
                let tx = await vesting.withdraw({from: anyone});
                let log = tx.logs.find(log => log.event === "Withdrawal");
                expect(log).to.not.exist;
            });

            it("is possible", async () => {
                let balance = await token.balanceOf(member1);
                let amount = await vesting.allocations(member1);
                await vesting.withdraw({from: member1});
                expect(await token.balanceOf(member1)).to.be.bignumber.equal(balance.plus(amount));
            });

            it("gets logged", async () => {
                let amount = await vesting.allocations(member1);
                let tx = await vesting.withdraw({from: member1});
                let log = tx.logs.find(log => log.event === "Withdrawal");
                expect(log).to.exist;
                expect(log.args.beneficiary).to.be.bignumber.equal(member1);
                expect(log.args.amount).to.be.bignumber.equal(amount);
            });

            it("resets allocation", async () => {
                await vesting.withdraw({from: member1});
                expect(await vesting.allocations(member1)).to.be.bignumber.zero;
            });

            it("decreases total allocation", async () => {
                let amount = await vesting.allocations(member1);
                let totalAllocation = await vesting.totalAllocation();
                await vesting.withdraw({from: member1});
                expect(await vesting.totalAllocation()).to.be.bignumber.equal(totalAllocation.minus(amount));
            });
        });

        describe("Token withdrawal for someone else", () => {

            it("is forbidden for anyone but owner", async () => {
                let reason = await reject.call(vesting.withdrawFor([member1], {from: anyone}));
                expect(reason).to.be.equal("");
            });

            it("does nothing if allocation is zero", async () => {
                let tx = await vesting.withdrawFor([anyone], {from: owner});
                let log = tx.logs.find(log => log.event === "Withdrawal");
                expect(log).to.not.exist;
            });

            it("is possible", async () => {
                let balance1 = await token.balanceOf(member1);
                let balance2 = await token.balanceOf(member2);
                let amount1 = await vesting.allocations(member1);
                let amount2 = await vesting.allocations(member2);
                await vesting.withdrawFor([member1, member2], {from: owner});
                expect(await token.balanceOf(member1)).to.be.bignumber.equal(balance1.plus(amount1));
                expect(await token.balanceOf(member2)).to.be.bignumber.equal(balance2.plus(amount2));
            });

            it("gets logged", async () => {
                let amount = await vesting.allocations(member1);
                let tx = await vesting.withdrawFor([member1], {from: owner});
                let log = tx.logs.find(log => log.event === "Withdrawal");
                expect(log).to.exist;
                expect(log.args.beneficiary).to.be.bignumber.equal(member1);
                expect(log.args.amount).to.be.bignumber.equal(amount);
            });

            it("resets allocation", async () => {
                await vesting.withdrawFor([member1, member2], {from: owner});
                expect(await vesting.allocations(member1)).to.be.bignumber.zero;
                expect(await vesting.allocations(member2)).to.be.bignumber.zero;
            });

            it("decreases total allocation", async () => {
                let amount1 = await vesting.allocations(member1);
                let amount2 = await vesting.allocations(member2);
                let totalAllocation = await vesting.totalAllocation();
                await vesting.withdrawFor([member1, member2], {from: owner});
                expect(await vesting.totalAllocation()).to.be.bignumber.equal(
                    totalAllocation.minus(amount1).minus(amount2));
            });
        });

        describe("Destruction", () => {

            it("is forbidden", async () => {
                let reason = await reject.call(vesting.destruct({from: owner}));
                expect(reason).to.be.equal("destruction not possible yet");
            });
        });
    });

    context("ONE YEAR AFTER VESTING PERIOD ENDED", () => {
        let startState;
        let token, vesting;

        before("Create start state", async () => {
            await initialState.restore();
            token = await GoForItToken.new({from: owner});
            vesting = await TokenVesting.new(token.address, END_OF_VESTING_PERIOD, {from: owner});
            await token.mint(vesting.address, new BN("1000"), {from: owner});
            await token.finishMinting({from: owner});
            await token.unpause({from: owner});
            await vesting.allocate([member1, member2], [new BN("500"), new BN("300")], {from: owner});
            await time.increaseTo(END_OF_VESTING_PERIOD + time.years(1));
            startState = await snapshot.new();
        });

        afterEach("Restore start state", async () => {
            await startState.restore();
        });

        describe("Token allocation", () => {

            it("is still possible", async () => {
                let amount1 = (await vesting.allocations(member1)).divToInt(2);
                let amount2 = (await vesting.allocations(member2)).divToInt(3);
                await vesting.allocate([member1, member2], [amount1, amount2], {from: owner});
                expect(await vesting.allocations(member1)).to.be.bignumber.equal(amount1);
                expect(await vesting.allocations(member2)).to.be.bignumber.equal(amount2);
            });
        });

        describe("Token withdrawal", () => {

            it("is still possible", async () => {
                let balance = await token.balanceOf(member1);
                let amount = await vesting.allocations(member1);
                await vesting.withdraw({from: member1});
                expect(await token.balanceOf(member1)).to.be.bignumber.equal(balance.plus(amount));
            });
        });

        describe("Token withdrawal for someone else", () => {

            it("is still possible", async () => {
                let balance1 = await token.balanceOf(member1);
                let balance2 = await token.balanceOf(member2);
                let amount1 = await vesting.allocations(member1);
                let amount2 = await vesting.allocations(member2);
                await vesting.withdrawFor([member1, member2], {from: owner});
                expect(await token.balanceOf(member1)).to.be.bignumber.equal(balance1.plus(amount1));
                expect(await token.balanceOf(member2)).to.be.bignumber.equal(balance2.plus(amount2));
            });
        });

        describe("Destruction", () => {

            it("is forbidden for anyone but owner", async () => {
                let reason = await reject.call(vesting.destruct({from: anyone}));
                expect(reason).to.be.equal("");
            });

            it("is possible", async () => {
                await vesting.destruct({from: owner});
                expect(await web3.eth.getCode(vesting.address)).to.be.oneOf(["0x", "0x0"]);
            });

            it("transfers remaining tokens to owner", async () => {
                let balance = await token.balanceOf(owner);
                let remaining = await token.balanceOf(vesting.address);
                expect(remaining).to.be.not.bignumber.zero;
                await vesting.destruct({from: owner});
                expect(await token.balanceOf(vesting.address)).to.be.bignumber.zero;
                expect(await token.balanceOf(owner)).to.be.bignumber.equal(balance.plus(remaining));
            });
        });
    });

});
