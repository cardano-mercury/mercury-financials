<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{

    protected $fillable = [
        'wallet_id',
        'hash',
        'block',
        'block_height',
        'block_time',
        'slot',
        'index',
        'output_amount',
        'utxo_detail',
        'fees',
        'deposit',
        'size',
        'invalid_before',
        'invalid_hereafter',
        'utxo_count',
        'withdrawal_count',
        'withdrawals',
        'mir_cert_count',
        'delegation_count',
        'stake_cert_count',
        'pool_update_count',
        'pool_retire_count',
        'asset_mint_or_burn_count',
        'redeemer_count',
        'valid_contract'
    ];

    protected $with = ['tags'];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function outputs(): HasMany
    {
        return $this->hasMany(Output::class);
    }

    public function spends(): HasMany
    {
        return $this->outputs()->where('from_address_id', $this->wallet_id);
    }

    public function receives(): HasMany
    {
        return $this->outputs()->where('to_address_id', $this->wallet_id);
    }

    public function tags(): HasMany
    {
        return $this->hasMany(TransactionTag::class);
    }


}
