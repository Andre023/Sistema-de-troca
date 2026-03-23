<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ean_supplier_references', function (Blueprint $table) {
            $table->id();
            $table->string('ean', 64)->unique();
            $table->string('supplier_name');
            $table->string('normalized_supplier_name')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ean_supplier_references');
    }
};
