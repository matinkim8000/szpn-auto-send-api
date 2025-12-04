import { ethers } from "ethers";

// ====== SZPN Token Contract ======
const SZPN_ADDRESS = "0x83e137cf30dc28e5e6d28a63e841aa3bc6af1a99";

// ====== 기본 ERC20 ABI (transfer, decimals만 필요) ======
const ERC20_ABI = [
  "function transfer(address to, uint256 value) external returns (bool)",
  "function decimals() view returns (uint8)"
];

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { senderId, to, amount } = req.body || {};

    if (!senderId || !to || !amount) {
      return res.status(400).json({ error: "Missing parameters" });
    }

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

    // ====== ERC20 Contract 생성 ======
    const token = new ethers.Contract(SZPN_ADDRESS, ERC20_ABI, wallet);

    // ====== decimals 확인 ======
    const decimals = await token.decimals();
    const amountWei = ethers.utils.parseUnits(String(amount), decimals);

    // ====== SZPN 전송 ======
    const tx = await token.transfer(to, amountWei);
    const receipt = await tx.wait();

    return res.status(200).json({
      status: "OK",
      token: "SZPN",
      from: wallet.address,
      to,
      amount,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

  } catch (err) {
    console.error("SZPN Transfer Error:", err);
    return res.status(500).json({
      status: "ERROR",
      error: String(err)
    });
  }
}
