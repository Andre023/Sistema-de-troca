<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class SupplierBox extends Model
{
    use HasFactory, LogsActivity;

    public function activitySubjectType(): string
    {
        return 'Caixa';
    }

    public function activityDescription(): string
    {
        $supplier = $this->supplier()->value('name');
        return "Caixa {$this->number}" . ($supplier ? " ({$supplier})" : '');
    }

    protected $fillable = [
        'supplier_id',
        'number',
        'observation',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function observationHistories()
    {
        return $this->hasMany(BoxObservationHistory::class);
    }
}
