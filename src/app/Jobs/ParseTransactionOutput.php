<?php

namespace App\Jobs;

use App\Models\Address;
use App\Models\Output;
use App\Models\Transaction;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ParseTransactionOutput implements ShouldQueue, ShouldBeUnique
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Transaction $transaction,
    )
    {
        //
    }

    public function uniqueId()
    {
        return $this->transaction->id;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {

        $wallet_address = $this->transaction->wallet->address->bech32;
        $stake_address = $this->transaction->wallet->address->stake_key;
        $utxo_detail = json_decode($this->transaction->utxo_detail);
        $withdrawals = json_decode($this->transaction->withdrawals);

        $balance = [
            'input' => [],
            'output' => [],
            'diff' => [],
            'spends' => [],
            'receives' => [],
        ];

        foreach ($utxo_detail->inputs as $input) {
            if ($input->address === $wallet_address) {
                foreach ($input->amount as $amount) {
                    if (!isset($balance['input'][$amount->unit])) {
                        $balance['input'][$amount->unit] = 0;
                    }

                    if (!isset($balance['diff'][$amount->unit])) {
                        $balance['diff'][$amount->unit] = 0;
                    }

                    if (!isset($balance['output'][$amount->unit])) {
                        $balance['output'][$amount->unit] = 0;
                    }

                    $balance['input'][$amount->unit] += $amount->quantity;
                }
            }
        }

        foreach ($utxo_detail->outputs as $output) {
            if ($output->address === $wallet_address) {
                foreach ($output->amount as $amount) {
                    if (!isset($balance['output'][$amount->unit])) {
                        $balance['output'][$amount->unit] = 0;
                    }

                    if (!isset($balance['diff'][$amount->unit])) {
                        $balance['diff'][$amount->unit] = 0;
                    }

                    if (!isset($balance['input'][$amount->unit])) {
                        $balance['input'][$amount->unit] = 0;
                    }

                    $balance['output'][$amount->unit] += $amount->quantity;
                }
            }
        }

        foreach($withdrawals as $withdrawal) {
            if ($withdrawal->address === $stake_address) {
                $balance['diff']['lovelace'] += $withdrawal->amount;
                $this->transaction->tags()->updateOrCreate([
                    'name' => 'withdrawal'
                ]);
            }
        }

        foreach ($balance['diff'] as $unit => $quantity) {
            /** @var string $unit */
            $balance['diff'][$unit] = $balance['output'][$unit] - $balance['input'][$unit];
            if ($balance['diff'][$unit] === 0) {
                unset($balance['diff'][$unit]);
                continue;
            }

            $diff = $balance['diff'][$unit];
            if ($diff < 0) {
                // Spend
                $diff = $diff * -1;
                $diff -= $this->transaction->fees;
                foreach ($utxo_detail->outputs as $output) {
                    if ($output->address === $wallet_address) {
                        continue;
                    }

                    if ($diff <= 0) {
                        break;
                    }

                    foreach ($output->amount as $amount) {
                        if ($amount->unit !== $unit) {
                            continue;
                        }

                        $change = min($diff, $amount->quantity);
                        if ($change) {
                            $balance['spends'][] = [
                                'hash' => $this->transaction->hash,
                                'index' => $output->output_index,
                                'unit' => $unit,
                                'quantity' => $change,
                                'to' => $output->address,
                                'from' => $wallet_address
                            ];
                        }

                        $diff -= $change;
                        if ($diff <= 0) {
                            break 2;
                        }
                    }
                }
            } else {
                // Receive
                $matched = false;
                foreach ($utxo_detail->inputs as $input) {
                    if ($input->address === $wallet_address) {
                        continue;
                    }
                    foreach ($input->amount as $amount) {
                        if ($amount->unit !== $unit) {
                            continue;
                        }

                        if ($diff <= 0) {
                            $matched = true;
                            break 2;
                        }

                        $change = min($amount->quantity, $diff);
                        $balance['receives'][] = [
                            'hash' => $input->tx_hash,
                            'index' => $input->output_index,
                            'unit' => $unit,
                            'quantity' => $change,
                            'from' => $input->address,
                            'to' => $wallet_address,
                        ];

                        $diff -= $change;
                        if ($diff <= 0) {
                            $matched = true;
                            break 2;
                        }
                    }
                }
                if (!$matched) {
                    // Token minting
                    $balance['receives'][] = [
                        'hash' => $this->transaction->hash,
                        'index' => 9999,
                        'unit' => $unit,
                        'quantity' => $diff,
                        'from' => null,
                        'to' => $wallet_address
                    ];
                }
            }
        }

        if (count($balance['spends']) && count($balance['receives'])) {
            $this->transaction->tags()->updateOrCreate([
                'name' => 'spend'
            ]);
            $this->transaction->tags()->updateOrCreate([
                'name' => 'receive'
            ]);
        } elseif (count($balance['spends']) && empty($balance['receives'])) {
            $this->transaction->tags()->updateOrCreate([
                'name' => 'spend'
            ]);
        } elseif (empty($balance['spends']) && count($balance['receives'])) {
            $this->transaction->tags()->updateOrCreate([
                'name' => 'receive'
            ]);
        }

        foreach ($balance['spends'] as $spend) {
            if ($spend['to']) {
                $recipient_address = $this->transaction->wallet->user->addresses()->where('bech32', $spend['to'])->first();
                if (!$recipient_address) {
                    $recipient_address = new Address([
                        'user_id' => $this->transaction->wallet->user->id,
                        'bech32' => $spend['to']
                    ]);
                    $recipient_address->save();
                }

                $output = new Output([
                    'transaction_id' => $this->transaction->id,
                    'hash' => $spend['hash'],
                    'index' => $spend['index'],
                    'unit' => $spend['unit'],
                    'quantity' => $spend['quantity'],
                    'from_address_id' => $this->transaction->wallet->address->id,
                    'to_address_id' => $recipient_address->id,
                ]);
            } else {
                $output = new Output([
                    'transaction_id' => $this->transaction->id,
                    'hash' => $spend['hash'],
                    'index' => $spend['index'],
                    'unit' => $spend['unit'],
                    'quantity' => $spend['quantity'],
                    'from_address_id' => $this->transaction->wallet->address->id,
                    'to_address_id' => null,
                ]);
            }
            try {
                $this->transaction->outputs()->save($output);
            } catch (UniqueConstraintViolationException $e) {
                // Quietly fail for a unique check duplication...
            }
        }

        foreach ($balance['receives'] as $receive) {
            if ($receive['from']) {
                $sender_address = $this->transaction->wallet->user->addresses()->where('bech32', $receive['from'])->first();
                if (!$sender_address) {
                    $sender_address = new Address([
                        'user_id' => $this->transaction->wallet->user->id,
                        'bech32' => $receive['from']
                    ]);
                    $sender_address->save();
                }

                $output = new Output([
                    'transaction_id' => $this->transaction->id,
                    'hash' => $receive['hash'],
                    'index' => $receive['index'],
                    'unit' => $receive['unit'],
                    'quantity' => $receive['quantity'],
                    'from_address_id' => $sender_address->id,
                    'to_address_id' => $this->transaction->wallet->address->id,
                ]);
            } else {
                $output = new Output([
                    'transaction_id' => $this->transaction->id,
                    'hash' => $receive['hash'],
                    'index' => $receive['index'],
                    'unit' => $receive['unit'],
                    'quantity' => $receive['quantity'],
                    'from_address_id' => null,
                    'to_address_id' => $this->transaction->wallet->address->id,
                ]);
            }
            try {
                $this->transaction->outputs()->save($output);
            } catch (UniqueConstraintViolationException $e) {
                // Quietly fail for a unique check duplication...
            }
        }
    }
}
