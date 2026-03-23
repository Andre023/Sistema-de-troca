<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index()
    {
        // Pega todos os produtos e o nome de quem cadastrou
        $products = Product::with('user')->latest()->get();
        return Inertia::render('Dashboard', [
            'products' => $products
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'required', // Tiramos as travas de tipo e tamanho por enquanto
            'description' => 'nullable|string'
        ]);

        $imagePath = $request->file('image')->store('products', 'public');

        Product::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'description' => $request->description,
            'image_path' => $imagePath,
            'status' => 'pending'
        ]);

        return redirect()->back();
    }

    public function updatePrice(Request $request, Product $product)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Apenas a administração pode definir preços.');
        }

        $request->validate(['price' => 'required|numeric']);

        $product->update([
            'price' => $request->price,
            'status' => 'priced'
        ]);

        return redirect()->back();
    }
}