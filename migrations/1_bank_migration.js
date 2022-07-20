require("dotenv").config();

const {TIMEFRAME} = process.env;

const Token = artifacts.require("Token");
const Bank = artifacts.require("Bank");

const initialSupply = 100000000;

const deployContracts = async (deployer, tokenContract, bankContract, initialSupply, timeframe) => {
  await deployer.deploy(Token, initialSupply);
  await Token.deployed();
  console.log("Token contract deployed to address:", Token.address);

  await deployer.deploy(Bank, TIMEFRAME, Token.address);
  await Bank.deployed();
  console.log("Bank contract deployed to address:", Bank.address);
};

module.exports = function(deployer, network, accounts) {
  deployContracts(deployer, Token, Bank, initialSupply, TIMEFRAME);
  /*
  await deployer.deploy(Token, initialSupply);
  await Token.deployed();
  console.log("Token contract deployed to address:", Token.address);

  await deployer.deploy(Bank, TIMEFRAME, Token.address);
  await Bank.deployed();
  console.log("Bank contract deployed to address:", Bank.address);
  */
};
