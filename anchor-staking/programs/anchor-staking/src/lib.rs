use anchor_lang::prelude::*;

declare_id!("v5QioitXmehkHcc78ZnH2rZAmxYkYGNmkRbAxKHqq8G");

#[program]
pub mod anchor_staking {
    use anchor_lang::{system_program::{transfer, Transfer}};

    use super::*;

    pub fn create_pda_account(ctx: Context<Initialize>) -> Result<()> {
        let data_acc = &mut ctx.accounts.pda_account;
        let clock = Clock::get()?;

        data_acc.owner = ctx.accounts.user.key();
        data_acc.stacked_amount = 0;
        data_acc.total_points = 0;
        data_acc.last_update_time = clock.unix_timestamp;
        data_acc.bump =ctx.bumps.pda_account;
        
        Ok(())
    }

    pub fn stack(ctx: Context<Stack>, amount: u64) -> Result<()>{
        let data_acc = &mut ctx.accounts.pda_account;
        let clock = Clock::get()?;

        let cpi = CpiContext::new(ctx.accounts.system_program.to_account_info(), Transfer{
            from: ctx.accounts.user.to_account_info(),
            to: data_acc.to_account_info()
        });

        update_points(data_acc, clock.unix_timestamp)?;
        transfer(cpi, amount)?;

        data_acc.stacked_amount = data_acc.stacked_amount.checked_add(amount).ok_or(SError::MathOverflow)?;
        Ok(())
    }

    pub fn unstack(ctx: Context<Unstack>, amount: u64) -> Result<()>{
        require!(amount > 0, SError::InvalidAmount);
        let stacked_amount = ctx.accounts.pda_account.stacked_amount;
        let clock = Clock::get()?;
        let pda_acc = &mut ctx.accounts.pda_account;
        require!(stacked_amount > amount, SError::InsufficientStake);

        update_points(pda_acc, clock.unix_timestamp)?;

        let pda_info = pda_acc.to_account_info();
        let user_info = ctx.accounts.user.to_account_info();

        let mut pda_lamports = pda_info.try_borrow_mut_lamports()?;
        let mut user_lamports = user_info.try_borrow_mut_lamports()?;
        
        if **pda_lamports < amount {
            return  Err(SError::InsufficientStake.into());
        }

        **pda_lamports =  pda_lamports.checked_sub(amount).ok_or(SError::MathOverflow)?;
        **user_lamports = user_lamports.checked_add(amount).ok_or(SError::MathOverflow)?;

        pda_acc.stacked_amount = pda_acc.stacked_amount.checked_sub(amount).ok_or(SError::MathOverflow)?;

        Ok(())
    }

    pub fn claim_points(ctx: Context<ClaimPoint>) -> Result<()>{
        let data_acc =  &mut ctx.accounts.pda_account;
        let clock = Clock::get()?;

        update_points(data_acc, clock.unix_timestamp)?;

        msg!("User claimed points");

        data_acc.total_points = 0;

        Ok(())
    }

    pub fn get_points(ctx: Context<GetPoint>) -> Result<()>{
        let data_acc = &mut ctx.accounts.pda_account;
        let clock = Clock::get()?;

        update_points(data_acc, clock.unix_timestamp)?;

        Ok(())
    }
}

fn update_points(data_acc: &mut Account<StackAccount>, current_time: i64) -> Result<()> {
    let time_diff = current_time.checked_sub(data_acc.last_update_time).ok_or(SError::MathOverflow)?;
    if time_diff <= 0 {
        return Ok(());
    }
    let additional_points = data_acc.stacked_amount.checked_mul(time_diff as u64).ok_or(SError::MathOverflow)?;
    data_acc.total_points = data_acc.total_points.checked_add(additional_points).ok_or(SError::MathOverflow)?;
    data_acc.last_update_time = current_time;
    Ok(())
}
    

#[derive(Accounts)]
pub struct Initialize <'info>{

    #[account(mut)]
    pub user : Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"client1", user.key().as_ref()],
        bump, 
    )]
    pub pda_account: Account<'info, StackAccount>,
    
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Stack<'info>{
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut, 
        seeds = [b"client1", user.key().as_ref()],
        bump = pda_account.bump,
        constraint = pda_account.owner == user.key() @ SError::NotOwner
    )]   
    pub pda_account: Account<'info, StackAccount>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Unstack<'info>{
    #[account (mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"client1", user.key().as_ref()],
        bump = pda_account.bump,
        constraint = pda_account.owner == user.key() @SError::NotOwner
    )]
    pub pda_account: Account<'info, StackAccount>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct ClaimPoint<'info>{
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"client1", user.key().as_ref()],
        bump = pda_account.bump,
        constraint = pda_account.owner == user.key() @SError::NotOwner
    )]
    pub  pda_account: Account<'info, StackAccount>
}

#[derive(Accounts)]
pub struct  GetPoint<'info>{
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut, 
        seeds = [b"client1", user.key().as_ref()],
        bump = pda_account.bump,
        constraint = pda_account.owner == user.key() @SError::NotOwner
    )]
    pub pda_account: Account<'info, StackAccount>
}

#[account]
pub struct StackAccount{
    pub owner: Pubkey,
    pub stacked_amount: u64,
    pub total_points: u64,
    pub last_update_time: i64,
    pub bump: u8
}

#[error_code]
pub enum SError {
    #[msg("You are not the owner of this account")]
    NotOwner,
    #[msg("Math operation overflowed")]
    MathOverflow,
    #[msg("Insufficient staked amount")]
    InsufficientStake,
    #[msg("Amount must be greater than 0")]
    InvalidAmount,

}