<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_excluir_caixa_fica_registrado_com_quem_e_os_dados(): void
    {
        $alan = User::factory()->create(['role' => 'encarregado', 'name' => 'Alan']);
        $supplier = Supplier::create(['name' => 'FORN']);
        $box = $supplier->boxes()->create(['number' => '77', 'observation' => 'frágil']);

        $this->actingAs($alan)->delete(route('exchange-control.boxes.destroy', $box))->assertRedirect();

        $log = ActivityLog::where('action', 'excluiu')->where('subject_type', 'Caixa')->first();
        $this->assertNotNull($log);
        $this->assertSame('Alan', $log->user_name);
        $this->assertSame('Caixa 77 (FORN)', $log->description);
        $this->assertSame('77', $log->old_values['number']);
        $this->assertSame('frágil', $log->old_values['observation']);
    }

    public function test_excluir_fornecedor_guarda_as_caixas_apagadas_em_cascata(): void
    {
        $user = User::factory()->create(['role' => 'employee']);
        $supplier = Supplier::create(['name' => 'X']);
        $supplier->boxes()->createMany([['number' => '1'], ['number' => '2']]);

        $this->actingAs($user)->delete(route('exchange-control.suppliers.destroy', $supplier));

        $log = ActivityLog::where('action', 'excluiu')->where('subject_type', 'Fornecedor')->first();
        $this->assertSame(['1', '2'], collect($log->old_values['caixas'])->pluck('number')->sort()->values()->all());
    }

    public function test_alteracao_registra_antes_e_depois(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::create(['name' => 'Velho']);
        $this->actingAs($admin)->put(route('exchange-control.suppliers.update', $supplier), ['name' => 'Novo']);

        $log = ActivityLog::where('action', 'alterou')->first();
        $this->assertSame(['name' => 'Velho'], $log->old_values);
        $this->assertSame(['name' => 'Novo'], $log->new_values);
    }

    public function test_so_admin_ve_o_log(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'encarregado']))->get(route('activity-log.index'))->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'employee']))->get(route('activity-log.index'))->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'admin']))->get(route('activity-log.index'))->assertOk();
    }
}
