<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory, LogsActivity;

    public function activitySubjectType(): string
    {
        return 'Produto';
    }

    public function activityDescription(): string
    {
        return "Produto {$this->name}";
    }

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