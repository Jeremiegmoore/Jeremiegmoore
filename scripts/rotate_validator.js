const { spawnSync } = require("child_process");

function rotateValidatorKey() {
  console.log("Rotating validator key...");
  const result = spawnSync("lighthouse", ["account", "validator", "rotate", "--validator-dir", "/home/validator", "--new-key", "/home/validator/new_bls_key.json"]);
  if (result.status === 0) { console.log("✅ Rotation successful.") } else { console.error("❌ Rotation failed.") }
}

rotateValidatorKey();
