// import { test, expect } from "bun:test";
// import { LiteSVM } from "litesvm";
// import {
//   PublicKey,
//   Transaction,
//   SystemProgram,
//   Keypair,
//   LAMPORTS_PER_SOL,
//   TransactionInstruction,
// } from "@solana/web3.js";
// import * as borsh from "borsh";
// import { CounterAcc, schema } from "./types";

// test("one transfer", () => {
//   const svm = new LiteSVM();
//   const contractPubkey = PublicKey.unique();
//   svm.addProgramFromFile(contractPubkey, "./DoubleCounter.so");
//   const payer = new Keypair();
//   svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));
//   const dataAccount = new Keypair();
//   const blockhash = svm.latestBlockhash();
//   const ixs = [
//     SystemProgram.createAccount({
//       fromPubkey: payer.publicKey,
//       newAccountPubkey: dataAccount.publicKey,
//       lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
//       space: 4,
//       programId: contractPubkey,
//     }),
//   ];
//   const tx = new Transaction();
//   tx.recentBlockhash = blockhash;
//   tx.feePayer = payer.publicKey;
//   tx.add(...ixs);
//   tx.sign(payer, dataAccount);
//   svm.sendTransaction(tx);
//   const balanceAfter = svm.getBalance(dataAccount.publicKey);
//   expect(balanceAfter).toBe(svm.minimumBalanceForRentExemption(BigInt(4)));

//   const ix2 = new TransactionInstruction({
//     keys: [
//       { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
//     ],
//     programId: contractPubkey,
//     data: Buffer.from(""),
//   });

//   const tx2 = new Transaction();
//   tx2.recentBlockhash = blockhash;
//   tx2.feePayer = payer.publicKey;
//   tx2.add(ix2);
//   tx2.sign(payer);
//   svm.sendTransaction(tx2);
//   const newDataAcc = svm.getAccount(dataAccount.publicKey);
//   if (!newDataAcc) throw new Error("Account not found");

//   const counter = borsh.deserialize(schema, newDataAcc?.data) as CounterAcc;
  
//   expect(counter.count).toBe(1);
// });
