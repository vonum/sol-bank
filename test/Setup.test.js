const { expect } = require("chai");
const { accounts, contract, web3 } = require("@openzeppelin/test-environment");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

const Token = contract.fromArtifact("Token");
const Bank = contract.fromArtifact("Bank");

describe("Bank", () => {
  const [ owner, user ] = accounts;
  const initialSupply = new BN("1000");
  const interval = new BN("100");
  const rewardPoolSize = new BN("100");

  beforeEach(async () => {
    this.tokenContract = await Token.new(initialSupply, {from: owner});
    this.bankContract = await Bank.new(100, this.tokenContract.address, {from: owner});

    await this.tokenContract.contract.methods
      .approve(this.bankContract.address, rewardPoolSize)
      .send({from: owner, gas: 500000});
  });

  it("Sets contract params properly", async () => {
    const erc20Address = await this.bankContract.erc20Token();
    const t = await this.bankContract.t();

    expect(erc20Address).to.equal(this.tokenContract.address);
    expect(t.toNumber()).to.equal(interval.toNumber());
  });

  describe("supplyReward", () => {
    it("Reverts when called by non owner", async () => {
      await expectRevert(
        this.bankContract.contract.methods
          .supplyReward(rewardPoolSize)
          .send({from: user, gas: 500000}),
        "Ownable: caller is not the owner",
      );
    });

    it("Transfers owner's tokens", async () => {
      await this.bankContract.contract.methods
        .supplyReward(rewardPoolSize)
        .send({from: owner, gas: 500000});

      const balance = await this.tokenContract.balanceOf(this.bankContract.address);

      expect(balance.toNumber()).to.eq(rewardPoolSize.toNumber());
    });

    it("Sets pool1 to 20% of total pool size", async () => {
      await this.bankContract.contract.methods
        .supplyReward(rewardPoolSize)
        .send({from: owner, gas: 500000});

      const pool1Reward = await this.bankContract.rewardPools(0);
      expect(pool1Reward.toNumber()).to.eq(20);
    });

    it("Sets pool2 to 30% of total pool size", async () => {
      await this.bankContract.contract.methods
        .supplyReward(rewardPoolSize)
        .send({from: owner, gas: 500000});

      const pool1Reward = await this.bankContract.rewardPools(1);
      expect(pool1Reward.toNumber()).to.eq(30);
    });

    it("Sets pool3 to 50% of total pool size", async () => {
      await this.bankContract.contract.methods
        .supplyReward(rewardPoolSize)
        .send({from: owner, gas: 500000});

      const pool1Reward = await this.bankContract.rewardPools(2);
      expect(pool1Reward.toNumber()).to.eq(50);
    });

    it("Emits event when reward is supplied", async () => {
      const tx = await this.bankContract.contract.methods
        .supplyReward(rewardPoolSize)
        .send({from: owner, gas: 500000});

      expectEvent(
        tx,
        "RewardSupplied",
        {value: rewardPoolSize.toString()}
      );
    });
  });
});
