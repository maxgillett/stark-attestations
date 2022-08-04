import React from "react";
import { sha3Raw, stripHexPrefix, toHex, padLeft, toBN } from "web3-utils"
import { utils } from "ethers"
import * as BN from "bn.js";

export async function buildProofInput(
  provider: any,
  keyAddress: string,
  creatorAddress: string,
  token: string,
  blockNumber: number,
  storageSlot: string,
  tokenBalanceMin: string,
) {
  const number = "0x"+blockNumber.toString(16)
  console.log(number)
  const block = await provider?.send("eth_getBlockByNumber", [number, false]);
  console.log(block)

  // Prepare message attestation contents
  let pos = padLeft(stripHexPrefix(keyAddress.toLowerCase()), 64)
  pos += padLeft(stripHexPrefix(toHex(storageSlot)), 64)
  const storageKey = sha3Raw("0x"+pos)

  // Sign attestation message
  const message = stripHexPrefix(creatorAddress) + stripHexPrefix(block.stateRoot) + stripHexPrefix(storageKey);
  const paddedMessage = "000000000000000000000000000000" + message + "00000000";
  const eip191_message = "19457468657265756d205369676e6564204d6573736167653a0a313033" + paddedMessage;
  const rawSignature = await provider?.getSigner().signMessage(paddedMessage);
  const signature = utils.splitSignature(rawSignature);
  const r = signature.r;
  const s = signature.s;
  const v : 27|28 = signature.recoveryParam === 0 ? 27 : 28;


  // Request storage state proof
  const proof = await provider?.send("eth_getProof", [
    token, 
    [storageKey], 
    number]);
  const accountProof = proof.accountProof;
  const storageProof = proof.storageProof[0];

  const json = JSON.stringify({
    "accountProof": [accountProof],
    "address": token,
    "balance": 0,
    "codeHash": proof.codeHash,
    "nonce": 1,
    "storageHash": proof.storageHash,
    "storageProof": [storageProof],
    "blockNumber": blockNumber,
    "publicEthAddress": toBN(creatorAddress),
    "tokenBalanceMin": tokenBalanceMin,
    "stateRoot": block.stateRoot,
    "storageSlot": pos,
    "signature": {
      "message": eip191_message,
      "r": r,
      "s": s,
      "v": v,
    }
  });

  console.log(json);
  return json;
}
