use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint,
    entrypoint::ProgramResult,
    instruction::{AccountMeta, Instruction},
    program::invoke,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let data_acc = next_account_info(&mut accounts_iter)?;
    let double_contract_address = next_account_info(&mut accounts_iter)?;

    let instruction = Instruction {
        program_id: *double_contract_address.key,
        accounts: vec![AccountMeta {
            is_signer: false,
            is_writable: true,
            pubkey: *data_acc.key,
        }],
        data: vec![],
    };
    invoke(&instruction, &[data_acc.clone(), double_contract_address.clone()])?;
    Ok(())
}
