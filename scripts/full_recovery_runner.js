const { ethers, Wallet, Contract } = require("ethers");
const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

const vault = process.env.VAULT_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.INFURA_RPC);
const recoveryLog = JSON.parse(fs.readFileSync("recovery_ledger.json"));
const erc20ABI = ["function transfer(address, uint256)", "function balanceOf(address) view returns (uint256)"];
const erc721ABI = ["function safeTransferFrom(address, address, uint256)"];

async function runRecovery() {
  for (const entry of recoveryLog) {
    if (entry.status === "swept") continue;
    try {
        const signer = new Wallet(process.env[entry.envKey], provider);
        const eth = await provider.getBalance(entry.address);
        if (eth > ethers.parseEther("0.001")) {
          await signer.sendTransaction({ to: vault, value: eth - ethers.parseEther("0.0005") });
        }

        for (const token of entry.erc20 || []) {
          const contract = new Contract(token.contract, erc20ABI, signer);
          const bal = await contract.balanceOf(entry.address);
          if (bal > 0) await contract.transfer(vault, bal);
        }

        for (const nft of entry.nfts || []) {
          const contract = new Contract(nft.contract, erc721ABI, signer);
          await contract.safeTransferFrom(entry.address, vault, nft.tokenId);
        }

        entry.status = "swept";
    } catch (err) {
        entry.status = "error";
        entry.error = err.message;
    }
  }
  fs.writeFileSync("recovery_ledger.json", JSON.stringify(recoveryLog, null, 2));
}

runRecovery().catch(console.error);
