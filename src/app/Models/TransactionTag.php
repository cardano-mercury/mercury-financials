<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionTag extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'name',
        'transaction_id'
    ];

    protected $hidden = ['transaction_id'];
}
