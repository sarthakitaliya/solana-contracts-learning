import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorStaking } from "../target/types/anchor_staking";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert } from "chai";

async function derivePdaAccount(pubkey: PublicKey) {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("client1"), pubkey.toBuffer()],
    anchor.workspace.anchorStaking.programId
  );
  return { pda, bump };
}

describe("anchor-staking", () => {
  const user = anchor.web3.Keypair.generate();
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.anchorStaking as Program<AnchorStaking>;

  it("Airdrop to test user", async () => {
    const tx = await program.provider.connection.requestAirdrop(
      user.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await program.provider.connection.confirmTransaction(tx);

    const balance = await program.provider.connection.getBalance(
      user.publicKey
    );

    assert.equal(balance, 2 * anchor.web3.LAMPORTS_PER_SOL);
  });

  it("Initialize PDA account", async () => {
    const { pda, bump } = await derivePdaAccount(user.publicKey);
    const tx = await program.methods
      .createPdaAccount()
      .accounts({
        user: user.publicKey,
        pdaAccount: pda,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([user])
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Stake 1 SOL", async () => {
    const { pda, bump } = await derivePdaAccount(user.publicKey);
    const tx = await program.methods
      .stack(new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL))
      .accounts({
        user: user.publicKey,
        pdaAccount: pda,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([user])
      .rpc();
    console.log("Your transaction signature", tx);

    const account = await program.account.stackAccount.fetch(pda);
    console.log(
      "Stacked Amount",
      account.stackedAmount.toNumber() / LAMPORTS_PER_SOL
    );

    assert.equal(account.stackedAmount.toNumber() / LAMPORTS_PER_SOL, 1);
  });

  it("check points after 10 seconds", async () => {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const { pda, bump } = await derivePdaAccount(user.publicKey);
    const tx = await program.methods
      .getPoints()
      .accounts({
        user: user.publicKey,
        pdaAccount: pda,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([user])
      .rpc();
    const account = await program.account.stackAccount.fetch(pda);
    console.log("Points", account.totalPoints.toNumber() / LAMPORTS_PER_SOL);

    assert.equal(account.totalPoints.toNumber() / LAMPORTS_PER_SOL, 10);
  });

  it("Unstake 0.5 SOL", async () => {
    const { pda, bump } = await derivePdaAccount(user.publicKey);
    const beforeBalance = await program.account.stackAccount.fetch(pda);
    const stacked = beforeBalance.stackedAmount.toNumber();
    console.log("Stacked before unstake", stacked / LAMPORTS_PER_SOL);
    const tx = await program.methods
      .unstack(new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL))
      .accounts({
        user: user.publicKey,
        pdaAccount: pda,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([user])
      .rpc();
    console.log("Your transaction signature", tx);

    const account = await program.account.stackAccount.fetch(pda);
    console.log("Stacked Amount", account.stackedAmount.toNumber() / LAMPORTS_PER_SOL);

    assert.equal(
      account.stackedAmount.toNumber() / LAMPORTS_PER_SOL,
      0.5
    );
  });

  it("get points", async () => {
    const { pda, bump } = await derivePdaAccount(user.publicKey);
    const tx = await program.methods
      .claimPoints()
      .accounts({
        user: user.publicKey,
        pdaAccount: pda,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([user])
      .rpc();
    const account = await program.account.stackAccount.fetch(pda);
    console.log("Points", account.totalPoints.toNumber() / LAMPORTS_PER_SOL);

    assert.equal(account.totalPoints.toNumber(), 0);
  });
});
