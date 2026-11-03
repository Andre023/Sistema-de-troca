<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierObservationTest extends TestCase
{
    use RefreshDatabase;

    public function test_encarregado_edita_observacao_do_fornecedor_e_aparece_no_historico(): void
    {
        $alan = User::factory()->create(['role' => 'encarregado', 'name' => 'Alan']);
        $supplier = Supplier::create(['name' => 'F', 'observation' => 'antiga']);

        $this->actingAs($alan)->put(route('exchange-control.suppliers.updateObservation', $supplier), ['observation' => 'nova'])->assertRedirect();
        $this->assertSame('nova', $supplier->fresh()->observation);

        $history = $this->actingAs($alan)->getJson(route('exchange-control.suppliers.history', $supplier))->assertOk()->json('history');
        $this->assertCount(1, $history);
        $this->assertSame(['Alan', 'antiga', 'nova'], [$history[0]['user_name'], $history[0]['old_observation'], $history[0]['new_observation']]);
    }

    public function test_funcionario_nao_edita_observacao_do_fornecedor(): void
    {
        $func = User::factory()->create(['role' => 'employee']);
        $supplier = Supplier::create(['name' => 'F', 'observation' => 'x']);

        $this->actingAs($func)->put(route('exchange-control.suppliers.updateObservation', $supplier), ['observation' => 'y'])->assertForbidden();
        $this->assertSame('x', $supplier->fresh()->observation);
    }
}
