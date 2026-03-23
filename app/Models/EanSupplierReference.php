<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EanSupplierReference extends Model
{
    use HasFactory;

    protected $fillable = [
        'ean',
        'supplier_name',
        'normalized_supplier_name',
    ];
}
