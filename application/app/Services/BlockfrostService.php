<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class BlockfrostService
{
    private string $network;
    private string $project_id;

    private string $endpoint;

    public function __construct()
    {
        $this->network = config("app.blockfrost.network");
        $this->project_id = config('app.blockfrost.project_id');

        switch ($this->network) {
            case 'mainnet':
                $this->endpoint = 'https://cardano-mainnet.blockfrost.io/api/v0';
                break;
            case 'preview':
                $this->endpoint = 'https://cardano-preview.blockfrost.io/api/v0';
                break;
            case 'preprod':
                $this->endpoint = 'https://cardano-preprod.blockfrost.io/api/v0';
                break;
            default:
                throw new Exception("Network not supported");
        }
    }

    public function getTransactions($address, $get_details = true, $get_utxo = false, $from = null, $to = null)
    {
        $response = Http::withHeaders([
            'project_id' => $this->project_id,
        ])->accept('application/json')
            ->withUrlParameters([
                'endpoint' => $this->endpoint,
                'address' => $address,
            ])
            ->withQueryParameters([
//                'order' => 'desc'
                'from' => $from,
                'to' => $to,
            ])
            ->get('{+endpoint}/addresses/{address}/transactions');

        $transactions = $response->json();
        if ($get_details) {
            foreach ($transactions as $index => $transaction) {
                $transactions[$index] = $this->getTransactionDetails($transaction['tx_hash']);
                $transactions[$index]['output_amount'] = json_encode($transactions[$index]['output_amount']);

                if ($transactions[$index]['withdrawal_count']) {
                    $transactions[$index]['withdrawals'] = json_encode($this->getTransactionWithdrawals($transaction['tx_hash']));
                } else {
                    $transactions[$index]['withdrawals'] = "[]";
                }

                if ($get_utxo) {
                    $transactions[$index]['utxo_detail'] = json_encode($this->getTransactionUTxO($transaction['tx_hash']));
                }
            }
        }
        return $transactions;
    }

    public function getTransactionDetails($hash)
    {
        $response = Http::withHeaders([
            'project_id' => $this->project_id,
        ])->accept('application/json')
            ->withUrlParameters([
                'endpoint' => $this->endpoint,
                'hash' => $hash,
            ])
            ->get('{+endpoint}/txs/{hash}');

        return $response->json();
    }

    public function getTransactionWithdrawals($hash): array
    {
        $response = Http::withHeaders([
            'project_id' => $this->project_id,
        ])->accept('application/json')->withUrlParameters([
            'endpoint' => $this->endpoint,
            'hash' => $hash,
        ])->get('{+endpoint}/txs/{hash}/withdrawals');

        return $response->json();
    }

    public function getTransactionUTxO($hash)
    {
        $response = Http::withHeaders([
            'project_id' => $this->project_id,
        ])->accept('application/json')
            ->withUrlParameters([
                'endpoint' => $this->endpoint,
                'hash' => $hash
            ])
            ->get('{+endpoint}/txs/{hash}/utxos');

        return $response->json();
    }
}
