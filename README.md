# Token + USDT + Presale (Hardhat) + React dApp

One project. Contracts, deploy, tests and the website.

contracts/   StandardToken (your token), MockUSDT (free test USDT), StandardPresale
scripts/     deploy.js  (deploys all 3, sends sale tokens to presale, writes the addresses for you)
test/        automated tests
frontend/    React + Tailwind + shadcn/ui website (MetaMask)

## 0. One time setup
Install Node.js 18 or 20, then in this folder:
    npm run install:all

## 1. Run the tests
    npm test                (expect: all passing)
    npm run coverage        (optional, makes coverage/index.html)

## 2. Full test on your own laptop (free, no real network)
Open 3 terminals in this folder.
  Terminal 1:  npm run node          (keep it running; it prints 20 test wallets and private keys)
  Terminal 2:  npm run deploy:local  (deploys token, USDT, presale and writes frontend/.env)
  Terminal 3:  npm run dev           (open http://localhost:5173)

MetaMask: click Connect on the site, approve "add network" (Hardhat Local, chain 31337).
Then import a test wallet: MetaMask > Add account > Import > paste a private key printed by terminal 1.
- Account #0 = owner (sees the Owner panel). The first 5 accounts already have 10,000 test USDT.
- Use Account #1 to buy: enter USDT > Approve > Buy.
These keys are public test keys. Never send real money to them.

## 3. Deploy on Sepolia (public testnet)
1. Make a NEW test wallet in MetaMask. Get free Sepolia ETH from a faucet (search "Sepolia faucet").
2. Copy .env.example to .env and fill:
       PRIVATE_KEY=0x...your test wallet private key
       TREASURY=0x...wallet that should receive the USDT (optional, default = your wallet)
   (MetaMask > three dots > Account details > Show private key. Use a test wallet only.)
3. Deploy:
       npm run deploy:sepolia
   It prints the 3 addresses, saves them in deployments/sepolia.json and writes frontend/.env.
4. Start the site:  npm run dev   (MetaMask must be on Sepolia)
5. Give test USDT to a buyer wallet:
       npx hardhat mint-usdt --to 0xBUYER_ADDRESS --amount 1000 --network sepolia

## Where do addresses go?
- Root .env  : your settings BEFORE deploy (PRIVATE_KEY, TREASURY, TOKEN_NAME, TOKEN_SYMBOL, TOKEN_SUPPLY,
               PRICE_USDT, SALE_TOKENS, SALE_DAYS, USDT_ADDRESS).
- frontend/.env : written by deploy (VITE_CHAIN_ID and VITE_PRESALE_ADDRESS). Only the presale address
               is needed; the site reads token, USDT and treasury from the presale contract.
- deployments/<network>.json : all addresses after deploy.
To use an already deployed presale, just put its address in frontend/.env and set the chain id.

## Put the website online on Render (free static site)
frontend/.env contains only public addresses (no secrets), so it can be pushed to GitHub.
Your root .env (private key) is ignored by git. Check with "git status" that .env is NOT listed.
1. Push this whole folder to a GitHub repository.
2. Render.com > New > Static Site > connect the repo, then set:
       Root Directory:      frontend
       Build Command:       npm install && npm run build
       Publish Directory:   dist
   (or use New > Blueprint, it reads render.yaml)
3. Deploy. Open the Render link, connect MetaMask on Sepolia, click "Get 1,000 test USDT", then buy.
After you deploy new contracts (npm run deploy:sepolia), commit and push frontend/.env again:
Render rebuilds automatically. Environment variables are baked in at build time.

## Test USDT for users (testnet only)
The website shows "Get 1,000 test USDT" (it mints free test USDT to the connected wallet) and
"Add SALE / USDT to MetaMask" buttons. The faucet button appears only when VITE_ENABLE_FAUCET=true
(deploy sets it automatically when a test USDT is used). Never use this on mainnet.

## Check the treasury balance
Open the site > "Contracts and treasury" card > "Treasury USDT balance".

## Verify contracts on Etherscan (optional)
Set ETHERSCAN_API_KEY in .env, then:
    npx hardhat verify --network sepolia <TOKEN_ADDRESS> "Sale Token" SALE 1000000000 <DEPLOYER_ADDRESS>
    npx hardhat verify --network sepolia <USDT_ADDRESS>
    npx hardhat verify --network sepolia <PRESALE_ADDRESS> <TOKEN> <USDT> <TREASURY> <PRICE_WEI> <SALE_CAP_WEI> <START> <END> <OWNER>
(the exact values are in the deploy output / deployments file)

## Mainnet (real money) checklist
- Put the REAL USDT address in USDT_ADDRESS (BNB Chain: 0x55d398326f99059fF775485246999027B3197955).
- TREASURY and owner should be a multisig wallet (for example Safe).
- Get an independent audit and legal review first. This is not audited.

## Common problems
- "Cannot find module": run npm run install:all.
- MetaMask shows wrong network: switch to the network used in frontend/.env.
- Nonce errors on localhost after restarting the node: MetaMask > Settings > Advanced > Clear activity tab data.
- Buy button says "Sale is paused / ended": check the status badge on the site.
