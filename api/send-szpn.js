import { ethers } from "ethers";

export default async function handler(req, res) {
  try {
    const { senderId, to, amount } = req.body;

    const privateKey = process.env[`PK_${senderId.toLowerCase()}`];
    if (!privateKey) {
      return res.status(400).json({
        status: "error",
        message: "해당 senderId에 대한 PRIVATE_KEY가 설정되어 있지 않습니다."
      });
    }

    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);

    const token = process.env.TOKEN_ADDRESS;
    const tokenAbi = [
      "function transfer(address to, uint256 amount) public returns (bool)"
    ];
    const tokenContract = new ethers.Contract(token, tokenAbi, wallet);

    // ⭐ 가장 중요 — pending 기준 nonce 확인
    const nonce = await provider.getTransactionCount(wallet.address, "pending");

    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);

    // ⭐ gasLimit을 고정 -> gas estimation 스킵됨
    const tx = await tokenContract.transfer(to, amountWei, {
      nonce: nonce,
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
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: e.toString()
    });
  }
}
