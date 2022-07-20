const { expect } = require("chai");
const { accounts, contract } = require("@openzeppelin/test-environment");
const { BN, expectEvent, expectRevert, time } = require("@openzeppelin/test-helpers");

const Token = contract.fromArtifact("Token");
const Bank = contract.fromArtifact("Bank");

describe("Bank", () => {
  const [ owner, user1, user2, user3 ] = accounts;
  const initialSupply = new BN("10000");
  const interval = new BN("100");
  const rewardPoolSize = new BN("1000");

  const depositSize1 = new BN("200");
  const depositSize2 = new BN("300");
  const depositSize3 = new BN("500");

  beforeEach(async () => {
    this.tokenContract = await Token.new(initialSupply, {from: owner});
    this.bankContract = await Bank.new(100, this.tokenContract.address, {from: owner});

    // Transfer tokens to users
    await this.tokenContract.contract.methods
      .transfer(user1, depositSize1)
      .send({from: owner, gas: 500000});

    await this.tokenContract.contract.methods
      .transfer(user2, depositSize2)
      .send({from: owner, gas: 500000});

    await this.tokenContract.contract.methods
      .transfer(user3, depositSize3)
      .send({from: owner, gas: 500000});

    // Approve contract to deposit tokens from users
    await this.tokenContract.contract.methods
      .approve(this.bankContract.address, rewardPoolSize)
      .send({from: owner, gas: 500000});

    await this.tokenContract.contract.methods
      .approve(this.bankContract.address, depositSize1)
      .send({from: user1, gas: 500000});

    await this.tokenContract.contract.methods
      .approve(this.bankContract.address, depositSize2)
      .send({from: user2, gas: 500000});

    await this.tokenContract.contract.methods
      .approve(this.bankContract.address, depositSize3)
      .send({from: user3, gas: 500000});

    // Supply reward
    await this.bankContract.contract.methods
      .supplyReward(rewardPoolSize)
      .send({from: owner, gas: 500000});

    // Deposit
    await this.bankContract.contract.methods
      .deposit(depositSize1)
      .send({from: user1, gas: 500000});

    await this.bankContract.contract.methods
      .deposit(depositSize2)
      .send({from: user2, gas: 500000});

    await this.bankContract.contract.methods
      .deposit(depositSize3)
      .send({from: user3, gas: 500000});
  });

  describe("No withdrawal period", () => {
    it("Can't withdraw during deposit period", async () => {
      await expectRevert(
        this.bankContract.contract.methods
          .withdraw()
          .send({from: user1, gas: 500000}),
        "Withdraw period has not started",
      );
    });

    it("Can't withdraw during lock period", async () => {
      time.increase(101);

      await expectRevert(
        this.bankContract.contract.methods
          .withdraw()
          .send({from: user1, gas: 500000}),
        "Withdraw period has not started",
      );
    });
  });

  describe("Withdraw period", () => {
    beforeEach(async () => {
      time.increase(201);
    });

    it("Successfully withdraws tokens", async () => {
      const tx = await this.bankContract.contract.methods
        .withdraw()
        .send({from: user1, gas: 500000});

      expect(tx.status).to.eq(true);
    });

    it("Emits event when tokens are withdrawn", async () => {
      const tx = await this.bankContract.contract.methods
        .withdraw()
        .send({from: user1, gas: 500000});

      expectEvent(
        tx,
        "TokensWithdrew",
        {sender: user1, value: depositSize1.toString(), reward: "40"}
      );
    });
  });

  describe("Round 1", () => {
    beforeEach(async () => {
      time.increase(201);

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user3, gas: 500000});

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user2, gas: 500000});

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user1, gas: 500000});
    });

    it("Empties only pool 1", async () => {
      const pool1Reward = await this.bankContract.rewardPools(0);
      const pool2Reward = await this.bankContract.rewardPools(1);
      const pool3Reward = await this.bankContract.rewardPools(2);

      expect(pool1Reward.toNumber()).to.eq(0);
      expect(pool2Reward.toNumber()).to.eq(300);
      expect(pool3Reward.toNumber()).to.eq(500);
    });

    it("Transfers tokens back to the users", async () => {
      const balance = await this.tokenContract.balanceOf(this.bankContract.address);
      const user1Balance = await this.tokenContract.balanceOf(user1);
      const user2Balance = await this.tokenContract.balanceOf(user2);
      const user3Balance = await this.tokenContract.balanceOf(user3);

      expect(balance.toNumber()).to.eq(800); // 80% of reward pool left
      expect(user1Balance.toNumber()).to.eq(240);
      expect(user2Balance.toNumber()).to.eq(360);
      expect(user3Balance.toNumber()).to.eq(600);
    });
  });

  describe("Round 2", () => {
    beforeEach(async () => {
      time.increase(301);

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user3, gas: 500000});

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user2, gas: 500000});

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user1, gas: 500000});
    });

    it("Empties pool 1 and 2", async () => {
      const pool1Reward = await this.bankContract.rewardPools(0);
      const pool2Reward = await this.bankContract.rewardPools(1);
      const pool3Reward = await this.bankContract.rewardPools(2);

      expect(pool1Reward.toNumber()).to.eq(0);
      expect(pool2Reward.toNumber()).to.eq(0);
      expect(pool3Reward.toNumber()).to.eq(500);
    });

    it("Transfers tokens back to the users", async () => {
      const balance = await this.tokenContract.balanceOf(this.bankContract.address);
      const user1Balance = await this.tokenContract.balanceOf(user1);
      const user2Balance = await this.tokenContract.balanceOf(user2);
      const user3Balance = await this.tokenContract.balanceOf(user3);

      expect(balance.toNumber()).to.eq(500); // 50% of reward pool left
      expect(user1Balance.toNumber()).to.eq(300);
      expect(user2Balance.toNumber()).to.eq(450);
      expect(user3Balance.toNumber()).to.eq(750);
    });
  });

  describe("Round 3", () => {
    beforeEach(async () => {
      time.increase(401);

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user3, gas: 500000});

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user2, gas: 500000});

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user1, gas: 500000});
    });

    it("Empties pool 1, 2 and 3", async () => {
      const pool1Reward = await this.bankContract.rewardPools(0);
      const pool2Reward = await this.bankContract.rewardPools(1);
      const pool3Reward = await this.bankContract.rewardPools(2);

      expect(pool1Reward.toNumber()).to.eq(0);
      expect(pool2Reward.toNumber()).to.eq(0);
      expect(pool3Reward.toNumber()).to.eq(0);
    });

    it("Transfers tokens back to the users", async () => {
      const balance = await this.tokenContract.balanceOf(this.bankContract.address);
      const user1Balance = await this.tokenContract.balanceOf(user1);
      const user2Balance = await this.tokenContract.balanceOf(user2);
      const user3Balance = await this.tokenContract.balanceOf(user3);

      expect(balance.toNumber()).to.eq(0); // 0% of reward pool left
      expect(user1Balance.toNumber()).to.eq(400);
      expect(user2Balance.toNumber()).to.eq(600);
      expect(user3Balance.toNumber()).to.eq(1000);
    });
  });
});
