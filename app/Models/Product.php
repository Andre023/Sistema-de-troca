<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    // A nossa "Lista VIP" liberando as colunas para gravação
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'image_path',
        'price',
        'status',
    ];

    // Aqui dizemos que o produto pertence a um usuário
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}