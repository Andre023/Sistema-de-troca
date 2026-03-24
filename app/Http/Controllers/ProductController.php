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
    public function index()
    {
        $products = Product::with('user')->latest()->paginate(12);
        
        return Inertia::render('Dashboard', [
            'products' => $products
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
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
            
            // --- A SOLUÇÃO DEFINITIVA PARA O WINDOWS ---
            // Vamos criar a pasta REAL dentro do public (public/storage/products)
            $pastaDestino = public_path('storage/products');

            // Se a pasta não existir, o PHP cria-a agora
            if (!file_exists($pastaDestino)) {
                mkdir($pastaDestino, 0755, true);
            }

            // Caminho absoluto onde o ficheiro vai ficar guardado fisicamente
            $caminhoCompleto = public_path('storage/' . $filename);
            
            // Guarda a imagem diretamente na pasta real
            file_put_contents($caminhoCompleto, $encodedImage->toString());
            
            $imagePath = $filename;
        }

        Product::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'description' => $request->description,
            'image_path' => $imagePath, // Vai gravar "products/id.webp"
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
    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|max:10240', // Imagem agora é opcional na edição
            'description' => 'nullable|string'
        ]);

        $data = [
            'name' => $request->name,
            'description' => $request->description,
        ];

        // Se o utilizador enviou uma NOVA foto
        if ($request->hasFile('image')) {
            // 1. Apaga a foto antiga para não acumular lixo
            $fotoAntiga = public_path('storage/' . $product->image_path);
            if (file_exists($fotoAntiga) && !is_dir($fotoAntiga)) {
                unlink($fotoAntiga);
            }

            // 2. Processa e guarda a nova foto (Mesma lógica do store)
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

        // Atualiza o produto na base de dados
        $product->update($data);

        return redirect()->back();
    }

    public function destroy(Product $product)
    {
        // 1. Apaga a foto física do Windows
        $caminhoCompleto = public_path('storage/' . $product->image_path);
        if (file_exists($caminhoCompleto) && !is_dir($caminhoCompleto)) {
            unlink($caminhoCompleto);
        }

        // 2. Apaga o registo do banco de dados
        $product->delete();

        return redirect()->back();
    }
}