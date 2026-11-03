<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'user_name', 'action', 'subject_type', 'subject_id',
        'description', 'old_values', 'new_values', 'ip_address',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public static function record(string $action, Model $subject, ?array $old, ?array $new): void
    {
        $user = auth()->user();

        $data = [
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'Sistema',
            'action' => $action,
            'subject_type' => method_exists($subject, 'activitySubjectType') ? $subject->activitySubjectType() : class_basename($subject),
            'subject_id' => $subject->getKey(),
            'description' => method_exists($subject, 'activityDescription') ? mb_substr($subject->activityDescription(), 0, 255) : null,
            'old_values' => $old,
            'new_values' => $new,
            'ip_address' => request()?->ip(),
        ];

        // Cópia também em arquivo (storage/logs/atividades-AAAA-MM-DD.log), caso o banco tenha problema
        try {
            Log::channel('atividades')->info("{$data['user_name']} {$action} {$data['subject_type']} #{$data['subject_id']}", $data);
        } catch (\Throwable $e) {
            report($e);
        }

        try {
            static::create($data);
        } catch (\Throwable $e) {
            report($e); // nunca impedir a operação do usuário por causa do log
        }
    }
}
