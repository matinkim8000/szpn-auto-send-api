import { ethers } from "ethers";

export default async function handler(req, res) {
  try {
    const { senderId, to, amount } = req.body;

    if (!senderId || !to || !amount) {
      return res.status(400).json({ error: "senderId, to, amount 필요" });
    }

    // 🔥 senderId에서 환경 변수 키 추출
    const prefix = senderId.slice(2, 6).toUpperCase();  // 예: 21ED
    const envKey = `PK_${prefix}`;                      // 예: PK_21ED
    const PRIVATE_KEY = process.env[envKey];

    if (!PRIVATE_KEY) {
      return res.status(400).json({ 
        error: `private key 없음 (${envKey} 환경변수 없음)` 
      });
    }

    // 🔥 RPC 연결
    const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);

    // 🔥 지갑 생성
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // 🔥 토큰 컨트랙트 설정
    const TOKEN_ADDRESS = "0x83e137cf30dc28e5e6d28a63e841aa3bc6af1a99";
    const ABI = [
      "function transfer(address to, uint256 amount) public returns (bool)",
      "function decimals() public view returns (uint8)"
    ];

    const token = new ethers.Contract(TOKEN_ADDRESS, ABI, wallet);

    const decimals = await token.decimals();
    const realAmount = ethers.parseUnits(amount.toString(), decimals);

    // 🔥 전송
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
