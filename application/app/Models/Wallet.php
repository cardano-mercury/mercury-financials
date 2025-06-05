<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Wallet extends Model
{

    protected $fillable = ['name'];
    protected $with = ['address'];

    protected $casts = [
        'updated_at' => 'datetime:c'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function address(): MorphOne
    {
        return $this->morphOne(Address::class, 'addressable');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class)->orderBy('block_time', 'desc');
    }
}
