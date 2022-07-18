const { expect } = require("chai");
const { accounts, contract, web3 } = require("@openzeppelin/test-environment");
const { BN, expectEvent, expectRevert, time } = require("@openzeppelin/test-helpers");

const Token = contract.fromArtifact("Token");
const Bank = contract.fromArtifact("Bank");

describe("Bank", () => {
  const [ owner, user ] = accounts;
  const initialSupply = new BN("1000");
  const interval = new BN("100");
  const rewardPoolSize = new BN("100");
  const depositSize = new BN("100");

  beforeEach(async () => {
    this.tokenContract = await Token.new(initialSupply, {from: owner});
    this.bankContract = await Bank.new(100, this.tokenContract.address, {from: owner});

    await this.tokenContract.contract.methods
      .approve(this.bankContract.address, rewardPoolSize)
      .send({from: owner, gas: 500000});

    await this.tokenContract.contract.methods
      .transfer(user, depositSize)
      .send({from: owner, gas: 500000});

    await this.tokenContract.contract.methods
      .approve(this.bankContract.address, depositSize)
      .send({from: user, gas: 500000});

    await this.bankContract.contract.methods
      .supplyReward(rewardPoolSize)
      .send({from: owner, gas: 500000});
  });

  describe("deposit", () => {
    it("Saves user's deposit value", async () => {
      await this.bankContract.contract.methods
        .deposit(depositSize)
        .send({from: user, gas: 500000});

      const deposit = await this.bankContract.deposits(user);
      const totalDeposit = await this.bankContract.totalDeposit();

      expect(deposit.toNumber()).to.eq(depositSize.toNumber());
      expect(totalDeposit.toNumber()).to.eq(depositSize.toNumber());
    });

    it("Transfers user's tokens", async () => {
      await this.bankContract.contract.methods
        .deposit(depositSize)
        .send({from: user, gas: 500000});

      const balance = await this.tokenContract.balanceOf(this.bankContract.address);
      const expectedBalance = depositSize.toNumber() + rewardPoolSize.toNumber();

      expect(balance.toNumber()).to.eq(expectedBalance);
    });

    it("Emits event when tokens are deposited", async () => {
      const tx = await this.bankContract.contract.methods
        .deposit(depositSize)
        .send({from: user, gas: 500000});

      expectEvent(
        tx,
        "Deposit",
        {sender: user, value: depositSize.toString()}
      );
    });

    it("Reverts if deposit period has passed", async () => {
      time.increase(101);

      await expectRevert(
        this.bankContract.contract.methods
          .deposit(depositSize)
          .send({from: user, gas: 500000}),
        "Deposit period has ended",
      );
    });
  });
});
