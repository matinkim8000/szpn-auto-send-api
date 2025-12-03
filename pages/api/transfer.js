// pages/api/transfer.js
import { ethers } from "ethers";

export default async function handler(req, res) {
  try {
    const { senderId, to, amount } = req.body;

    if (!senderId || !to || !amount) {
      return res.status(400).json({ error: "senderId, to, amount 필요" });
    }

    // 🔥 senderId = 0x지갑주소 → 대문자 변환
    const addr = senderId.toUpperCase();

    // 🔥 환경변수에서 Private Key 찾기 (옵션 A 방식)
    const ENV_KEY = `PK_${addr}`;
    const PRIVATE_KEY = process.env[ENV_KEY];

    if (!PRIVATE_KEY) {
      return res.status(400).json({
        error: `환경변수 ${ENV_KEY} 없음 → Private Key 없음`,
      });
    }

    // 🔥 RPC Provider
    const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);

    // 🔥 Wallet with PK
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // 🔥 Token Contract
    const TOKEN = "0x83e137cf30dc28e5e6d28a63e841aa3bc6af1a99";
    const ABI = [
      "function transfer(address to, uint256 amount) public returns (bool)",
      "function decimals() public view returns (uint8)",
    ];

    const token = new ethers.Contract(TOKEN, ABI, wallet);

    // 🔥 decimals 가져오기
    const decimals = await token.decimals();
    const sendAmount = ethers.parseUnits(amount.toString(), decimals);

    // 🔥 transfer 실행
    const tx = await token.transfer(to, sendAmount);
    await tx.wait();

    return res.status(200).json({
      success: true,
      from: wallet.address,
      to,
      amount,
      txHash: tx.hash,
    });
  } catch (err) {
    console.error("Transfer Error:", err);
    return res.status(500).json({
      success: false,
      error: err.toString(),
    });
  }
}
