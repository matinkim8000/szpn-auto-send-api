// pages/api/transfer.js
import { ethers } from "ethers";

export default async function handler(req, res) {
  try {
    // POST body에서 값 받기
    const { senderId, to, amount } = req.body || {};

    if (!senderId || !to || !amount) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // 환경 변수 이름: PK_0x지갑주소 (대문자)
    const envKey = `PK_${senderId}`;
    const privateKey = process.env[envKey];

    if (!privateKey) {
      return res.status(400).json({
        error: `Private key not found in environment: ${envKey}`
      });
    }

    // BSC RPC 연결
    const rpcUrl = process.env.BSC_RPC_URL;
    if (!rpcUrl) {
      return res.status(500).json({ error: "BSC_RPC_URL is not set" });
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // amount(BNB)를 Wei로 변환
    const valueWei = ethers.utils.parseEther(String(amount));

    // 단순 BNB 전송 트랜잭션
    const tx = await wallet.sendTransaction({
      to,
      value: valueWei
      // gasPrice / gasLimit는 네트워크가 자동 계산하게 둬도 됨
    });

    // 트랜잭션이 블록에 포함될 때까지 기다림 (선택 사항)
    const receipt = await tx.wait();

    return res.status(200).json({
      status: "OK",
      from: wallet.address,
      to,
      amount,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

  } catch (err) {
    console.error("Transfer Error:", err);
    return res.status(500).json({
      status: "ERROR",
      error: String(err)
    });
  }
}
