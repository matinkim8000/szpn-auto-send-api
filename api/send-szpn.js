// /api/send-szpn.js
import { ethers } from "ethers";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { to, amount } = req.body;

    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const RPC_URL = process.env.RPC_URL;
    const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // ⭐ 여기 추가
    console.log("FROM_ADDRESS:", wallet.address);

    const erc20Abi = [
      "function transfer(address to, uint256 amount) public returns (bool)"
    ];

    const contract = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, wallet);

    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);

    const tx = await contract.transfer(to, amountWei);

    return res.status(200).json({
      status: "success",
      from: wallet.address,   // ⭐ 응답에도 추가 (더 좋습니다)
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
