import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';

export default function Dashboard() {
    const user = usePage().props.auth.user;
    const { products = [] } = usePage().props;

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '', description: '', image: null,
    });

    const submitProduct = (e) => {
        e.preventDefault();
        post(route('products.store'), { 
            forceFormData: true, // Obriga o sistema a entender que é um arquivo/foto
            preserveScroll: true, // Evita que a tela pule pro topo
            onSuccess: () => reset() 
        });
    };

    const updatePrice = (id) => {
        const priceValue = document.getElementById(`price-${id}`).value;
        if(priceValue) router.put(route('products.updatePrice', id), { price: priceValue });
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Painel Operacional</h2>}>
            <Head title="Dashboard" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                
                {/* ÁREA DO FUNCIONÁRIO */}
                {user.role === 'employee' && (
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <h3 className="text-lg font-bold mb-4">Registrar Produto Danificado</h3>
                        <form onSubmit={submitProduct} className="space-y-4 max-w-xl">
                            <div>
                                <label className="block text-sm font-medium">Foto</label>
                                <input type="file" accept="image/*" capture="environment" onChange={(e) => setData('image', e.target.files[0])} className="mt-1 block w-full border rounded p-2" required />
                                {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Nome</label>
                                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full border rounded p-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Detalhes</label>
                                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="mt-1 block w-full border rounded p-2" />
                            </div>
                            <button type="submit" disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                {processing ? 'Enviando...' : 'Salvar Produto'}
                            </button>
                        </form>
                    </div>
                )}

                {/* LISTA DE PRODUTOS */}
                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <h3 className="text-lg font-bold mb-4">Produtos Cadastrados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.length === 0 && <p className="text-gray-500">Nenhum produto registrado.</p>}
                        
                        {products.map((product) => (
                            <div key={product.id} className="border rounded-lg p-4 flex flex-col bg-gray-50">
                                <img src={`/storage/${product.image_path}`} alt={product.name} className="w-full h-48 object-cover rounded-md mb-4 border" />
                                <h4 className="font-bold text-lg">{product.name}</h4>
                                <p className="text-sm mb-2">{product.description}</p>
                                
                                {user.role === 'admin' ? (
                                    <div className="mt-auto flex gap-2 pt-4">
                                        <input type="number" step="0.01" id={`price-${product.id}`} defaultValue={product.price} placeholder="Preço (R$)" className="w-full border rounded p-2" />
                                        <button onClick={() => updatePrice(product.id)} className="bg-green-600 text-white px-3 py-2 rounded">Salvar</button>
                                    </div>
                                ) : (
                                    <div className="mt-auto pt-4 border-t">
                                        <p className={`font-bold ${product.price ? 'text-green-600' : 'text-orange-500'}`}>
                                            {product.price ? `R$ ${product.price}` : '⏳ Sem Preço'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}