import { ethers } from "ethers";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ status: "error", message: "Only POST allowed" });
    }

    // body 파싱 (GAS에서 보낼 때 string일 수도 있어서 처리)
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { to, amount } = body || {};

    // ✅ 이제 senderId는 필요 없습니다. to, amount만 체크
    if (!to || !amount) {
      return res.status(400).json({
        status: "error",
        message: "필드 누락: to, amount 필요"
      });
    }

    // 🔐 엔진 지갑 Private Key (PRIVATE_KEY0001 또는 PRIVATE_KEY 둘 중 하나 사용)
    const PRIVATE_KEY =
      process.env.PRIVATE_KEY0001 || process.env.PRIVATE_KEY;

    if (!PRIVATE_KEY) {
      return res.status(500).json({
        status: "error",
        message: "환경변수 PRIVATE_KEY0001 (또는 PRIVATE_KEY)가 설정되어 있지 않습니다."
      });
    }

    const RPC_URL = process.env.RPC_URL;
    const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;

    if (!RPC_URL || !TOKEN_ADDRESS) {
      return res.status(500).json({
        status: "error",
        message: "RPC_URL 또는 TOKEN_ADDRESS 환경변수가 설정되어 있지 않습니다."
      });
    }

    // Provider & Wallet 생성
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // SZPN 토큰 컨트랙트
    const abi = ["function transfer(address to, uint256 amount) returns (bool)"];
    const contract = new ethers.Contract(TOKEN_ADDRESS, abi, wallet);

    // amount → 18 decimal 변환
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);

    // ⭐ 중요: pending 포함 nonce 조회 (nonce 꼬임 방지)
    const nonce = await provider.getTransactionCount(wallet.address, "pending");

    // ⭐ 중요: gasLimit 명시 (가스 추정 실패 방지)
    const tx = await contract.transfer(to, amountWei, {
      nonce,
      gasLimit: 150000
    });

    // 블록 확정까지 대기
    const receipt = await tx.wait();

    return res.status(200).json({
      status: "success",
      txHash: receipt.transactionHash,
      from: wallet.address,
      to,
      amount
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.toString()
    });
  }
}
