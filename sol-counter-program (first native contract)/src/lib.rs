use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

#[derive(BorshDeserialize, BorshSerialize)]
enum Instruction {
    Increment(u32),
    Decrement(u32),
}

#[derive(BorshDeserialize, BorshSerialize)]
struct Counter {
    count: u32,
}

entrypoint!(counter_contract);

pub fn counter_contract(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let acc = next_account_info(&mut accounts.iter()).unwrap();
    let mut counter = Counter::try_from_slice(&acc.data.borrow())?;
    let instruction = Instruction::try_from_slice(instruction_data)?;

    match instruction {
        Instruction::Increment(val) => {
            counter.count += val;
        }
        Instruction::Decrement(val) => {
            counter.count -= val;
        }
    }

    counter.serialize(&mut *acc.data.borrow_mut())?;

    Ok(())
}
