import { ethers } from "ethers";

export default async function handler(req, res) {
  try {
    const { senderId, to, amount } = req.body;

    if (!senderId || !to || !amount) {
      return res.status(400).json({ error: "senderId, to, amount 필요" });
    }

    // 🔥 PRIVATE KEY 찾기
    const PRIVATE_KEY = process.env[senderId];
    if (!PRIVATE_KEY) {
      return res.status(400).json({ error: "잘못된 senderId - private key 없음" });
    }

    // 🔥 RPC 연결 (BSC)
    const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);

    // 🔥 지갑 생성
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // 🔥 SZPN 토큰 컨트랙트
    const TOKEN_ADDRESS = "0x83e137cf30dc28e5e6d28a63e841aa3bc6af1a99";
    const ABI = [
      "function transfer(address to, uint256 amount) public returns (bool)",
      "function decimals() public view returns (uint8)"
    ];

    const token = new ethers.Contract(TOKEN_ADDRESS, ABI, wallet);

    // 🔥 DECIMALS 계산
    const decimals = await token.decimals();
    const realAmount = ethers.parseUnits(amount.toString(), decimals);

    // 🔥 단순 토큰 전송 실행
    const tx = await token.transfer(to, realAmount);
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
