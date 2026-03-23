<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_boxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->onDelete('cascade');
            $table->string('number');
            $table->timestamps();

            $table->unique(['supplier_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_boxes');
    }
};
