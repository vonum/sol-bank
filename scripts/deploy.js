async function main() {
  const timeout = 10000;
  const AtracAddress = "0x98d9A611Ad1b5761bdC1dAAc42c48E4d54CF5882";

  const contractFactory = await ethers.getContractFactory("./contracts/Bank.sol:Bank");
  console.log(contractFactory);

  const contract = await contractFactory.deploy(timeout, AtracAddress);
  await contract.deployed();
  console.log("Contract deployed to address:", contract.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
