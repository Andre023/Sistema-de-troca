<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
// O Storage do Laravel foi removido, vamos usar os caminhos reais!
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['user', 'pricedBy'])->latest();

        // Lógica dos Filtros
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // withQueryString() garante que os filtros não se percam ao mudar de página
        $products = $query->paginate(12)->withQueryString();
        
        return Inertia::render('Dashboard', [
            'products' => $products,
            'filters' => $request->only(['status', 'category']) // Envia os filtros ativos para o React
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|in:bazar,perfumaria,outros', // Validação da categoria
            'image' => 'required|image|max:10240', 
            'description' => 'nullable|string'
        ]);

        $imagePath = null;

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $manager = new ImageManager(new Driver());
            $image = $manager->read($file);
            $image->scaleDown(width: 800);
            $encodedImage = $image->toWebp(75); 
            $filename = 'products/' . uniqid() . '.webp';
            
            $pastaDestino = public_path('storage/products');
            if (!file_exists($pastaDestino)) {
                mkdir($pastaDestino, 0755, true);
            }
            
            file_put_contents(public_path('storage/' . $filename), $encodedImage->toString());
            $imagePath = $filename;
        }

        Product::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'category' => $request->category, // Salva a categoria
            'description' => $request->description,
            'image_path' => $imagePath,
            'status' => 'pending'
        ]);

        return redirect()->back();
    }

    public function updatePrice(Request $request, Product $product)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Apenas a administração pode avaliar produtos.');
        }

        $request->validate([
            'action' => 'required|in:price,exchange,discard',
            'price' => 'required_if:action,price|nullable|numeric'
        ]);

        $product->update([
            'price' => $request->action === 'price' ? $request->price : null,
            'status' => $request->action === 'price' ? 'priced' : $request->action,
            'priced_by' => auth()->id(),
        ]);

        return redirect()->back();
    }

    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|in:bazar,perfumaria,outros', // Validação da edição
            'image' => 'nullable|image|max:10240', 
            'description' => 'nullable|string'
        ]);

        $data = [
            'name' => $request->name,
            'category' => $request->category, // Atualiza a categoria
            'description' => $request->description,
        ];

        if ($request->hasFile('image')) {
            $fotoAntiga = public_path('storage/' . $product->image_path);
            if (file_exists($fotoAntiga) && !is_dir($fotoAntiga)) {
                unlink($fotoAntiga);
            }

            $file = $request->file('image');
            $manager = new ImageManager(new Driver());
            $image = $manager->read($file);
            $image->scaleDown(width: 800);
            $encodedImage = $image->toWebp(75); 
            $filename = 'products/' . uniqid() . '.webp';
            
            $pastaDestino = public_path('storage/products');
            if (!file_exists($pastaDestino)) { mkdir($pastaDestino, 0755, true); }
            
            file_put_contents(public_path('storage/' . $filename), $encodedImage->toString());
            $data['image_path'] = $filename;
        }

        $product->update($data);

        return redirect()->back();
    }

    public function destroy(Product $product)
    {
        $caminhoCompleto = public_path('storage/' . $product->image_path);
        if (file_exists($caminhoCompleto) && !is_dir($caminhoCompleto)) {
            unlink($caminhoCompleto);
        }

        $product->delete();
        return redirect()->back();
    }
}