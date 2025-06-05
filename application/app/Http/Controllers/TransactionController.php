<?php

namespace App\Http\Controllers;

use App\Jobs\ParseTransactionOutput;
use App\Models\Address;
use App\Models\Output;
use App\Models\Transaction;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use Illuminate\Database\UniqueConstraintViolationException;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTransactionRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Transaction $transaction)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Transaction $transaction)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTransactionRequest $request, Transaction $transaction)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Transaction $transaction)
    {
        //
    }

    public function process(Transaction $transaction)
    {
//        $wallet_address = $transaction->wallet->address->bech32;
//        $utxo_detail = json_decode($transaction->utxo_detail);
//        $balance = [
//            'hash' => $transaction->hash,
//            'fees' => $transaction->fees,
//            'input' => [],
//            'output' => [],
//            'diff' => [],
//            'spends' => [],
//            'receives' => [],
//            'mode' => null
//        ];
//
//        foreach ($utxo_detail->inputs as $input) {
//            if ($input->address === $wallet_address) {
//                foreach ($input->amount as $amount) {
//                    if (!isset($balance['input'][$amount->unit])) {
//                        $balance['input'][$amount->unit] = 0;
//                    }
//
//                    if (!isset($balance['diff'][$amount->unit])) {
//                        $balance['diff'][$amount->unit] = 0;
//                    }
//
//                    if (!isset($balance['output'][$amount->unit])) {
//                        $balance['output'][$amount->unit] = 0;
//                    }
//
//                    $balance['input'][$amount->unit] += $amount->quantity;
//                }
//            }
//        }
//
//        foreach ($utxo_detail->outputs as $output) {
//            if ($output->address === $wallet_address) {
//                foreach ($output->amount as $amount) {
//                    if (!isset($balance['output'][$amount->unit])) {
//                        $balance['output'][$amount->unit] = 0;
//                    }
//
//                    if (!isset($balance['diff'][$amount->unit])) {
//                        $balance['diff'][$amount->unit] = 0;
//                    }
//
//                    if (!isset($balance['input'][$amount->unit])) {
//                        $balance['input'][$amount->unit] = 0;
//                    }
//
//                    $balance['output'][$amount->unit] += $amount->quantity;
//                }
//            }
//        }
//
//        foreach ($balance['diff'] as $unit => $quantity) {
//            $balance['diff'][$unit] = $balance['output'][$unit] - $balance['input'][$unit];
//            if ($balance['diff'][$unit] === 0) {
//                unset($balance['diff'][$unit]);
//                continue;
//            }
//
//            $diff = $balance['diff'][$unit];
//            if ($diff < 0) {
//                // Spend
//                $diff = $diff * -1;
////                $diff -= $transaction->fees;
//                $matched = false;
//                foreach ($utxo_detail->outputs as $output) {
//                    if ($output->address === $wallet_address) {
//                        continue;
//                    }
//
//                    if ($diff <= 0) {
//                        $matched = true;
//                        break;
//                    }
//
//                    foreach ($output->amount as $amount) {
//                        if ($amount->unit !== $unit) {
//                            continue;
//                        }
//
//                        $change = min($diff, $amount->quantity);
//                        if ($change) {
//                            $balance['spends'][] = [
//                                'hash' => $transaction->hash,
//                                'index' => $output->output_index,
//                                'unit' => $unit,
//                                'quantity' => $change,
//                                'to' => $output->address,
//                                'from' => $wallet_address
//                            ];
//                            $diff -= $change;
//                            if ($diff <= 0) {
//                                $matched = true;
//                                break 2;
//                            }
//                        }
//                    }
//                }
//
//                if (!$matched) {
//                    // Token minting
//                    $transaction->tags()->updateOrCreate([
//                        'name' => 'burn'
//                    ]);
//                    $balance['receives'][] = [
//                        'hash' => $transaction->hash,
//                        'index' => 9999,
//                        'unit' => $unit,
//                        'quantity' => $diff,
//                        'from' => $wallet_address,
//                        'to' => null
//                    ];
//                }
//            } else {
//                // Receive
//                $matched = false;
//                foreach ($utxo_detail->inputs as $input) {
//                    if ($input->address === $wallet_address) {
//                        continue;
//                    }
//                    foreach ($input->amount as $amount) {
//                        if ($amount->unit !== $unit) {
//                            continue;
//                        }
//
//                        if ($diff <= 0) {
//                            $matched = true;
//                            break 2;
//                        }
//
//                        $change = min($amount->quantity, $diff);
//                        $balance['receives'][] = [
//                            'hash' => $input->tx_hash,
//                            'index' => $input->output_index,
//                            'unit' => $unit,
//                            'quantity' => $change,
//                            'from' => $input->address,
//                            'to' => $wallet_address,
//                        ];
//
//                        $diff -= $change;
//                        if ($diff <= 0) {
//                            $matched = true;
//                            break 2;
//                        }
//                    }
//                }
//                if (!$matched) {
//                    // Token minting
//                    $transaction->tags()->updateOrCreate([
//                        'name' => 'mint'
//                    ]);
//                    $balance['receives'][] = [
//                        'hash' => $transaction->hash,
//                        'index' => 9999,
//                        'unit' => $unit,
//                        'quantity' => $diff,
//                        'from' => null,
//                        'to' => $wallet_address
//                    ];
//                }
//            }
//        }
//
//        if (count($balance['spends']) && count($balance['receives'])) {
//            $balance['mode'] = 'mixed';
//            $transaction->tags()->updateOrCreate([
//                'name' => 'spend'
//            ]);
//            $transaction->tags()->updateOrCreate([
//                'name' => 'receive'
//            ]);
//        } elseif (count($balance['spends']) && empty($balance['receives'])) {
//            $balance['mode'] = 'output';
//            $transaction->tags()->updateOrCreate([
//                'name' => 'spend'
//            ]);
//        } elseif (empty($balance['spends']) && count($balance['receives'])) {
//            $balance['mode'] = 'input';
//            $transaction->tags()->updateOrCreate([
//                'name' => 'receive'
//            ]);
//        }
//
//        foreach ($balance['spends'] as $spend) {
//            if ($spend['to']) {
//                $recipient_address = Auth()->user()->addresses()->where('bech32', $spend['to'])->first();
//                if (!$recipient_address) {
//                    $recipient_address = new Address([
//                        'user_id' => Auth()->user()->id,
//                        'bech32' => $spend['to']
//                    ]);
//                    $recipient_address->save();
//                }
//
//                $output = new Output([
//                    'user_id' => Auth()->user()->id,
//                    'transaction_id' => $transaction->id,
//                    'hash' => $spend['hash'],
//                    'index' => $spend['index'],
//                    'unit' => $spend['unit'],
//                    'quantity' => $spend['quantity'],
//                    'from_address_id' => $transaction->wallet->address->id,
//                    'to_address_id' => $recipient_address->id,
//                ]);
//            } else {
//                $output = new Output([
//                    'user_id' => Auth()->user()->id,
//                    'transaction_id' => $transaction->id,
//                    'hash' => $spend['hash'],
//                    'index' => $spend['index'],
//                    'unit' => $spend['unit'],
//                    'quantity' => $spend['quantity'],
//                    'from_address_id' => $transaction->wallet->address->id,
//                    'to_address_id' => null,
//                ]);
//            }
////            dd($output);
//            try {
//                $transaction->outputs()->save($output);
//            } catch (UniqueConstraintViolationException $e) {
//                // Quietly fail for a unique check duplication...
//            }
//        }
//
//        foreach ($balance['receives'] as $receive) {
//            if ($receive['from']) {
//                $sender_address = Auth()->user()->addresses()->where('bech32', $receive['from'])->first();
//                if (!$sender_address) {
//                    $sender_address = new Address([
//                        'user_id' => Auth()->user()->id,
//                        'bech32' => $receive['from']
//                    ]);
//                    $sender_address->save();
//                }
//
//                $output = new Output([
//                    'transaction_id' => $transaction->id,
//                    'hash' => $receive['hash'],
//                    'index' => $receive['index'],
//                    'unit' => $receive['unit'],
//                    'quantity' => $receive['quantity'],
//                    'from_address_id' => $sender_address->id,
//                    'to_address_id' => $transaction->wallet->address->id,
//                ]);
//            } else {
//                $output = new Output([
//                    'transaction_id' => $transaction->id,
//                    'hash' => $receive['hash'],
//                    'index' => $receive['index'],
//                    'unit' => $receive['unit'],
//                    'quantity' => $receive['quantity'],
//                    'from_address_id' => null,
//                    'to_address_id' => $transaction->wallet->address->id,
//                ]);
//            }
//            // dd($output);
//            try {
//                $transaction->outputs()->save($output);
//            } catch (UniqueConstraintViolationException $e) {
//                // Quietly fail for a unique check duplication...
//            }
//        }

        $transaction->tags;

//        $transaction->balance = $balance;
//        $transaction->outputs;
        ParseTransactionOutput::dispatch($transaction);
        $transaction->spends;
        $transaction->receives;
        dd($transaction->toArray());
    }
}
