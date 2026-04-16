<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\SupplierBox;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory; // Importação para ler o Excel

class ExchangeControlController extends Controller
{
    private function normalizeEan(string $value): string
    {
        $normalized = trim($value);
        $normalized = preg_replace('/\s+/', '', $normalized) ?? '';
        $normalized = preg_replace('/\.0+$/', '', $normalized) ?? $normalized;
        return $normalized;
    }

    private function normalizeSupplierName(string $value): string
    {
        return Str::of($value)->trim()->upper()->replaceMatches('/\s+/', ' ')->value();
    }

    private function findReferenceByEan(string $ean): ?array
    {
        $ean = $this->normalizeEan($ean);
        if ($ean === '') return null;

        $jsonPath = base_path('dados_convertidos.json');
        if (!file_exists($jsonPath)) return null;

        $cacheKey = 'ean_lookup_json_' . md5($jsonPath . '|' . filemtime($jsonPath));
        $lookup = cache()->remember($cacheKey, now()->addHours(12), function () use ($jsonPath) {
            $content = file_get_contents($jsonPath);
            if ($content === false) return [];

            $rows = json_decode($content, true);
            if (!is_array($rows)) return [];

            $indexed = [];
            foreach ($rows as $row) {
                $rowEan = $this->normalizeEan((string) ($row['Ean'] ?? ''));
                $supplierName = trim((string) ($row['Nome'] ?? ''));

                if ($rowEan === '' || $supplierName === '') continue;

                $indexed[$rowEan] = [
                    'ean' => $rowEan,
                    'supplier_name' => $supplierName,
                    'normalized_supplier_name' => $this->normalizeSupplierName($supplierName),
                ];
            }
            return $indexed;
        });

        return $lookup[$ean] ?? null;
    }

    private function parseBoxes(?string $rawBoxes): array
    {
        if (!$rawBoxes) return [];
        return collect(preg_split('/[\r\n,;]+/', $rawBoxes))->map(fn ($box) => trim((string) $box))->filter()->unique()->values()->all();
    }

    public function index(Request $request)
    {
        $perPage = max(5, min((int) $request->query('per_page', 12), 50));
        $suppliers = Supplier::with(['boxes' => function ($query) {
            $query->orderBy('number');
        }])->orderBy('name')->paginate($perPage)->withQueryString();

        return Inertia::render('ExchangeControl', [
            'suppliers' => $suppliers,
        ]);
    }

    // --- NOVA FUNÇÃO DE UPLOAD DO EXCEL ---
    public function uploadExcel(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls'
        ]);

        try {
            $spreadsheet = IOFactory::load($request->file('file')->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $highestRow = $worksheet->getHighestDataRow();

            $estoque = [];
            
            // Loop começando da linha 20, conforme solicitado
            for ($row = 20; $row <= $highestRow; $row++) {
                // Colunas: D (GTIN), F (Produto), J (Estoque)
                $ean = $worksheet->getCell('D' . $row)->getCalculatedValue();
                $produto = $worksheet->getCell('F' . $row)->getCalculatedValue();
                $quantidade = $worksheet->getCell('J' . $row)->getCalculatedValue();

                if ($ean) {
                    $eanNorm = $this->normalizeEan((string)$ean);
                    if ($eanNorm !== '') {
                        $estoque[$eanNorm] = [
                            'nome' => $produto,
                            'quantidade' => $quantidade,
                        ];
                    }
                }
            }

            // Salva ou sobrescreve o JSON na raiz do projeto
            file_put_contents(base_path('estoque_troca.json'), json_encode($estoque, JSON_PRETTY_PRINT));

            return redirect()->back()->with('success', 'Arquivo atualizado e otimizado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['file' => 'Erro ao processar o arquivo: ' . $e->getMessage()]);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = trim((string) $request->query('q', ''));
            if ($query === '') {
                return response()->json(['suppliers' => [], 'eanMatch' => null, 'boxMatches' => []]);
            }

            // 1. Busca por Fornecedor
            $suppliers = Supplier::with('boxes')->where('name', 'like', '%' . $query . '%')->orderBy('name')->limit(10)->get();

            // 2. Busca por EAN
            $eanMatch = null;
            if (preg_match('/^\d{8,}$/', $query)) {
                
                // Busca no arquivo de fornecedores (o antigo)
                $reference = $this->findReferenceByEan($query);
                
                // Busca no NOVO arquivo de estoque (estoque_troca.json)
                $inExchange = null;
                $estoquePath = base_path('estoque_troca.json');
                if (file_exists($estoquePath)) {
                    $estoque = json_decode(file_get_contents($estoquePath), true);
                    if (isset($estoque[$query])) {
                        $inExchange = $estoque[$query];
                    }
                }

                if ($reference || $inExchange) {
                    $linkedSupplier = null;
                    if ($reference) {
                        $linkedSupplier = Supplier::with('boxes')
                            ->whereRaw('UPPER(name) = ?', [$reference['normalized_supplier_name']])
                            ->first();
                    }

                    $eanMatch = [
                        'ean' => $query,
                        'supplier_name' => $reference['supplier_name'] ?? 'Fornecedor desconhecido',
                        'linked_supplier' => $linkedSupplier,
                        'exchange_info' => $inExchange // Traz {nome, quantidade} se existir na troca
                    ];
                }
            }

            // 3. Busca por Caixa
            $boxMatches = SupplierBox::with(['supplier' => function($q) { $q->with('boxes'); }])
                ->where('number', $query)->get()
                ->map(function ($box) { return ['box_number' => $box->number, 'supplier' => $box->supplier]; });

            return response()->json([
                'suppliers' => $suppliers,
                'eanMatch' => $eanMatch,
                'boxMatches' => $boxMatches,
            ]);
            
        } catch (\Throwable $exception) {
            report($exception);
            return response()->json(['error' => 'Falha ao processar a busca.'], 500);
        }
    }

    public function storeSupplier(Request $request) { /* Manteve-se igual */
        $validated = $request->validate(['name' => 'required|string|max:255|unique:suppliers,name', 'boxes' => 'nullable|string']);
        $supplier = Supplier::create(['name' => $validated['name']]);
        $boxes = $this->parseBoxes($validated['boxes'] ?? null);
        if (!empty($boxes)) {
            $supplier->boxes()->createMany(collect($boxes)->map(fn ($number) => ['number' => $number])->all());
        }
        return redirect()->back();
    }
    public function updateSupplier(Request $request, Supplier $supplier) { /* Manteve-se igual */
        $validated = $request->validate(['name' => ['required', 'string', 'max:255', Rule::unique('suppliers', 'name')->ignore($supplier->id)]]);
        $supplier->update(['name' => $validated['name']]);
        return redirect()->back();
    }
    public function destroySupplier(Supplier $supplier) { $supplier->delete(); return redirect()->back(); }
    public function storeBox(Request $request, Supplier $supplier) { /* Manteve-se igual */
        $validated = $request->validate(['number' => ['required', 'string', 'max:100', Rule::unique('supplier_boxes', 'number')->where(function ($query) use ($supplier) { return $query->where('supplier_id', $supplier->id); })]]);
        $supplier->boxes()->create($validated);
        return redirect()->back();
    }
    public function destroyBox(SupplierBox $supplierBox) { $supplierBox->delete(); return redirect()->back(); }
}