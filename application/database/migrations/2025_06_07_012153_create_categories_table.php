<?php

use App\Models\Category;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('type', 2);
            $table->string('name');
            $table->timestamps();
            $table->unique(['type', 'name']);
        });

        $now = now()->toDateTimeString();

        Category::insert([
            ["type" => "BS", "name" => "NCA - Property, plant and equipment", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "NCA - Other intangible assets", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "NCA - Investments (Long term)", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "NCA - Loans (Long term)", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "NCA - Others Financial Assets (Long term)", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "NCA - Income tax assets (net)", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "NCA - Other non-current assets", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CA - Inventories", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CA - Investment property", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CA - Investments", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CA - Trade receivables", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CA - Cash and cash equivalents", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CA - Other bank balances", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CA - Loans", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CA - Others Financial Assets", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CA - Other current assets", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "EQ - Capital", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "EQ - Other equity", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "NCL - Borrowings (Long term)", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "NCL - Lease liabilities (Long term)", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "NCL - Others Financial liabilities (Long term)", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "NCL - Provisions (Long term)", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "NCL - Other non-current liabilities", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CL - Borrowings", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CL - Lease liabilities", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CL - Trade payables", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CL - Others Financial liabilities", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CL - Other current liabilities", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CL - Provisions", "created_at" => $now, "updated_at" => $now],
            ["type" => "BS", "name" => "CL - Income tax liabilities (net)", "created_at" => $now, "updated_at" => $now],
            ["type" => "PL", "name" => "PLI - Revenue from operations", "created_at" => $now, "updated_at" => $now],
            ["type" => "PL", "name" => "PLI - Other income", "created_at" => $now, "updated_at" => $now],
            ["type" => "PL", "name" => "PLE - Changes in inventories of finished goods, work in progress and stock in trade", "created_at" => $now, "updated_at" => $now],
            ["type" => "PL", "name" => "PLE - Transaction Cost", "created_at" => $now, "updated_at" => $now],
            ["type" => "PL", "name" => "PLE - Operating and maintenance expenses", "created_at" => $now, "updated_at" => $now],
            ["type" => "PL", "name" => "PLE - Consulting expense", "created_at" => $now, "updated_at" => $now],
            ["type" => "PL", "name" => "PLE - Finance costs", "created_at" => $now, "updated_at" => $now],
            ["type" => "PL", "name" => "PLE - Depreciation and amortization expense", "created_at" => $now, "updated_at" => $now],
            ["type" => "PL", "name" => "PLE - Other expenses", "created_at" => $now, "updated_at" => $now],
            ["type" => "PL", "name" => "PLE - Current tax", "created_at" => $now, "updated_at" => $now],
            ["type" => "PL", "name" => "PLE - Deferred tax ", "created_at" => $now, "updated_at" => $now],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
