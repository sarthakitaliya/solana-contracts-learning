import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { test, expect } from "bun:test";
import { LiteSVM } from "litesvm";
import { schema, type CounterAcc } from "./types";
import * as borsh from "borsh";


test("CPI works", async () => {
    const svm = new LiteSVM();
    const doubleContract = PublicKey.unique();
    const cpiContract = PublicKey.unique();

    svm.addProgramFromFile(doubleContract, "./DoubleCounter.so");
    svm.addProgramFromFile(cpiContract, "./cpi.so");

    const userAcc = new Keypair();
    svm.airdrop(userAcc.publicKey, BigInt(LAMPORTS_PER_SOL));

    const dataAcc = new Keypair();
    const blockhash = svm.latestBlockhash();
    const ix1 = [
        SystemProgram.createAccount({
            fromPubkey: userAcc.publicKey,
            newAccountPubkey: dataAcc.publicKey,
            lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
            space: 4,
            programId: doubleContract,
        }),
    ];  
    // console.log("Creating data account", ix1);
    
    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.feePayer = userAcc.publicKey;
    tx.add(...ix1);
    tx.sign(userAcc, dataAcc);
    console.log("Sending transaction to create data account");
    
    try {
        svm.sendTransaction(tx);
    } catch (error) {
        console.error("Error sending transaction:", error);
    }

    const ix = new TransactionInstruction({
        keys:[
            { pubkey: dataAcc.publicKey, isSigner: false, isWritable: true },
            { pubkey: doubleContract, isSigner: false, isWritable: false },
        ],
        programId: cpiContract,
        data: Buffer.from(""),
    })
    const tx2 = new Transaction();
    tx2.recentBlockhash = svm.latestBlockhash();
    tx2.feePayer = userAcc.publicKey;
    tx2.add(ix);
    tx2.sign(userAcc);
    svm.sendTransaction(tx2);

    const newDataAcc = svm.getAccount(dataAcc.publicKey);
    if (!newDataAcc) throw new Error("Account not found");
    
    const counter = borsh.deserialize(schema, newDataAcc?.data) as CounterAcc;
    expect(counter.count).toBe(1);
});