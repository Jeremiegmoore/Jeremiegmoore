const fs = require("fs");
const { create, add } = require("ipfs-http-client");
const { ethers, Wallet, Contract } = require("ethers");
require("dotenv").config();

const vault = process.env.VAULT_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.INFURA_RPC);
const signer = new Wallet(process.env.VAULT_KEY, provider);
const ensName = process.env.ENS_NAME;
const ipfs = create({ url: "https://ipfs.infura.io/api/v0" });

async function syncLoreToENS() {
  const files = ["recovery_ledger.json", "sweep_log.json", "portfolio.json", "contracts.json", "lore_registry.md"];
  const records = {};
  for (const file of files) {
    const data = fs.readFileSync(file);
    const cid = await ipfs.add({ path: file, content: data });
    records["ipfs:" + file.replace(".json", "").replace(".md", "")] = "ipfs://" + cid.cid.toString();
  }

  const ens = new Contract("0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e", ["function setText(string name, string key, string value)"], signer);
  for (const [key, value] of Object.entries(records)) {
    await ens.setText(ensName, key, value);
  }
  console.log("Lore anchored to ENS: ", records);
}

syncLoreToENS().catch(console.error);
