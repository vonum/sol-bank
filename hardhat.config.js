/** @type import('hardhat/config').HardhatUserConfig */
require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("hardhat-docgen");

const { RINKEBY_API_URL, GOERLI_API_URL, PRIVATE_KEY } = process.env;

module.exports = {
   solidity: "0.8.15",
   defaultNetwork: "rinkeby",
   networks: {
      hardhat: {},
      rinkeby: {
         url: RINKEBY_API_URL,
         accounts: [`0x${PRIVATE_KEY}`]
      },
      goerli: {
         url: GOERLI_API_URL,
         accounts: [`0x${PRIVATE_KEY}`]
      }
   },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: true,
  }
}
