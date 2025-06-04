<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained('wallets');
            $table->string('hash');
            $table->string('block');
            $table->unsignedBigInteger('block_height');
            $table->unsignedBigInteger('block_time');
            $table->unsignedBigInteger('slot');
            $table->unsignedInteger('index');
            $table->json('output_amount');
            $table->json('utxo_detail');
            $table->unsignedBigInteger('fees');
            $table->unsignedBigInteger('deposit');
            $table->unsignedInteger('size');
            $table->unsignedBigInteger('invalid_before')->nullable();
            $table->unsignedBigInteger('invalid_hereafter')->nullable();
            $table->unsignedInteger('utxo_count');
            $table->unsignedInteger('withdrawal_count');
            $table->json('withdrawals');
            $table->unsignedInteger('mir_cert_count');
            $table->unsignedInteger('delegation_count');
            $table->unsignedInteger('stake_cert_count');
            $table->unsignedInteger('pool_update_count');
            $table->unsignedInteger('pool_retire_count');
            $table->unsignedInteger('asset_mint_or_burn_count');
            $table->unsignedInteger('redeemer_count');
            $table->boolean('valid_contract');
            $table->timestamps();
            $table->unique(['wallet_id', 'hash']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
