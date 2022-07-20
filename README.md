# sol-bank
## Setup
`yarn`

## Compiling contract
### Hardhat
`npx hardhat compile`

### Truffle
`truffle compile`

## Testing contract
`npm test`

## Deploying contract
### Hardhat
`npx hardhat run scripts/deploy.js --network rinkeby`

### Truffle
`truffle migrate --network rinkeby`

## Generate docs
1. `npx hardhat docgen`
2. Open `docs/index.html`
