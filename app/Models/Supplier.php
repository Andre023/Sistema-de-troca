<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory, LogsActivity;

    public function activitySubjectType(): string
    {
        return 'Fornecedor';
    }

    public function activityDescription(): string
    {
        return "Fornecedor {$this->name}";
    }

    // As caixas são apagadas em cascata pelo banco, então guardamos elas junto
    protected function activityExtraOnDelete(): array
    {
        return ['caixas' => $this->boxes()->get(['id', 'number', 'observation'])->toArray()];
    }

    protected $fillable = [
        'name',
        'observation',
    ];

    public function boxes()
    {
        return $this->hasMany(SupplierBox::class);
    }
}
