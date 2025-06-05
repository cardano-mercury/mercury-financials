<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Output extends Model
{
    protected $fillable = [
        'hash',
        'index',
        'unit',
        'quantity',
        'transaction_id',
        'to_address_id',
        'from_address_id'
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function toAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'to_address_id');
    }

    public function fromAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'from_address_id');
    }
}
