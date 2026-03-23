<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\SupplierBox;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ExchangeControlController extends Controller
{
    private function normalizeEan(string $value): string
    {
        $normalized = trim($value);
        $normalized = preg_replace('/\s+/', '', $normalized) ?? '';
        // Handles values converted from Excel like "7896054901607.0"
        $normalized = preg_replace('/\.0+$/', '', $normalized) ?? $normalized;

        return $normalized;
    }

    private function normalizeSupplierName(string $value): string
    {
        return Str::of($value)
            ->trim()
            ->upper()
            ->replaceMatches('/\s+/', ' ')
            ->value();
    }

    private function findReferenceByEan(string $ean): ?array
    {
        $ean = $this->normalizeEan($ean);
        if ($ean === '') {
            return null;
        }

        $jsonPath = base_path('dados_convertidos.json');
        if (!file_exists($jsonPath)) {
            return null;
        }

        $cacheKey = 'ean_lookup_json_' . md5($jsonPath . '|' . filemtime($jsonPath));
        $lookup = cache()->remember($cacheKey, now()->addHours(12), function () use ($jsonPath) {
            $content = file_get_contents($jsonPath);
            if ($content === false) {
                return [];
            }

            $rows = json_decode($content, true);
            if (!is_array($rows)) {
                return [];
            }

            $indexed = [];
            foreach ($rows as $row) {
                $rowEan = $this->normalizeEan((string) ($row['Ean'] ?? ''));
                $supplierName = trim((string) ($row['Nome'] ?? ''));

                if ($rowEan === '' || $supplierName === '') {
                    continue;
                }

                $indexed[$rowEan] = [
                    'ean' => $rowEan,
                    'supplier_name' => $supplierName,
                    'normalized_supplier_name' => $this->normalizeSupplierName($supplierName),
                ];
            }

            return $indexed;
        });

        if (isset($lookup[$ean])) {
            return $lookup[$ean];
        }

        return null;
    }

    private function parseBoxes(?string $rawBoxes): array
    {
        if (!$rawBoxes) {
            return [];
        }

        return collect(preg_split('/[\r\n,;]+/', $rawBoxes))
            ->map(fn ($box) => trim((string) $box))
            ->filter()
            ->unique()
            ->values()
            ->all();
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

    public function search(Request $request)
    {
        try {
            $query = trim((string) $request->query('q', ''));
            if ($query === '') {
                return response()->json([
                    'suppliers' => [],
                    'eanMatch' => null,
                ]);
            }

            $suppliers = Supplier::with('boxes')
                ->where('name', 'like', '%' . $query . '%')
                ->orderBy('name')
                ->limit(10)
                ->get();

            $eanMatch = null;
            if (preg_match('/^\d{8,}$/', $query)) {
                $reference = $this->findReferenceByEan($query);
                if ($reference) {
                    $linkedSupplier = Supplier::with('boxes')
                        ->whereRaw('UPPER(name) = ?', [$reference['normalized_supplier_name']])
                        ->first();

                    $eanMatch = [
                        'ean' => $reference['ean'],
                        'supplier_name' => $reference['supplier_name'],
                        'linked_supplier' => $linkedSupplier,
                    ];
                }
            }

            return response()->json([
                'suppliers' => $suppliers,
                'eanMatch' => $eanMatch,
            ]);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'suppliers' => [],
                'eanMatch' => null,
                'error' => 'Falha ao processar a busca. Verifique o arquivo dados_convertidos.json.',
            ], 500);
        }
    }

    public function storeSupplier(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:suppliers,name',
            'boxes' => 'nullable|string',
        ]);

        $supplier = Supplier::create([
            'name' => $validated['name'],
        ]);

        $boxes = $this->parseBoxes($validated['boxes'] ?? null);
        if (!empty($boxes)) {
            $supplier->boxes()->createMany(
                collect($boxes)->map(fn ($number) => ['number' => $number])->all()
            );
        }

        return redirect()->back();
    }

    public function updateSupplier(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('suppliers', 'name')->ignore($supplier->id),
            ],
        ]);

        $supplier->update([
            'name' => $validated['name'],
        ]);

        return redirect()->back();
    }

    public function destroySupplier(Supplier $supplier)
    {
        $supplier->delete();

        return redirect()->back();
    }

    public function storeBox(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'number' => [
                'required',
                'string',
                'max:100',
                Rule::unique('supplier_boxes', 'number')->where(function ($query) use ($supplier) {
                    return $query->where('supplier_id', $supplier->id);
                }),
            ],
        ]);

        $supplier->boxes()->create($validated);

        return redirect()->back();
    }

    public function destroyBox(SupplierBox $supplierBox)
    {
        $supplierBox->delete();

        return redirect()->back();
    }
}
