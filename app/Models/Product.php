<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'category', // Adicionado aqui
        'description',
        'image_path',
        'price',
        'status',
        'priced_by',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pricedBy()
    {
        return $this->belongsTo(User::class, 'priced_by');
    }
}