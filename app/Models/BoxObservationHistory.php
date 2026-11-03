<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BoxObservationHistory extends Model
{
    protected $fillable = [
        'supplier_box_id',
        'user_id',
        'user_name',
        'old_observation',
        'new_observation',
    ];

    public function box()
    {
        return $this->belongsTo(SupplierBox::class, 'supplier_box_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
