import { ethers } from "ethers";

/**
 * POST /api/sendSzpn
 * body 예:
 * {
 *   "senderId": "w1",          // w1 또는 w2
 *   "to": "0xb84f....c0ab",
 *   "amount": "0.2"            // 사람 기준 SZPN 수량
 * }
 */
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "POST only" });
    }

    // body 파싱
    const { senderId, to, amount } = req.body || {};

    if (!senderId || !to || !amount) {
      return res.status(400).json({ error: "senderId, to, amount 필요" });
    }

    // 어떤 지갑을 쓸지 senderId로 선택
    const senderMap = {
      w1: process.env.PRIVATE_KEY_W1, // 1차/3차 송금 지갑 (0x21ed...)
      w2: process.env.PRIVATE_KEY_W2  // 2차 송금 지갑 (0x07a7...)
    };

    const pk = senderMap[senderId];
    if (!pk) {
      return res.status(400).json({ error: "잘못된 senderId" });
    }

    const rpcUrl = process.env.BSC_RPC_URL;
    const tokenAddress = process.env.SZPN_TOKEN_ADDRESS;

    if (!rpcUrl || !tokenAddress) {
      return res.status(500).json({
        error: "환경변수 BSC_RPC_URL, SZPN_TOKEN_ADDRESS 설정 필요"
      });
    }

    // RPC + 월렛 세팅
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(pk, provider);

    // SZPN 토큰 컨트랙트
    const erc20Abi = [
      "function decimals() view returns (uint8)",
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address owner) view returns (uint256)"
    ];

    const token = new ethers.Contract(tokenAddress, erc20Abi, wallet);

    // amount(사람 단위)를 온체인 단위로 변환
    const decimals = await token.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    // (선택) 잔고 체크
    const balance = await token.balanceOf(wallet.address);
    if (balance < amountWei) {
      return res.status(400).json({
        error: "토큰 잔고 부족",
        balance: ethers.formatUnits(balance, decimals)
      });
    }

    // 실제 송금 실행
    const tx = await token.transfer(to, amountWei);
    const receipt = await tx.wait();

    return res.status(200).json({
      success: true,
      from: wallet.address,
      to,
      amount,
      txHash: receipt.transactionHash
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: e.toString() });
  }
}
