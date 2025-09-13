const fs = require("fs");
const axios = require("axios");
const { ethers } = require("ethers");

const vault = "0x417745b6a657f8520d91eabf2f121479b04a04ce";
const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/6c06cc61db8248b598a1484817ffadb6");

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
