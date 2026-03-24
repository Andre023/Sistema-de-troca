import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Dashboard() {
    const { auth, products } = usePage().props;
    const user = auth.user;

    // Estados para os Modais
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Formulário de Criação
    const createForm = useForm({
        name: '', description: '', image: null,
    });

    // Formulário de Edição
    const editForm = useForm({
        name: '', description: '', image: null,
    });

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('products.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setIsCreateModalOpen(false);
            }
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.post(route('products.update', editingProduct.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setEditingProduct(null)
        });
    };

    const deleteProduct = (id) => {
        if (confirm('Excluir este item permanentemente?')) {
            router.delete(route('products.destroy', id), { preserveScroll: true });
        }
    };

    const updatePrice = (id) => {
        const priceValue = document.getElementById(`price-${id}`).value;
        if (priceValue) router.put(route('products.updatePrice', id), { price: priceValue });
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-bold text-2xl text-blue-900 leading-tight">📦 Bazar Operacional</h2>}>
            <Head title="Bazar" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Cabeçalho com Botão de Adicionar (Apenas funcionários) */}
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-medium text-gray-600">Catálogo de Itens</h3>
                    {user.role === 'employee' && (
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            Novo Produto
                        </button>
                    )}
                </div>

                {/* Grid de Produtos Moderno */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.data.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 text-lg">Nenhum item registrado no momento.</p>
                        </div>
                    ) : (
                        products.data.map((product) => (
                            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 group">
                                {/* Imagem com Badge de Status */}
                                <div className="relative">
                                    <img 
                                        src={`/storage/${product.image_path}`} 
                                        alt={product.name} 
                                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${
                                            product.status === 'priced' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {product.status === 'priced' ? 'Precificado' : 'Pendente'}
                                        </span>
                                    </div>

                                    {/* Ações Flutuantes (Admin ou Dono) */}
                                    {(user.role === 'admin' || user.id === product.user_id) && (
                                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingProduct(product); editForm.setData({ name: product.name, description: product.description, image: null }); }} className="bg-white/90 p-2 rounded-full text-yellow-600 hover:bg-yellow-500 hover:text-white transition shadow-lg">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => deleteProduct(product.id)} className="bg-white/90 p-2 rounded-full text-red-600 hover:bg-red-500 hover:text-white transition shadow-lg">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Conteúdo do Card */}
                                <div className="p-5">
                                    <h4 className="font-bold text-gray-800 text-lg mb-1 truncate">{product.name}</h4>
                                    <p className="text-gray-500 text-sm h-10 line-clamp-2 mb-4 leading-relaxed">{product.description || 'Sem descrição.'}</p>
                                    
                                    <div className="pt-4 border-t border-gray-50">
                                        {user.role === 'admin' ? (
                                            <div className="flex gap-2">
                                                <input type="number" step="0.01" id={`price-${product.id}`} defaultValue={product.price} className="w-full border-gray-200 rounded-lg text-sm focus:ring-blue-500" placeholder="R$ 0,00" />
                                                <button onClick={() => updatePrice(product.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition">Definir</button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400 font-medium">Preço sugerido:</span>
                                                <span className={`text-xl font-black ${product.price ? 'text-green-600' : 'text-gray-300 italic text-sm'}`}>
                                                    {product.price ? `R$ ${product.price}` : 'Aguardando...'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Paginação Estilizada */}
                <div className="mt-12 flex flex-col items-center">
                    <span className="text-sm text-gray-500 mb-4 text-center">
                        Mostrando <b>{products.from || 0}</b> até <b>{products.to || 0}</b> de <b>{products.total}</b> produtos
                    </span>
                    <div className="inline-flex shadow-sm rounded-xl overflow-hidden">
                        {products.links.map((link, index) => {
                            // Se não houver URL (link.url é null), renderizamos um <span> em vez de um <Link>
                            if (!link.url) {
                                return (
                                    <span
                                        key={index}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className="px-4 py-2 text-sm font-medium border bg-gray-50 text-gray-400 cursor-not-allowed"
                                    />
                                );
                            }

                            // Se houver URL, usamos o componente Link normalmente
                            return (
                                <Link
                                    key={index}
                                    href={link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-4 py-2 text-sm font-medium border transition-colors ${
                                        link.active 
                                        ? 'bg-blue-600 text-white border-blue-600 z-10' 
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                                    preserveScroll
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- MODAL DE CRIAÇÃO --- */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
                        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-xl">Novo Item Danificado</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-white/80 hover:text-white transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={submitCreate} className="p-6 space-y-5">
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:bg-gray-50 transition cursor-pointer relative">
                                <input type="file" accept="image/*" capture="environment" onChange={(e) => createForm.setData('image', e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                {createForm.data.image ? (
                                    <p className="text-green-600 font-bold flex items-center justify-center gap-2 italic">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                        Foto pronta! Clique para trocar.
                                    </p>
                                ) : (
                                    <div className="text-gray-400">
                                        <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Tirar Foto ou Abrir Galeria
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Produto</label>
                                <input type="text" value={createForm.data.name} onChange={(e) => createForm.setData('name', e.target.value)} className="w-full border-gray-200 rounded-xl focus:ring-blue-500" placeholder="Ex: Cadeira Quebrada" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição do Dano</label>
                                <textarea value={createForm.data.description} onChange={(e) => createForm.setData('description', e.target.value)} className="w-full border-gray-200 rounded-xl focus:ring-blue-500" rows="3" placeholder="Detalhes do problema..." />
                            </div>
                            <button type="submit" disabled={createForm.processing} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-xl transition-all active:scale-95 disabled:opacity-50">
                                {createForm.processing ? 'Sincronizando...' : 'Finalizar Registro'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL DE EDIÇÃO --- */}
            {editingProduct && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-yellow-500 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-xl">Editar Produto</h3>
                            <button onClick={() => setEditingProduct(null)} className="text-white/80 hover:text-white transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={submitEdit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Substituir Foto (Opcional)</label>
                                <input type="file" accept="image/*" onChange={(e) => editForm.setData('image', e.target.files[0])} className="w-full text-sm text-gray-500 border rounded-xl p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
                                <input type="text" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} className="w-full border-gray-200 rounded-xl focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                                <textarea value={editForm.data.description} onChange={(e) => editForm.setData('description', e.target.value)} className="w-full border-gray-200 rounded-xl focus:ring-blue-500" rows="3" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancelar</button>
                                <button type="submit" disabled={editForm.processing} className="flex-2 bg-yellow-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-yellow-600 shadow-lg transition active:scale-95 disabled:opacity-50">
                                    {editForm.processing ? 'Atualizando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}