use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint,
    entrypoint::ProgramResult,
    program::invoke_signed,
    pubkey::Pubkey,
    system_instruction::create_account,
};

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let pda = next_account_info(accounts_iter)?;
    let user_acc = next_account_info(accounts_iter)?;
    let _system_program = next_account_info(accounts_iter)?;

    let (_pda_public_key, bump) = Pubkey::find_program_address(&[user_acc.key.as_ref(), b"user"], program_id);
    let ix = create_account(user_acc.key, pda.key, 1000000000, 8, program_id);

    invoke_signed(&ix, accounts, &[&[user_acc.key.as_ref(), b"user", &[bump]]])?;
    Ok(())
}
