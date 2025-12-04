// api/send-szpn.js
const { ethers } = require("ethers");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { senderId, to, amount } = req.body || {};

    if (!senderId || !to || !amount) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // Private key 불러오기
    const envKey = `PK_${senderId}`;
    const privateKey = process.env[envKey];
    if (!privateKey) {
      return res.status(400).json({ error: `Private key not found: ${envKey}` });
    }

    const rpcUrl = process.env.BSC_RPC_URL;
    if (!rpcUrl) {
      return res.status(500).json({ error: "Missing BSC_RPC_URL" });
    }

    const SZPN = process.env.SZPN_TOKEN; // 0x83e137cf...

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // SZPN Contract ABI
    const abi = ["function transfer(address to, uint256 amount) external returns (bool)"];
    const contract = new ethers.Contract(SZPN, abi, wallet);

    // amount → token amount 18 decimals
    const value = ethers.utils.parseUnits(String(amount), 18);

    // transfer 실행
    const tx = await contract.transfer(to, value);
    const receipt = await tx.wait();

    return res.status(200).json({
      status: "OK",
      from: wallet.address,
      to,
      amount,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

  } catch (err) {
    return res.status(500).json({
      status: "ERROR",
      error: String(err)
    });
  }
};

