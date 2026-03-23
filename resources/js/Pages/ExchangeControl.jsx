import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Dialog, Transition } from '@headlessui/react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Fragment, useMemo, useRef, useState } from 'react';

export default function ExchangeControl() {
    const { suppliers: suppliersPagination = {} } = usePage().props;
    const suppliers = suppliersPagination.data ?? [];
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [boxesModalOpen, setBoxesModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedSupplierId, setSelectedSupplierId] = useState(null);
    const [expandedSupplierId, setExpandedSupplierId] = useState(null);
    const [newBoxNumber, setNewBoxNumber] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResult, setSearchResult] = useState({ suppliers: [], eanMatch: null });
    const [hasSearched, setHasSearched] = useState(false);
    const [searchError, setSearchError] = useState('');
    const supplierRowRefs = useRef({});
    const perPage = Number(suppliersPagination.per_page ?? 12);
    const currentPage = Number(suppliersPagination.current_page ?? 1);
    const lastPage = Number(suppliersPagination.last_page ?? 1);

    const createForm = useForm({
        name: '',
        boxes: '',
    });

    const editForm = useForm({
        name: '',
    });

    const selectedSupplier =
        suppliers.find((supplier) => supplier.id === selectedSupplierId) ||
        searchResult.suppliers.find((supplier) => supplier.id === selectedSupplierId) ||
        (searchResult.eanMatch?.linked_supplier?.id === selectedSupplierId
            ? searchResult.eanMatch.linked_supplier
            : null);

    const focusSupplier = (supplierId) => {
        setExpandedSupplierId(supplierId);
        setSelectedSupplierId(supplierId);
        setTimeout(() => {
            supplierRowRefs.current[supplierId]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }, 120);
    };

    const openCreateModal = () => {
        createForm.reset();
        createForm.clearErrors();
        setCreateModalOpen(true);
    };

    const openEditModal = (supplier) => {
        setSelectedSupplierId(supplier.id);
        editForm.setData('name', supplier.name);
        editForm.clearErrors();
        setEditModalOpen(true);
    };

    const openBoxesModal = (supplier) => {
        setSelectedSupplierId(supplier.id);
        setNewBoxNumber('');
        setBoxesModalOpen(true);
    };

    const submitSupplier = (event) => {
        event.preventDefault();
        createForm.post(route('exchange-control.suppliers.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const submitSupplierEdit = (event) => {
        event.preventDefault();
        if (!selectedSupplier) return;

        editForm.put(route('exchange-control.suppliers.update', selectedSupplier.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditModalOpen(false);
                setSelectedSupplierId(null);
            },
        });
    };

    const submitBox = (event) => {
        event.preventDefault();
        if (!selectedSupplier) return;

        const boxNumber = newBoxNumber.trim();

        if (!boxNumber) return;

        router.post(
            route('exchange-control.boxes.store', selectedSupplier.id),
            { number: boxNumber },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewBoxNumber('');
                },
            },
        );
    };

    const removeSupplier = (supplier) => {
        setSelectedSupplierId(supplier.id);
        setDeleteModalOpen(true);
    };

    const confirmRemoveSupplier = () => {
        if (!selectedSupplier) return;

        router.delete(route('exchange-control.suppliers.destroy', selectedSupplier.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteModalOpen(false);
                setSelectedSupplierId(null);
            },
        });
    };

    const removeBox = (boxId) => {
        router.delete(route('exchange-control.boxes.destroy', boxId), {
            preserveScroll: true,
        });
    };

    const goToPage = (url) => {
        if (!url) return;
        router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    const changePerPage = (event) => {
        const selected = Number(event.target.value);
        router.get(
            route('exchange-control.index'),
            { per_page: selected, page: 1 },
            { preserveState: true, preserveScroll: true },
        );
    };

    const compactPages = useMemo(() => {
        if (lastPage <= 7) {
            return Array.from({ length: lastPage }, (_, index) => index + 1);
        }

        const pages = [1];
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(lastPage - 1, currentPage + 1);

        if (start > 2) pages.push('...');
        for (let page = start; page <= end; page++) pages.push(page);
        if (end < lastPage - 1) pages.push('...');
        pages.push(lastPage);

        return pages;
    }, [currentPage, lastPage]);

    const handleSearch = async (event) => {
        event.preventDefault();
        const query = searchTerm.trim();
        if (!query) return;

        setSearchLoading(true);
        setSearchError('');
        try {
            const response = await fetch(
                route('exchange-control.search', { q: query }),
                {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                },
            );
            const payloadText = await response.text();
            const payload = payloadText ? JSON.parse(payloadText) : {};
            if (!response.ok) {
                setSearchResult({ suppliers: [], eanMatch: null });
                setHasSearched(true);
                setSearchError(
                    payload?.error ||
                        'Nao foi possivel concluir a busca no momento.',
                );
                return;
            }
            setSearchResult(payload);
            setHasSearched(true);
        } catch (_error) {
            setSearchResult({ suppliers: [], eanMatch: null });
            setHasSearched(true);
            setSearchError('Erro ao comunicar com o servidor na busca.');
        } finally {
            setSearchLoading(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Controle de Troca
                </h2>
            }
        >
            <Head title="Controle de Troca" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Gestão de fornecedores
                            </h3>
                            <p className="text-sm text-gray-600">
                                Organize rapidamente as caixas de cada fornecedor.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-indigo-700"
                        >
                            + Novo fornecedor
                        </button>
                    </div>
                    <div className="mt-4">
                        <form onSubmit={handleSearch} className="rounded-xl border border-white/70 bg-white/90 p-3 shadow-sm">
                            <p className="mb-2 text-sm font-semibold text-gray-800">
                                Buscar por fornecedor ou EAN
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Ex.: Nestle ou 7898256300790"
                                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                                <button
                                    type="submit"
                                    disabled={searchLoading}
                                    className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {searchLoading ? 'Buscando...' : 'Buscar'}
                                </button>
                            </div>
                        </form>
                    </div>
                    {hasSearched && (
                        <div className="mt-3 rounded-xl border border-indigo-100 bg-white/95 p-3 shadow-sm">
                            <p className="mb-2 text-sm font-semibold text-gray-800">Resultado da busca</p>
                            {searchError && (
                                <p className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-sm text-rose-700">
                                    {searchError}
                                </p>
                            )}
                            {searchResult.eanMatch ? (
                                <div className="mb-2 rounded-lg border border-indigo-100 bg-indigo-50/70 p-2.5 text-sm">
                                    <p>
                                        EAN <strong>{searchResult.eanMatch.ean}</strong> pertence a{' '}
                                        <strong>{searchResult.eanMatch.supplier_name}</strong>.
                                    </p>
                                    {searchResult.eanMatch.linked_supplier ? (
                                        <button
                                            type="button"
                                            onClick={() => focusSupplier(searchResult.eanMatch.linked_supplier.id)}
                                            className="mt-1 text-indigo-700 underline underline-offset-2"
                                        >
                                            Abrir fornecedor cadastrado
                                        </button>
                                    ) : (
                                        <p className="mt-1 text-xs text-amber-700">
                                            Este fornecedor ainda nao esta cadastrado na lista de fornecedores.
                                        </p>
                                    )}
                                </div>
                            ) : null}

                            {searchResult.suppliers?.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {searchResult.suppliers.map((supplier) => (
                                        <button
                                            key={`search-${supplier.id}`}
                                            type="button"
                                            onClick={() => focusSupplier(supplier.id)}
                                            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                                        >
                                            {supplier.name}
                                        </button>
                                    ))}
                                </div>
                            ) : !searchResult.eanMatch ? (
                                <p className="text-sm text-gray-600">Nenhum resultado encontrado.</p>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="rounded-xl bg-white p-4 shadow sm:p-8">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-lg font-bold">Fornecedores e caixas</h3>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            Itens por pagina
                            <select
                                value={perPage}
                                onChange={changePerPage}
                                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </label>
                    </div>

                    {suppliers.length === 0 ? (
                        <p className="text-gray-500">
                            Nenhum fornecedor cadastrado.
                        </p>
                    ) : (
                        <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr className="border-b text-left text-sm uppercase tracking-wide text-gray-500">
                                        <th className="px-4 py-3">Fornecedor</th>
                                        <th className="px-4 py-3">Qtd. Caixas</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suppliers.map((supplier) => (
                                        <Fragment key={supplier.id}>
                                            <tr
                                                ref={(element) => {
                                                    supplierRowRefs.current[supplier.id] = element;
                                                }}
                                                className="group cursor-pointer border-b transition hover:bg-indigo-50/40"
                                                onClick={() =>
                                                    setExpandedSupplierId((current) =>
                                                        current === supplier.id ? null : supplier.id,
                                                    )
                                                }
                                            >
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    <span className="inline-flex items-center gap-2">
                                                        <svg
                                                            className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${
                                                                expandedSupplierId === supplier.id ? 'rotate-90' : ''
                                                            }`}
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <path d="m9 18 6-6-6-6" />
                                                        </svg>
                                                        {supplier.name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                                        {supplier.boxes.length}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                openBoxesModal(supplier);
                                                            }}
                                                            className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100"
                                                            title="Gerenciar caixas"
                                                        >
                                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M12 5v14M5 12h14" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                openEditModal(supplier);
                                                            }}
                                                            className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100"
                                                            title="Editar fornecedor"
                                                        >
                                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M12 20h9" />
                                                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                removeSupplier(supplier);
                                                            }}
                                                            className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100"
                                                            title="Excluir fornecedor"
                                                        >
                                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M3 6h18" />
                                                                <path d="M8 6V4h8v2" />
                                                                <path d="M19 6l-1 14H6L5 6" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="border-b bg-gray-50/60">
                                                <td colSpan={3} className="p-0">
                                                    <Transition
                                                        show={expandedSupplierId === supplier.id}
                                                        enter="transition-all duration-300 ease-out"
                                                        enterFrom="max-h-0 opacity-0"
                                                        enterTo="max-h-40 opacity-100"
                                                        leave="transition-all duration-200 ease-in"
                                                        leaveFrom="max-h-40 opacity-100"
                                                        leaveTo="max-h-0 opacity-0"
                                                    >
                                                        <div className="overflow-hidden px-4 py-3">
                                                            {supplier.boxes.length === 0 ? (
                                                                <p className="text-sm text-gray-500">
                                                                    Nenhuma caixa cadastrada para este fornecedor.
                                                                </p>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {supplier.boxes.map((box) => (
                                                                        <span
                                                                            key={box.id}
                                                                            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
                                                                        >
                                                                            Caixa {box.number}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Transition>
                                                </td>
                                            </tr>
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="space-y-3 md:hidden">
                            {suppliers.map((supplier) => (
                                <div
                                    key={`mobile-${supplier.id}`}
                                    ref={(element) => {
                                        supplierRowRefs.current[supplier.id] = element;
                                    }}
                                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                                >
                                    <button
                                        type="button"
                                        className="w-full px-4 py-3 text-left transition active:bg-gray-50"
                                        onClick={() =>
                                            setExpandedSupplierId((current) =>
                                                current === supplier.id ? null : supplier.id,
                                            )
                                        }
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Fornecedor</p>
                                                <p className="font-semibold text-gray-900">{supplier.name}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                                    {supplier.boxes.length} caixas
                                                </span>
                                                <svg
                                                    className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${
                                                        expandedSupplierId === supplier.id ? 'rotate-90' : ''
                                                    }`}
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="m9 18 6-6-6-6" />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>

                                    <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                                        <div className="mb-3 flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openBoxesModal(supplier)}
                                                className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 transition active:scale-95"
                                                title="Gerenciar caixas"
                                            >
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M12 5v14M5 12h14" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(supplier)}
                                                className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 transition active:scale-95"
                                                title="Editar fornecedor"
                                            >
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M12 20h9" />
                                                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeSupplier(supplier)}
                                                className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 transition active:scale-95"
                                                title="Excluir fornecedor"
                                            >
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 6h18" />
                                                    <path d="M8 6V4h8v2" />
                                                    <path d="M19 6l-1 14H6L5 6" />
                                                </svg>
                                            </button>
                                        </div>

                                        <Transition
                                            show={expandedSupplierId === supplier.id}
                                            enter="transition-all duration-300 ease-out"
                                            enterFrom="max-h-0 opacity-0"
                                            enterTo="max-h-40 opacity-100"
                                            leave="transition-all duration-200 ease-in"
                                            leaveFrom="max-h-40 opacity-100"
                                            leaveTo="max-h-0 opacity-0"
                                        >
                                            <div className="overflow-hidden">
                                                {supplier.boxes.length === 0 ? (
                                                    <p className="text-sm text-gray-500">
                                                        Nenhuma caixa cadastrada para este fornecedor.
                                                    </p>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {supplier.boxes.map((box) => (
                                                            <span
                                                                key={`mobile-box-${box.id}`}
                                                                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
                                                            >
                                                                Caixa {box.number}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </Transition>
                                    </div>
                                </div>
                            ))}
                        </div>
                        </>
                    )}
                    {lastPage > 1 && (
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => goToPage(suppliersPagination.prev_page_url)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            {compactPages.map((item, index) => (
                                item === '...' ? (
                                    <span key={`ellipsis-${index}`} className="px-1 text-sm text-gray-500">
                                        ...
                                    </span>
                                ) : (
                                <button
                                    key={`page-link-${item}`}
                                    type="button"
                                    onClick={() =>
                                        goToPage(
                                            route('exchange-control.index', {
                                                page: item,
                                                per_page: perPage,
                                            }),
                                        )
                                    }
                                    className={`rounded-lg px-3 py-1.5 text-sm transition ${
                                        item === currentPage
                                            ? 'bg-indigo-600 text-white'
                                            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {item}
                                </button>
                                )
                            ))}
                            <button
                                type="button"
                                disabled={currentPage === lastPage}
                                onClick={() => goToPage(suppliersPagination.next_page_url)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Proxima
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Transition appear show={createModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={setCreateModalOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                                    <Dialog.Title className="text-lg font-bold text-gray-900">
                                        Novo fornecedor
                                    </Dialog.Title>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Informe o nome e as caixas iniciais (separadas por vírgula, ponto e vírgula ou quebra de linha).
                                    </p>
                                    <form onSubmit={submitSupplier} className="mt-5 space-y-4">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                                Nome
                                            </label>
                                            <input
                                                type="text"
                                                value={createForm.data.name}
                                                onChange={(event) =>
                                                    createForm.setData('name', event.target.value)
                                                }
                                                placeholder="Ex.: Nestle"
                                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                                required
                                            />
                                            {createForm.errors.name && (
                                                <p className="mt-1 text-sm text-red-500">{createForm.errors.name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                                Caixas iniciais (opcional)
                                            </label>
                                            <textarea
                                                value={createForm.data.boxes}
                                                onChange={(event) =>
                                                    createForm.setData('boxes', event.target.value)
                                                }
                                                rows={4}
                                                placeholder="1, 2, 3, 4, 5"
                                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setCreateModalOpen(false)}
                                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={createForm.processing}
                                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {createForm.processing ? 'Salvando...' : 'Criar fornecedor'}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={editModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={(value) => {
                    setEditModalOpen(value);
                    if (!value) setSelectedSupplierId(null);
                }}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                                    <Dialog.Title className="text-lg font-bold text-gray-900">
                                        Editar fornecedor
                                    </Dialog.Title>
                                    <form onSubmit={submitSupplierEdit} className="mt-5 space-y-4">
                                        <input
                                            type="text"
                                            value={editForm.data.name}
                                            onChange={(event) =>
                                                editForm.setData('name', event.target.value)
                                            }
                                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            required
                                        />
                                        {editForm.errors.name && (
                                            <p className="text-sm text-red-500">{editForm.errors.name}</p>
                                        )}
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditModalOpen(false);
                                                    setSelectedSupplierId(null);
                                                }}
                                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={editForm.processing}
                                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {editForm.processing ? 'Salvando...' : 'Salvar alterações'}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={boxesModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={(value) => {
                    setBoxesModalOpen(value);
                    if (!value) setSelectedSupplierId(null);
                }}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                                    <Dialog.Title className="text-lg font-bold text-gray-900">
                                        Gerenciar caixas {selectedSupplier ? `- ${selectedSupplier.name}` : ''}
                                    </Dialog.Title>

                                    <form onSubmit={submitBox} className="mt-4 flex flex-wrap items-center gap-2">
                                        <input
                                            type="text"
                                            value={newBoxNumber}
                                            onChange={(event) => setNewBoxNumber(event.target.value)}
                                            placeholder="Número da caixa"
                                            className="flex-1 rounded-lg border border-gray-300 p-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                        >
                                            Adicionar
                                        </button>
                                    </form>

                                    <div className="mt-5 flex max-h-72 flex-wrap gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                                        {selectedSupplier?.boxes?.length ? (
                                            selectedSupplier.boxes.map((box) => (
                                                <div
                                                    key={box.id}
                                                    className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
                                                >
                                                    <span>Caixa {box.number}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeBox(box.id)}
                                                        className="font-semibold text-rose-600 transition hover:text-rose-700"
                                                    >
                                                        x
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500">Nenhuma caixa cadastrada.</p>
                                        )}
                                    </div>

                                    <div className="mt-5 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setBoxesModalOpen(false);
                                                setSelectedSupplierId(null);
                                            }}
                                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                        >
                                            Fechar
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={deleteModalOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={(value) => {
                        setDeleteModalOpen(value);
                        if (!value) setSelectedSupplierId(null);
                    }}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                                    <Dialog.Title className="text-lg font-bold text-gray-900">
                                        Confirmar exclusão
                                    </Dialog.Title>
                                    <p className="mt-2 text-sm text-gray-600">
                                        Deseja realmente excluir o fornecedor{' '}
                                        <span className="font-semibold text-gray-800">
                                            {selectedSupplier?.name}
                                        </span>
                                        ? Todas as caixas deste fornecedor também serão removidas.
                                    </p>

                                    <div className="mt-6 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeleteModalOpen(false);
                                                setSelectedSupplierId(null);
                                            }}
                                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={confirmRemoveSupplier}
                                            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                                        >
                                            Excluir fornecedor
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </AuthenticatedLayout>
    );
}
