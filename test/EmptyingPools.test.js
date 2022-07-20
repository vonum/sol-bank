const { expect } = require("chai");
const { accounts, contract } = require("@openzeppelin/test-environment");
const { BN, expectEvent, expectRevert, time } = require("@openzeppelin/test-helpers");

const Token = contract.fromArtifact("Token");
const Bank = contract.fromArtifact("Bank");

describe("Bank", () => {
  const [ owner, user1 ] = accounts;
  const initialSupply = new BN("10000");
  const interval = new BN("100");
  const rewardPoolSize = new BN("1000");

  const depositSize1 = new BN("200");

  beforeEach(async () => {
    this.tokenContract = await Token.new(initialSupply, {from: owner});
    this.bankContract = await Bank.new(100, this.tokenContract.address, {from: owner});

    // Transfer tokens to users
    await this.tokenContract.contract.methods
      .transfer(user1, depositSize1)
      .send({from: owner, gas: 500000});

    // Approve contract to deposit tokens from users
    await this.tokenContract.contract.methods
      .approve(this.bankContract.address, rewardPoolSize)
      .send({from: owner, gas: 500000});

    await this.tokenContract.contract.methods
      .approve(this.bankContract.address, depositSize1)
      .send({from: user1, gas: 500000});

    // Supply reward
    await this.bankContract.contract.methods
      .supplyReward(rewardPoolSize)
      .send({from: owner, gas: 500000});

    // Deposit
    await this.bankContract.contract.methods
      .deposit(depositSize1)
      .send({from: user1, gas: 500000});
  });

  describe("Pools not empty", () => {
    it("Can't empty pools if users have deposited tokens", async () => {
      time.increase(401);

      await expectRevert(
        this.bankContract.contract.methods
          .emptyPools()
          .send({from: owner, gas: 500000}),
        "Deposits not empty",
      );
    });
  });

  describe("Round 3 not started", () => {
    it("Can't empty pools until round 3 starts", async () => {
      time.increase(201);

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user1, gas: 500000});

      time.increase(101);

      await expectRevert(
        this.bankContract.contract.methods
          .emptyPools()
          .send({from: owner, gas: 500000}),
        "Round 3 not yet started",
      );
    });
  });

  describe("Emptying pools", () => {
    beforeEach(async () => {
      time.increase(201);
      const ownerBalanceOld = await this.tokenContract.balanceOf(owner);

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user1, gas: 500000});

      time.increase(201);
    });

    it("Empties tokens left in reward pools", async () => {
      await this.bankContract.contract.methods
        .emptyPools()
        .send({from: owner, gas: 500000})

      const pool1 = await this.bankContract.rewardPools(0);
      const pool2 = await this.bankContract.rewardPools(1);
      const pool3 = await this.bankContract.rewardPools(2);
      const rewardPool = await this.bankContract.rewardPool();

      expect(pool1.toNumber()).to.eq(0);
      expect(pool2.toNumber()).to.eq(0);
      expect(pool3.toNumber()).to.eq(0);
      expect(rewardPool.toNumber()).to.eq(0);

      const contractBalance = await this.tokenContract.balanceOf(this.bankContract.address);
      const ownerBalance = await this.tokenContract.balanceOf(owner);

      expect(contractBalance.toNumber()).to.eq(0);
      // initial size - tokens transfered to user1 (200) - user1 reward (round 1 200)
      expect(ownerBalance.toNumber()).to.eq(9600);
    });

    it("Emits event when emptying pools", async () => {
      tx = await this.bankContract.contract.methods
        .emptyPools()
        .send({from: owner, gas: 500000})

      expectEvent(
        tx,
        "PoolsEmptied",
        {value: "800"}
      );
    });
  });
});
