<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BoxObservationTest extends TestCase
{
    use RefreshDatabase;

    private function box()
    {
        return Supplier::create(['name' => 'FORN'])->boxes()->create(['number' => '10']);
    }

    public function test_encarregado_edita_observacao_e_gera_historico(): void
    {
        $alan = User::factory()->create(['role' => 'encarregado', 'name' => 'Alan']);
        $box = $this->box();

        $this->actingAs($alan)->put(route('exchange-control.boxes.update', $box), ['observation' => 'quebrada'])->assertRedirect();
        $this->actingAs($alan)->put(route('exchange-control.boxes.update', $box), ['observation' => 'quebrada'])->assertRedirect(); // sem mudança
        $this->actingAs($alan)->put(route('exchange-control.boxes.update', $box), ['observation' => 'ok'])->assertRedirect();

        $this->assertSame('ok', $box->fresh()->observation);
        $res = $this->actingAs($alan)->getJson(route('exchange-control.boxes.history', $box))->assertOk()->json('history');
        $this->assertCount(2, $res);
        $this->assertSame('Alan', $res[0]['user_name']);
        $this->assertSame('quebrada', $res[0]['old_observation']);
        $this->assertSame('ok', $res[0]['new_observation']);
    }

    public function test_funcionario_nao_edita_observacao(): void
    {
        $func = User::factory()->create(['role' => 'employee']);
        $box = $this->box();

        $this->actingAs($func)->put(route('exchange-control.boxes.update', $box), ['observation' => 'x']);
        $this->assertNull($box->fresh()->observation);
        $this->assertCount(0, $this->actingAs($func)->getJson(route('exchange-control.boxes.history', $box))->json('history'));
    }

    public function test_encarregado_cria_caixa_com_observacao(): void
    {
        $alan = User::factory()->create(['role' => 'encarregado']);
        $supplier = Supplier::create(['name' => 'F2']);
        $this->actingAs($alan)->post(route('exchange-control.boxes.store', $supplier), ['number' => '5', 'observation' => 'nova']);
        $box = $supplier->boxes()->first();
        $this->assertSame('nova', $box->observation);
        $this->assertSame(1, $box->observationHistories()->count());
    }
}
