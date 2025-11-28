import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CiSearch, CiSquarePlus, CiEdit, CiTrash, CiBoxList, CiDollar, CiFilter } from "react-icons/ci";

// Función para simular una imagen forzada para el producto (placeholder)
const getForcedImageUrl = (id) => `https://placehold.co/50x50/2563eb/ffffff?text=P-${id}`;

const ProductsListScreen = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); // Para el filtro de categorías
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState(''); // Estado para filtrar
    
    const PRODUCT_LIMIT = 50; 

    // =========================================================================
    // I. CARGA DE DATOS (Productos y Categorías)
    // =========================================================================
    
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // 1. Cargar Categorías (necesarias para el filtro y la referencia)
            const categoriesResponse = await axios.get(`/categories?skip=0&limit=100`);
            const fetchedCategories = categoriesResponse.data;
            setCategories(fetchedCategories);

            // 2. Cargar Productos
            let url = `/products?skip=0&limit=${PRODUCT_LIMIT}`;
            if (selectedCategoryId) {
                // Añadir filtro por categoría si está seleccionada (asumiendo que la API lo soporta)
                url += `&category_id=${selectedCategoryId}`;
            }

            const productsResponse = await axios.get(url);
            
            // Adjuntar el nombre de la categoría al producto para mostrarlo en la tabla
            const categoryMap = fetchedCategories.reduce((acc, cat) => {
                acc[cat.id_key] = cat.name;
                return acc;
            }, {});
            
            const enrichedProducts = productsResponse.data.map(p => ({
                ...p,
                categoryName: categoryMap[p.category_id] || 'Desconocida',
                imageUrl: getForcedImageUrl(p.id_key)
            }));
            
            // Ordenar por ID para consistencia
            const sortedProducts = enrichedProducts.sort((a, b) => a.id_key - b.id_key);
            setProducts(sortedProducts);
            
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Error al cargar productos o categorías. Verifique la conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    }, [selectedCategoryId]); // Dependencia del filtro

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // =========================================================================
    // II. LÓGICA DE FILTRADO (Lado del Cliente)
    // =========================================================================
    
    // Filtrado local por ID o nombre
    const filteredProducts = products.filter(product => {
        const term = searchTerm.toLowerCase();
        return (
            product.name?.toLowerCase().includes(term) ||
            String(product.id_key).includes(term)
        );
    });

    // =========================================================================
    // III. HANDLERS DE ACCIONES CRUD
    // =========================================================================
    
    // Redirige al formulario de creación
    const handleCreate = () => {
        navigate('/admin/products/new');
    };
    
    // Redirige al formulario de edición
    const handleEdit = (productId, e) => {
        e.stopPropagation(); 
        navigate(`/admin/products/edit/${productId}`);
    };
    
    // Elimina un producto
    const handleDelete = async (productId, e) => {
        e.stopPropagation(); 
        
        const confirmation = window.confirm(`¿Estás seguro de que quieres eliminar el Producto ID ${productId}? Esta acción es irreversible.`);
        
        if (confirmation) {
            try {
                // DELETE /products/{id}
                await axios.delete(`/products/${productId}`);
                alert(`Producto ID ${productId} eliminado con éxito.`);
                fetchProducts(); // Recargar la lista
            } catch (err) {
                console.error("Error al eliminar producto:", err);
                let message = "Error al eliminar el producto.";
                if (err.response?.status === 400 && err.response.data?.detail?.includes('ForeignKey violation')) {
                    message = "ERROR: No se puede eliminar el producto porque está asociado a pedidos ya existentes.";
                }
                alert(message);
                setError(message);
            }
        }
    };


    // Estilos CSS estándar
    const styles = {
        container: { padding: '30px', maxWidth: '100%', fontFamily: 'Arial, sans-serif' },
        header: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px', color: '#1f2937' },
        topControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
        controlsLeft: { display: 'flex', gap: '15px', flexGrow: 1 },
        searchContainer: { display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', flexGrow: 1 },
        searchInput: { flexGrow: 1, padding: '5px 10px', border: 'none', fontSize: '1rem', background: 'transparent' },
        filterSelect: { padding: '8px 10px', borderRadius: '5px', border: '1px solid #d1d5db', fontSize: '1rem', backgroundColor: 'white', display: 'flex', alignItems: 'center' },
        createButton: { display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
        tableContainer: { overflowX: 'auto', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', borderRadius: '8px' },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' },
        th: { padding: '12px 15px', textAlign: 'left', backgroundColor: '#e5e7eb', borderBottom: '2px solid #d1d5db', color: '#374151', fontSize: '0.9rem', textTransform: 'uppercase' },
        td: { padding: '12px 15px', borderBottom: '1px solid #f3f4f6', fontSize: '1rem', color: '#4b5563' },
        tdActions: { width: '100px', textAlign: 'center' },
        actionButton: (color) => ({
            backgroundColor: color,
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginLeft: '5px',
            transition: 'opacity 0.15s'
        }),
        loadingText: { textAlign: 'center', color: '#3b82f6', fontSize: '1.2rem', margin: '40px 0' },
        errorText: { textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin: '40px 0' },
        stockLow: { color: '#ef4444', fontWeight: 'bold' },
        stockSufficient: { color: '#10b981' },
    };

    if (loading) {
        return <div style={styles.container}><p style={styles.loadingText}>Cargando lista de productos...</p></div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Gestión de Productos ({products.length} Mostrados)</h1>

            {error && <p style={styles.errorText}>Error: {error}</p>}
            
            {/* Controles: Búsqueda, Filtro y Creación */}
            <div style={styles.topControls}>
                <div style={styles.controlsLeft}>
                    {/* Búsqueda */}
                    <div style={styles.searchContainer}>
                        <CiSearch size={20} style={{ color: '#6b7280' }} />
                        <input
                            type="text"
                            placeholder="Buscar por ID o Nombre de Producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                    
                    {/* Filtro por Categoría */}
                    <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        style={styles.filterSelect}
                        title="Filtrar por Categoría"
                    >
                        <option value="">Todas las Categorías</option>
                        {categories.map(cat => (
                            <option key={cat.id_key} value={cat.id_key}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={handleCreate} 
                    style={styles.createButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.createButton.backgroundColor}
                >
                    <CiSquarePlus size={20} />
                    Crear Nuevo
                </button>
            </div>
            
            {/* Tabla de Productos */}
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Imagen</th>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}><CiBoxList size={18} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Nombre</th>
                            <th style={styles.th}><CiFilter size={18} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Categoría</th>
                            <th style={styles.th}><CiDollar size={18} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Precio</th>
                            <th style={styles.th}>Stock</th>
                            <th style={{...styles.th, ...styles.tdActions}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <tr key={product.id_key}>
                                    <td style={styles.td}>
                                        <img 
                                            src={product.imageUrl} 
                                            alt={product.name} 
                                            style={{ width: '40px', height: '40px', borderRadius: '5px', objectFit: 'cover' }}
                                        />
                                    </td>
                                    <td style={styles.td}>{product.id_key}</td>
                                    <td style={styles.td}>{product.name}</td>
                                    <td style={styles.td}>{product.categoryName}</td>
                                    <td style={{...styles.td, fontWeight: 'bold'}}>${product.price.toFixed(2)}</td>
                                    <td style={styles.td}>
                                        <span style={product.stock <= 5 ? styles.stockLow : styles.stockSufficient}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td style={styles.tdActions}>
                                        {/* Botón Editar */}
                                        <button
                                            onClick={(e) => handleEdit(product.id_key, e)}
                                            style={styles.actionButton('#f59e0b')} // Naranja para editar
                                            title="Editar Producto"
                                            onMouseEnter={(e) => e.target.style.opacity = 0.8}
                                            onMouseLeave={(e) => e.target.style.opacity = 1}
                                        >
                                            <CiEdit size={18} />
                                        </button>
                                        
                                        {/* Botón Eliminar */}
                                        <button
                                            onClick={(e) => handleDelete(product.id_key, e)}
                                            style={styles.actionButton('#ef4444')}
                                            title="Eliminar Producto"
                                            onMouseEnter={(e) => e.target.style.opacity = 0.8}
                                            onMouseLeave={(e) => e.target.style.opacity = 1}
                                        >
                                            <CiTrash size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ ...styles.td, textAlign: 'center' }}>
                                    No se encontraron productos que coincidan con los filtros o la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {products.length >= PRODUCT_LIMIT && (
                <p style={{ marginTop: '20px', color: '#ef4444', fontWeight: 'bold' }}>
                    Solo se muestran los primeros {PRODUCT_LIMIT} productos (Límite de la API).
                </p>
            )}
        </div>
    );
};

export default ProductsListScreen;