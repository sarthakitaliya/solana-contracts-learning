// this test is made using solana local validator
// to run the test, first run `solana-test-validator` in a separate terminal
// then run `bun test` in this directory
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { test, expect } from "bun:test";
import { COUNTER_SIZE, CounterAccount, schema } from "./types";
import * as borsh from "borsh";

let adminAccount = Keypair.generate();
let dataAccount = Keypair.generate();

const programId = new PublicKey("4Hp8SAcLmdpJALoJufYbzFmRAsSFAwdQxAthETE5dNeh");
const connection = new Connection("http://localhost:8899");

test("Account initialization", async () => {
  const tx = await connection.requestAirdrop(
    adminAccount.publicKey,
    1 * LAMPORTS_PER_SOL,
  );
  await connection.confirmTransaction(tx);

  const lamports =
    await connection.getMinimumBalanceForRentExemption(COUNTER_SIZE);
  const counterAccountCreate = SystemProgram.createAccount({
    fromPubkey: adminAccount.publicKey,
    newAccountPubkey: dataAccount.publicKey,
    lamports,
    space: COUNTER_SIZE,
    programId,
  });
  const tra = new Transaction();
  tra.add(counterAccountCreate);
  const signature = await connection.sendTransaction(tra, [
    adminAccount,
    dataAccount,
  ]);
  await connection.confirmTransaction(signature);
  console.log(dataAccount.publicKey.toBase58());

  const counterAccount = await connection.getAccountInfo(dataAccount.publicKey);
  if (!counterAccount) {
    throw new Error("Counter account not found");
  }

  const counter = borsh.deserialize(
    schema,
    counterAccount.data,
  ) as CounterAccount;
  console.log(counter);
  expect(counter.count).toBe(0);
});

test("Counter increase", async () => {
  const tx = new Transaction();
  tx.add(
    new TransactionInstruction({
      keys: [
        {
          pubkey: dataAccount.publicKey,
          isSigner: true,
          isWritable: true,
        },
      ],
      programId: programId,
      data: Buffer.from([0, 1, 0, 0, 0]),
    }),
  );

  const txHash = await connection.sendTransaction(tx, [
    adminAccount,
    dataAccount,
  ]);
  await connection.confirmTransaction(txHash);
  console.log(txHash);

  const counterAccount = await connection.getAccountInfo(dataAccount.publicKey);
  if (!counterAccount) {
    throw new Error("Counter account not found");
  }

  const counter = borsh.deserialize(
    schema,
    counterAccount.data,
  ) as CounterAccount;
  console.log(counter);
  expect(counter.count).toBe(1);
});
