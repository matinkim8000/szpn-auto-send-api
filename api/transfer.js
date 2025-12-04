// api/transfer.js

import { ethers } from "ethers";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { senderId, to, amount } = req.body || {};

    if (!senderId || !to || !amount) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // 환경변수 예: PK_0x21ed39...
    const envKey = `PK_${senderId}`;
    const privateKey = process.env[envKey];

    if (!privateKey) {
      return res.status(400).json({
        error: `Private key not found: ${envKey}`
      });
    }

    const rpcUrl = process.env.BSC_RPC_URL;
    if (!rpcUrl) {
      return res.status(500).json({ error: "Missing BSC_RPC_URL" });
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

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
}

