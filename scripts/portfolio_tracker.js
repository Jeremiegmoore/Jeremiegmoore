const fs = require("fs");
const axios = require("axios");
const { ethers } = require("ethers");
require("dotenv").config();

const vault = process.env.VAULT_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.INFURA_RPC);

async function fetchPortfolio() {
  const ethBalance = await provider.getBalance(vault);
  const eth = ethers.formatEther(ethBalance);

  const tokens = await axios.get(`https://api.ethplorer.io/getAddressInfo/${vault}?apiKey=freekey`);
  const erc20 = tokens.data.tokens?.map(t => {
    return { symbol: t.tokenInfo.symbol, balance: t.balance * Math.pow(10, -t.tokenInfo.decimals) };
  }) || [];

  const nfts = await axios.get(`https://nftscan.com/api/v2/account/${vault}/nft`).catch((e) => { return { data: [] } });

  const portfolio = {
    timestamp: new Date().toISOString(),
    eth,
    erc20,
    nfts: nfts.data
  };

  fs.writeFileSync("portfolio.json", JSON.stringify(portfolio, null, 2));
  console.log("Portfolio updated.");
}

fetchPortfolio().catch(console.error);
