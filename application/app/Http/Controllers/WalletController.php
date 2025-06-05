<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWalletRequest;
use App\Http\Requests\UpdateWalletRequest;
use App\Jobs\GetWalletTransactions;
use App\Models\Wallet;
use Exception;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

use CardanoPhp\Bech32\Bech32;

class WalletController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $wallets = Auth::user()->wallets;

        return Inertia::render('Wallets/Index', compact('wallets'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Wallets/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreWalletRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $decoded = Bech32::decodeCardanoAddress($data['address']);

        try {
            $wallet = Auth::user()->wallets()->create([
                'name' => $data['name'],
            ]);
        } catch (UniqueConstraintViolationException $e) {
            return Redirect::back()
                ->with('error', 'Wallet name must be unique!');
        }

        try {
            $wallet->address()->create([
                'user_id' => Auth::id(), 'bech32' => $data['address'],
                'stake_key' => $decoded['stakeAddress'],
            ]);
        } catch (UniqueConstraintViolationException $e) {
            try {
                $address = Auth::user()->addresses()
                    ->where('bech32', $data['address'])->first();
                if ($address) {
                    Log::info('User address found...', $address->toArray());
                    if ($address->addressable_id === null) {
                        Log::info("This address hasn't been associated with any contact or wallet yet!");
                        $address->addressable()->associate($wallet);
                        $address->save();

                        return Redirect::back()
                            ->with('success', 'Wallet created.');
                    } else {
                        throw new Exception("Address is already in use!");
                    }
                } else {
                    $wallet->delete();

                    return Redirect::back()
                        ->with('error', 'Address not found!');
                }
            } catch (Throwable $e) {
                $wallet->delete();
                Log::error($e->getMessage());
            }

            return Redirect::back()
                ->with('error', 'Address is already in use!');
        }

        return Redirect::route('wallets.index')
            ->with('success', 'Wallet created.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Wallet $wallet): Response
    {
        $wallet->transactions;

        return Inertia::render('Wallets/Show', compact('wallet'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Wallet $wallet)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateWalletRequest $request, Wallet $wallet)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Wallet $wallet): RedirectResponse
    {
        // TODO: Cancel any scheduled tasks for the
        $wallet->delete();

        return Redirect::route('wallets.index')
            ->with('success', 'Wallet deleted.');
    }

    public function updateTransactions(Wallet $wallet): RedirectResponse
    {
        GetWalletTransactions::dispatch($wallet);
        Log::debug("We have scheduled this wallet to be updated! {$wallet->address->bech32}");

        return Redirect::back()
            ->with('success', 'Transaction update scheduled!');
    }
}
