// Jeremie.eth Recovery Suite
// Includes: Wallet Lineage Scan, Validator Rotation, Reward Claim, Asset Sweep, Portfolio Update

const fs = require("fs");
const axios = require("axios");
const { ethers, Wallet, Contract } = require("ethers");
const { spawnSync } = require("child_process");
require("dotenv").config();

const vault = process.env.VAULT_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.INFURA_RPC);
const recoveryLog = JSON.parse(fs.readFileSync("recovery_log.json"));
const erc20ABI = ["function transfer(address, uint256)", "function balanceOf(address) view returns (uint256)"];
const erc721ABI = ["function safeTransferFrom(address, address, uint256)"];

async function rotateValidator() {
  console.log("🔁 Rotating validator key...");
  spawnSync("lighthouse", ["account", "validator", "rotate", "--validator-dir", "/home/validator", "--new-key", "/home/validator/new_bls_key.json"]);
}

async function claimRewards() {
  const res = await axios.get(`https://beaconcha.in/api/v1/validator/${process.env.VALIDATOR_INDEX}/rewards`);
  fs.writeFileSync("rewards_log.json", JSON.stringify(res.data.data, null, 2));
}

async function sweepAssets() {
  for (const entry of recoveryLog) {
    const signer = new Wallet(entry.privateKey, provider);
    const eth = await provider.getBalance(entry.address);
    if (eth > ethers.parseEther("0.001")) {
      await signer.sendTransaction({ to: vault, value: eth - ethers.parseEther("0.0005") });
    }
    for (const token of entry.erc20) {
      const contract = new Contract(token.address, erc20ABI, signer);
      const bal = await contract.balanceOf(entry.address);
      if (bal > 0) await contract.transfer(vault, bal);
    }
    for (const nft of entry.nfts) {
      const contract = new Contract(nft.contract, erc721ABI, signer);
      await contract.safeTransferFrom(entry.address, vault, nft.tokenId);
    }
  }
}

async function updatePortfolio() {
  const eth = await provider.getBalance(vault);
  const tokens = await axios.get(`https://api.ethplorer.io/getAddressInfo/${vault}?apiKey=freekey`);
  const nfts = await axios.get(`https://nftscan.com/api/v2/account/${vault}/nft`).catch((e) => { return { data: [] } });
  fs.writeFileSync("portfolio.json", JSON.stringify({ eth: ethers.formatEther(eth), erc20: tokens.data.tokens, nfts: nfts.data }, null, 2));
}

rotateValidator();
claimRewards();
sweepAssets();
updatePortfolio();
