<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_boxes', function (Blueprint $table) {
            $table->text('observation')->nullable()->after('number');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_boxes', function (Blueprint $table) {
            $table->dropColumn('observation');
        });
    }
};