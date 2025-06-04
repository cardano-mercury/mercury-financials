<?php

use App\Http\Controllers\ContactController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\WalletController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('home');

/**
 *
 */
Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'verified',
])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/wallets/{wallet}/transactions', [WalletController::class, 'updateTransactions'])->name('wallet.transactions');
    Route::resource('wallets', WalletController::class);
    Route::resource('contacts', ContactController::class);

    Route::get('/transactions/{transaction}/process', [TransactionController::class, 'process'])->name('transactions.process');
});
