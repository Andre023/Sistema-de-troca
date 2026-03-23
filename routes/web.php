<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ExchangeControlController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Aponta o Dashboard para o nosso controller de produtos
    Route::get('/dashboard', [ProductController::class, 'index'])->name('dashboard');
    
    // Nossas rotas de salvar foto e preço
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::put('/products/{product}/price', [ProductController::class, 'updatePrice'])->name('products.updatePrice');
    Route::get('/controle-troca', [ExchangeControlController::class, 'index'])->name('exchange-control.index');
    Route::get('/controle-troca/busca', [ExchangeControlController::class, 'search'])->name('exchange-control.search');
    Route::post('/controle-troca/fornecedores', [ExchangeControlController::class, 'storeSupplier'])->name('exchange-control.suppliers.store');
    Route::put('/controle-troca/fornecedores/{supplier}', [ExchangeControlController::class, 'updateSupplier'])->name('exchange-control.suppliers.update');
    Route::delete('/controle-troca/fornecedores/{supplier}', [ExchangeControlController::class, 'destroySupplier'])->name('exchange-control.suppliers.destroy');
    Route::post('/controle-troca/fornecedores/{supplier}/caixas', [ExchangeControlController::class, 'storeBox'])->name('exchange-control.boxes.store');
    Route::delete('/controle-troca/caixas/{supplierBox}', [ExchangeControlController::class, 'destroyBox'])->name('exchange-control.boxes.destroy');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';