const { expect } = require("chai");
const { accounts, contract } = require("@openzeppelin/test-environment");
const { BN, time } = require("@openzeppelin/test-helpers");

const Token = contract.fromArtifact("Token");
const Bank = contract.fromArtifact("Bank");

describe("Bank", () => {
  const [ owner, user1, user2 ] = accounts;
  const initialSupply = new BN("10000");
  const interval = new BN("100");
  const rewardPoolSize = new BN("1000");

  const depositSize1 = new BN("1000");
  const depositSize2 = new BN("4000");

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
  });

  it("Rewards appropriate amount of tokens to users", async () => {
      time.increase(201);

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user1, gas: 500000});

      time.increase(101);

      await this.bankContract.contract.methods
        .withdraw()
        .send({from: user2, gas: 500000});

      const pool3Reward = await this.bankContract.rewardPools(2);
      expect(pool3Reward.toNumber()).to.eq(500);

      const balance = await this.tokenContract.balanceOf(this.bankContract.address);
      const user1Balance = await this.tokenContract.balanceOf(user1);
      const user2Balance = await this.tokenContract.balanceOf(user2);

      expect(balance.toNumber()).to.eq(500);
      expect(user1Balance.toNumber()).to.eq(1040);
      expect(user2Balance.toNumber()).to.eq(4460);
  });
});
