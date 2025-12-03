// pages/api/transfer.js

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

    // 환경 변수 이름 예: PK_0x123456...
    const envKey = `PK_${senderId}`;
    const privateKey = process.env[envKey];

    if (!privateKey) {
      return res.status(400).json({
        error: `Private key not found in environment: ${envKey}`
      });
    }

    const rpcUrl = process.env.BSC_RPC_URL;
    if (!rpcUrl) {
      return res.status(500).json({ error: "Missing BSC_RPC_URL" });
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // BNB 송금 wei 변환
    const valueWei = ethers.utils.parseEther(String(amount));

    const tx = await wallet.sendTransaction({
      to,
      value: valueWei
    });

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
    console.error("Transfer Error:", err);
    return res.status(500).json({
      status: "ERROR",
      error: String(err)
    });
  }
};
