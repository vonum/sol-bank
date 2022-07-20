require("dotenv").config();

const {TIMEFRAME} = process.env;

async function main() {
  const initialSupply = 100000000;
  const AtracAddress = "0x98d9A611Ad1b5761bdC1dAAc42c48E4d54CF5882";

  const tokenContractFactory = await ethers.getContractFactory("./contracts/Token.sol:Token");
  const tokenContract = await tokenContractFactory.deploy(initialSupply);
  await tokenContract.deployed();
  console.log("Token contract deployed to address:", tokenContract.address);

  const contractFactory = await ethers.getContractFactory("./contracts/Bank.sol:Bank");
  const contract = await contractFactory.deploy(TIMEFRAME, tokenContract.address);
  await contract.deployed();
  console.log("Bank contract deployed to address:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
