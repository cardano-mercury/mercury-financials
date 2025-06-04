<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Address extends Model
{

    protected $fillable = [
        'user_id',
        'bech32',
        'stake_key'
    ];

    public function addressable(): MorphTo
    {
        return $this->morphTo();
    }

}
