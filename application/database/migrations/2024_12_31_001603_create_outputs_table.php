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
        Schema::create('outputs', function (Blueprint $table) {
            $table->id();
            $table->string('hash', 64);
            $table->unsignedInteger('index')->nullable();
            $table->string('unit', 128);
            $table->unsignedBigInteger('quantity');
            $table->foreignId('transaction_id')->constrained('transactions');
            $table->foreignId('to_address_id')->nullable()->constrained('addresses');
            $table->foreignId('from_address_id')->nullable()->constrained('addresses');
            $table->timestamps();
            $table->unique(['transaction_id', 'hash', 'index', 'unit']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('outputs');
    }
};
