<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Apenas administradores podem ver o log.');

        $filters = [
            'action' => $request->query('action'),
            'type' => $request->query('type'),
            'user' => $request->query('user'),
            'q' => trim((string) $request->query('q', '')),
        ];

        $logs = ActivityLog::query()
            ->when($filters['action'], fn ($q, $v) => $q->where('action', $v))
            ->when($filters['type'], fn ($q, $v) => $q->where('subject_type', $v))
            ->when($filters['user'], fn ($q, $v) => $q->where('user_id', $v))
            ->when($filters['q'] !== '', fn ($q) => $q->where('description', 'like', '%' . $filters['q'] . '%'))
            ->latest('id')
            ->paginate(30)
            ->withQueryString()
            ->through(fn ($log) => [
                'id' => $log->id,
                'user_name' => $log->user_name,
                'action' => $log->action,
                'subject_type' => $log->subject_type,
                'subject_id' => $log->subject_id,
                'description' => $log->description,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'created_at' => $log->created_at?->timezone('America/Sao_Paulo')->format('d/m/Y H:i:s'),
            ]);

        return Inertia::render('ActivityLog', [
            'logs' => $logs,
            'filters' => $filters,
            'users' => ActivityLog::query()->whereNotNull('user_id')->select('user_id', 'user_name')->distinct()->orderBy('user_name')->get(),
        ]);
    }
}
