<?php

namespace App\Jobs;

use App\Models\Wallet;
use App\Services\BlockfrostService;
use GuzzleHttp\Exception\ConnectException;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\WithoutRelations;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;

class GetWalletTransactions implements ShouldQueue, ShouldBeUniqueUntilProcessing
{
    use Queueable;

    public $uniqueFor = 600;

    public function uniqueId(): string
    {
        return $this->wallet->id;
    }

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Wallet $wallet
    )
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $BF = new BlockfrostService();
        try {
            $transactions = $BF->getTransactions(
                address: $this->wallet->address->bech32,
                get_utxo: true,
                from: $this->wallet->transactions()->max('block_height')
            );
        } catch (ConnectException $e) {
            // We could not connect via the API?
            Log::error($e->getMessage());
            self::dispatch($this->wallet)->delay(now()->addMinutes(5));
        }

        $count = count($transactions);
        $new = 0;

        foreach ($transactions as $transaction) {
            try {
                $transaction = $this->wallet->transactions()->create($transaction);
                if ($transaction) {
                    ParseTransactionOutput::dispatch($transaction);
                }
                $new++;
            } catch (UniqueConstraintViolationException $e) {
                // Quietly fail for a unique check duplication...
            } catch (\Throwable $e) {
                Log::error($e->getMessage());
            }
        }

        if ($new) {
            $this->wallet->touch();
        }

        if ($count >= 100) {
            self::dispatch($this->wallet)->delay(now()->addMinutes(1));
        }
    }
}
