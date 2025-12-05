import { ethers } from "ethers";

export default async function handler(req, res) {
  try {
    const { senderId, to, amount } = req.body;

    if (!senderId || !to || !amount) {
      return res.status(400).json({ status: "error", message: "필드 누락: senderId, to, amount 필요" });
    }

    // 주소를 소문자로 정리해서 환경변수 키 매칭
    const pkKey = `PK_${senderId.toLowerCase()}`;
    const privateKey = process.env[pkKey];

    if (!privateKey) {
      return res.status(400).json({
        status: "error",
        message: `환경변수에서 ${pkKey} 를 찾을 수 없습니다.`
      });
    }

    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);

    const tokenAddress = process.env.TOKEN_ADDRESS;
    const tokenAbi = ["function transfer(address to, uint256 amount) public returns (bool)"];
    const token = new ethers.Contract(tokenAddress, tokenAbi, wallet);

    // ⭐ 가장 중요: pending 포함 nonce 조회
    const nonce = await provider.getTransactionCount(wallet.address, "pending");

    // 18 decimal 변환
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);

    // ⭐ gasLimit 고정 (가스 추정 실패 방지)
    const tx = await token.transfer(to, amountWei, {
      nonce,
      gasLimit: 150000
    });

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
