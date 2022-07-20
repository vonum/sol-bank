require('dotenv').config();

const BANK_CONTRACT_ADDRESS = process.env.BANK_CONTRACT_ADDRESS;
const TOKEN_CONTRACT_ADDRESS = process.env.TOKEN_CONTRACT_ADDRESS;

const API_URL = process.env.API_URL;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const USER_PRIVATE_KEY = process.env.USER_PRIVATE_KEY;
const USER_PUBLIC_KEY = process.env.USER_PUBLIC_KEY;

const TIMEFRAME = process.env.TIMEFRAME;

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(API_URL);
web3.eth.handleRevert = true

const bankAbi = require("../artifacts/contracts/Bank.sol/Bank.json");
const bankContract = new web3.eth.Contract(bankAbi.abi, BANK_CONTRACT_ADDRESS);

const tokenAbi = require("../artifacts/contracts/Token.sol/Token.json");
const tokenContract = new web3.eth.Contract(tokenAbi.abi, TOKEN_CONTRACT_ADDRESS);

const account = web3.eth.accounts.privateKeyToAccount('0x' + PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const userAccount = web3.eth.accounts.privateKeyToAccount('0x' + USER_PRIVATE_KEY);
web3.eth.accounts.wallet.add(userAccount);

console.log("Bank address:", BANK_CONTRACT_ADDRESS);
console.log("Token address:", TOKEN_CONTRACT_ADDRESS);
console.log("PKEY:", PRIVATE_KEY);
console.log("PUBKEY:", PUBLIC_KEY);
console.log("USER PKEY:", USER_PRIVATE_KEY);
console.log("USER PUBKEY:", USER_PUBLIC_KEY);

const totalSupply = async (contract) => {
  const message = await contract.methods.totalSupply().call();
  console.log(`Total supply is ${message}`);
}

const balanceOf = async (contract, address) => {
  const message = await contract.methods.balanceOf(address).call();
  console.log(address, message);
}

const distributeTokens = async (contract, from, addresses) => {
  for (address of addresses) {
    const message = await contract.methods.transfer(address, 3000)
                                          .send({from, gas: 5000000});
  }
}

const approve = async (contract, from, address, value) => {
  await contract.methods.approve(address, value).send({from, gas: 5000000});
}

const supplyReward = async (contract, from, value) => {
  await contract.methods.supplyReward(value).send({from, gas: 500000});
}

const deposit = async (contract, from, value) => {
  await contract.methods.deposit(value).send({from, gas: 500000});
}

const withdraw = async (contract, from) => {
  await contract.methods.withdraw().send({from, gas: 500000});
}

const rewardPool = async (contract) => {
  const message = await contract.methods.rewardPool().call();
  console.log("Reward pool:", message);
}

(async () => {
  // Supply reward for contract
  await approve(tokenContract, PUBLIC_KEY, BANK_CONTRACT_ADDRESS, 1000);
  await supplyReward(bankContract, PUBLIC_KEY, 1000);
  await rewardPool(bankContract);

  // Send tokens to users
  await distributeTokens(tokenContract, PUBLIC_KEY, [USER_PUBLIC_KEY]);

  // old balances
  await balanceOf(tokenContract, PUBLIC_KEY);
  await balanceOf(tokenContract, USER_PUBLIC_KEY);
  await balanceOf(tokenContract, BANK_CONTRACT_ADDRESS);

  // approve contract to transfer user's tokens
  await approve(tokenContract, PUBLIC_KEY, BANK_CONTRACT_ADDRESS, 4000);
  await approve(tokenContract, USER_PUBLIC_KEY, BANK_CONTRACT_ADDRESS, 1000);

  // deposit
  await deposit(bankContract, PUBLIC_KEY, 4000);
  await deposit(bankContract, USER_PUBLIC_KEY, 1000);

  // withdraw
  await new Promise(r => setTimeout(r, 2 * TIMEFRAME * 1000 + 1));
  await withdraw(bankContract, USER_PUBLIC_KEY);

  await new Promise(r => setTimeout(r, 3 * TIMEFRAME * 1000 + 1));
  await withdraw(bankContract, PUBLIC_KEY);

  await balanceOf(tokenContract, PUBLIC_KEY);
  await balanceOf(tokenContract, USER_PUBLIC_KEY);
  await balanceOf(tokenContract, BANK_CONTRACT_ADDRESS);
})();
