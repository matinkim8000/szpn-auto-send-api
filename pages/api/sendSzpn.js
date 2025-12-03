// pages/api/sendSzpn.js
import { ethers } from "ethers";

const TOKEN_ADDRESS = "0x83e137cf30dc28e5e6d28a63e841aa3bc6af1a99"; // SZPN

// env 키 규칙: PK_ + 주소(0x 제거, 대문자)
// 예) 주소: 0x21ed39... -> env: PK_21ED39...
function getEnvKeyFromAddress(senderId) {
  if (!senderId || typeof senderId !== "string") return null;
  const clean = senderId.replace(/^0x/i, "");
  return "PK_" + clean.toUpperCase();
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { senderId, to, amount } = req.body || {};

    if (!senderId || !to || !amount) {
      return res
        .status(400)
        .json({ error: "senderId, to, amount 모두 필요합니다." });
    }

    // 1) ENV 에서 private key 찾기
    const envKey = getEnvKeyFromAddress(senderId);
    const PRIVATE_KEY = process.env[envKey];

    if (!PRIVATE_KEY) {
      return res.status(400).json({
        error: `환경변수 ${envKey} 를 찾을 수 없습니다. (지갑 private key 미설정)`,
      });
    }

    // 2) BSC RPC 연결
    const rpcUrl = process.env.BSC_RPC_URL;
    if (!rpcUrl) {
      return res
        .status(500)
        .json({ error: "BSC_RPC_URL 환경변수가 설정되지 않았습니다." });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // 3) SZPN 토큰 컨트랙트 인스턴스
    const ABI = [
      "function transfer(address to, uint256 amount) public returns (bool)",
      "function decimals() public view returns (uint8)",
    ];

    const token = new ethers.Contract(TOKEN_ADDRESS, ABI, wallet);

    // 4) 소숫점 처리 (amount는 '0.06', '0.2', '90', '300' 같은 문자열로 온다고 가정)
    const decimals = await token.decimals();
    const sendAmount = ethers.parseUnits(amount.toString(), decimals);

    // 5) 실제 전송 실행
    const tx = await token.transfer(to, sendAmount);

    // 블록에 포함될 때까지 대기 (선택)
    const receipt = await tx.wait();

    return res.status(200).json({
      success: true,
      from: wallet.address,
      to,
      amount,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    console.error("Transfer Error:", err);
    // ethers v6 에러 메시지 정리
    const message =
      err?.reason ||
      err?.shortMessage ||
      err?.error?.message ||
      err?.toString() ||
      "Unknown error";

    return res.status(500).json({
      success: false,
      error: message,
    });
  }
}
