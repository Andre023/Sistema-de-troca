import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Fragment, useState } from 'react';

const ACTION_STYLES = {
    criou: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    alterou: 'bg-amber-50 text-amber-700 border-amber-200',
    excluiu: 'bg-rose-50 text-rose-700 border-rose-200',
};

const FIELD_LABELS = {
    name: 'Nome',
    number: 'Número',
    observation: 'Observação',
    supplier_id: 'Fornecedor (id)',
    user_id: 'Cadastrado por (id)',
    priced_by: 'Avaliado por (id)',
    category: 'Categoria',
    description: 'Descrição',
    image_path: 'Imagem',
    price: 'Preço',
    status: 'Status',
    caixas: 'Caixas',
};

function formatValue(value) {
    if (value === null || value === undefined || value === '') return '(vazio)';
    if (Array.isArray(value)) {
        if (value.length === 0) return '(nenhuma)';
        return value.map((item) => (typeof item === 'object' ? (item.number ? `Caixa ${item.number}${item.observation ? ` — ${item.observation}` : ''}` : JSON.stringify(item)) : String(item))).join(', ');
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function Details({ log }) {
    const keys = Array.from(new Set([...Object.keys(log.old_values ?? {}), ...Object.keys(log.new_values ?? {})])).filter((key) => key !== 'id');
    if (keys.length === 0) return <p className="text-gray-500">Sem detalhes.</p>;

    return (
        <table className="w-full text-xs">
            <thead>
                <tr className="text-left text-gray-500">
                    <th className="py-1 pr-3 font-medium">Campo</th>
                    {log.old_values && <th className="py-1 pr-3 font-medium">{log.action === 'excluiu' ? 'Dados apagados' : 'Antes'}</th>}
                    {log.new_values && <th className="py-1 font-medium">{log.action === 'criou' ? 'Dados' : 'Depois'}</th>}
                </tr>
            </thead>
            <tbody>
                {keys.map((key) => (
                    <tr key={key} className="border-t border-gray-100 align-top">
                        <td className="py-1 pr-3 font-medium text-gray-700">{FIELD_LABELS[key] ?? key}</td>
                        {log.old_values && <td className="py-1 pr-3 break-words text-gray-600">{formatValue(log.old_values[key])}</td>}
                        {log.new_values && <td className="py-1 break-words text-gray-900">{formatValue(log.new_values[key])}</td>}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function ActivityLog() {
    const { logs, filters, users } = usePage().props;
    const [expanded, setExpanded] = useState(null);
    const [search, setSearch] = useState(filters.q ?? '');

    const applyFilter = (changes) => {
        router.get(route('activity-log.index'), { ...filters, ...changes }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const selectClass = 'rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500';

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Log de atividades</h2>}>
            <Head title="Log de atividades" />

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="mb-3 text-sm text-gray-600">Tudo o que é criado, alterado ou excluído em fornecedores, caixas e produtos fica registrado aqui, com quem fez e quando. Clique numa linha para ver os dados.</p>
                    <form
                        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
                        onSubmit={(e) => { e.preventDefault(); applyFilter({ q: search, page: 1 }); }}
                    >
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar (ex.: nº da caixa, fornecedor, produto)" className={`${selectClass} flex-1 min-w-0`} />
                        <select value={filters.action ?? ''} onChange={(e) => applyFilter({ action: e.target.value || null, page: 1 })} className={selectClass}>
                            <option value="">Todas as ações</option>
                            <option value="criou">Criou</option>
                            <option value="alterou">Alterou</option>
                            <option value="excluiu">Excluiu</option>
                        </select>
                        <select value={filters.type ?? ''} onChange={(e) => applyFilter({ type: e.target.value || null, page: 1 })} className={selectClass}>
                            <option value="">Tudo</option>
                            <option value="Fornecedor">Fornecedores</option>
                            <option value="Caixa">Caixas</option>
                            <option value="Produto">Produtos</option>
                        </select>
                        <select value={filters.user ?? ''} onChange={(e) => applyFilter({ user: e.target.value || null, page: 1 })} className={selectClass}>
                            <option value="">Todos os usuários</option>
                            {users.map((u) => <option key={u.user_id} value={u.user_id}>{u.user_name}</option>)}
                        </select>
                        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">Buscar</button>
                    </form>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    {logs.data.length === 0 ? (
                        <p className="p-6 text-center text-sm text-gray-500">Nenhuma atividade registrada.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {logs.data.map((log) => (
                                <Fragment key={log.id}>
                                    <li>
                                        <button type="button" onClick={() => setExpanded(expanded === log.id ? null : log.id)} className="flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-gray-50 sm:flex-row sm:items-center sm:gap-4">
                                            <span className="shrink-0 text-xs tabular-nums text-gray-500 sm:w-36">{log.created_at}</span>
                                            <span className="shrink-0 text-sm font-medium text-gray-800 sm:w-40 truncate">{log.user_name}</span>
                                            <span className={`w-fit shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${ACTION_STYLES[log.action] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>{log.action}</span>
                                            <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{log.description ?? `${log.subject_type} #${log.subject_id}`}</span>
                                        </button>
                                        {expanded === log.id && (
                                            <div className="bg-gray-50 px-4 pb-4 pt-2"><Details log={log} /></div>
                                        )}
                                    </li>
                                </Fragment>
                            ))}
                        </ul>
                    )}
                </div>

                {logs.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
                        {logs.prev_page_url ? <Link href={logs.prev_page_url} preserveScroll className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50">Anterior</Link> : <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-400">Anterior</span>}
                        <span className="text-gray-600">Página {logs.current_page} de {logs.last_page}</span>
                        {logs.next_page_url ? <Link href={logs.next_page_url} preserveScroll className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50">Próxima</Link> : <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-400">Próxima</span>}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
