// /api/send-szpn.js
import { ethers } from "ethers";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { to, amount } = req.body;

    if (!to || !amount) {
      return res.status(400).json({ error: "Missing 'to' or 'amount'" });
    }

    // Load env variables from Vercel
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const RPC_URL = process.env.RPC_URL;
    const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;

    if (!PRIVATE_KEY || !RPC_URL || !TOKEN_ADDRESS) {
      return res.status(500).json({ error: "Missing ENV variables" });
    }

    // Provider + Wallet
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const erc20Abi = [
      "function transfer(address to, uint256 amount) public returns (bool)"
    ];

    const contract = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, wallet);

    // Convert decimal amount → token decimals(=18)
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);

    const tx = await contract.transfer(to, amountWei);

    return res.status(200).json({
      status: "success",
      txHash: tx.hash,
      to,
      amount
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
}
