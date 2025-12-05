import { ethers } from "ethers";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { to, amount, walletIndex } = body;

    if (!to || !amount) {
      return res.status(400).json({ error: "Missing 'to' or 'amount'" });
    }

    // ⭐ walletIndex 기본값 = 1
    const index = walletIndex || 1;

    // ⭐ PRIVATE_KEY0001, PRIVATE_KEY0002 ... 형태로 키 생성
    const keyName = `PRIVATE_KEY${String(index).padStart(4, "0")}`;

    const PRIVATE_KEY = process.env[keyName];

    if (!PRIVATE_KEY) {
      return res.status(400).json({
        error: `Environment variable ${keyName} not found`
      });
    }

    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
    const abi = ["function transfer(address to, uint256 amount) returns (bool)"];
    const contract = new ethers.Contract(TOKEN_ADDRESS, abi, wallet);

    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    const tx = await contract.transfer(to, amountWei);

    return res.status(200).json({
      status: "success",
      txHash: tx.hash,
      from: wallet.address,
      walletIndex: index,
      to,
      amount
    });

  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
}
