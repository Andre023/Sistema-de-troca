<?php

namespace App\Models\Concerns;

use App\Models\ActivityLog;

/**
 * Registra no log de atividades toda criação, alteração e exclusão do model.
 */
trait LogsActivity
{
    protected ?array $activityDeletedSnapshot = null;

    public static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            ActivityLog::record('criou', $model, null, $model->activityValues($model->getAttributes()));
        });

        static::updated(function ($model) {
            $changes = $model->activityValues($model->getChanges());
            if (empty($changes)) {
                return;
            }
            $old = array_intersect_key($model->activityValues($model->getOriginal()), $changes);
            ActivityLog::record('alterou', $model, $old, $changes);
        });

        // Captura os dados antes de apagar (inclui dados relacionados, ex.: caixas do fornecedor)
        static::deleting(function ($model) {
            $model->activityDeletedSnapshot = $model->activityValues($model->getAttributes()) + $model->activityExtraOnDelete();
        });

        static::deleted(function ($model) {
            ActivityLog::record('excluiu', $model, $model->activityDeletedSnapshot, null);
        });
    }

    protected function activityValues(array $attributes): array
    {
        return collect($attributes)
            ->except(['created_at', 'updated_at', 'password', 'remember_token'])
            ->all();
    }

    protected function activityExtraOnDelete(): array
    {
        return [];
    }
}
