// --- INICIO DEL ARCHIVO: src\screens\AdminDashboard\ListsScreens\ProductsListScreen.jsx ---

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CiSearch, CiSquarePlus, CiEdit, CiDollar, CiFilter } from "react-icons/ci";
// <-- IMPORTAMOS EL ARCHIVO CSS -->
import './ProductsListScreen.css';

// Función para simular una imagen forzada para el producto (placeholder)
const getForcedImageUrl = (id) => `https://placehold.co/50x50/ff5722/ffffff?text=P-${id}`;

// Eliminamos las constantes de color ya que están en el CSS.
// Las interacciones de hover/onMouseLeave/onMouseEnter han sido eliminadas del JSX.

const ProductsListScreen = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); // Para el filtro de categorías
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    
    // Bandera para asegurar que la carga de categorías (Fase I) no se repita.
    const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false); 

    const PRODUCT_LIMIT = 50;
    
    // =========================================================================
    // I. CARGA DE CATEGORÍAS (Disparo Único al Montar)
    // =========================================================================

    useEffect(() => {
        // Bloqueamos la ejecución dentro del hook si ya está cargado.
        if (isCategoriesLoaded) return; 

        const fetchCategories = async () => {
            try {
                const url = `/categories?skip=0&limit=100`;
                const response = await axios.get(url);
                setCategories(response.data);
            } catch (err) {
                console.error("Error fetching categories:", err);
                setError("Error al cargar las categorías iniciales.");
            } finally {
                // Marcar como cargado (éxito o fracaso) para iniciar la carga de productos
                setIsCategoriesLoaded(true); 
            }
        };

        fetchCategories();
    // Dependencia vacía (solo se ejecuta al montar).
    }, []); 

    // =========================================================================
    // II. CARGA DE PRODUCTOS (Controlada por Filtro/isCategoriesLoaded)
    // =========================================================================

    const fetchProducts = useCallback(async () => {
        // Bloquear la ejecución si las categorías aún no se han cargado
        if (!isCategoriesLoaded) return; 

        setLoading(true); // Se inicia el loading para cada fetch de productos
        setError(null);
        
        try {
            let productsToProcess = [];
            const currentCategories = categories; // Capturar el estado actual de categorías

            
                // Si no hay filtro, usamos el listado general paginado
                const productsResponse = await axios.get(`/products?skip=0&limit=${PRODUCT_LIMIT}`);
                productsToProcess = productsResponse.data;
          
            
            // Mapear nombres de categoría 
            const categoryMap = currentCategories.reduce((acc, cat) => {
                acc[cat.id_key] = cat.name;
                return acc;
            }, {});
            
            const enrichedProducts = productsToProcess.map(p => ({
                ...p,
                categoryName: p.category?.name || categoryMap[p.category_id] || 'Desconocida',
                imageUrl: getForcedImageUrl(p.id_key)
            }));
            
            // Ordenar por ID para consistencia
            const sortedProducts = enrichedProducts.sort((a, b) => a.id_key - b.id_key);
            setProducts(sortedProducts);

        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Error al cargar productos.");
        } finally {
            setLoading(false);
        }
    }, [isCategoriesLoaded, categories]); 

    // Disparo de la función de carga de productos
    useEffect(() => {
        console.log("ejecutando fetchProducts");
        
        fetchProducts();
    }, [fetchProducts]); 

    useEffect(() => {

        const getFilteredProducts = async () => {
            if (!isCategoriesLoaded) return; 

            setLoading(true); // Se inicia el loading para cada fetch de productos
            setError(null);
            try {

                let productsToProcess = [];
                const currentCategories = categories;

                const categoriesResponse = await axios.get(`/categories/${selectedCategoryId}`);
                productsToProcess = categoriesResponse.data.products || [];


                const categoryMap = currentCategories.reduce((acc, cat) => {
                acc[cat.id_key] = cat.name;
                return acc;
            }, {});
            
            const enrichedProducts = productsToProcess.map(p => ({
                ...p,
                categoryName: p.category?.name || categoryMap[p.category_id] || 'Desconocida',
                imageUrl: getForcedImageUrl(p.id_key)
            }));
            
            // Ordenar por ID para consistencia
            const sortedProducts = enrichedProducts.sort((a, b) => a.id_key - b.id_key);
            setProducts(sortedProducts);
            } catch (error) {
                console.error("Error fetching filtered products:", err);
            setError("Error al cargar productos filtrados.");
            } finally {
                setLoading(false);
            }
        }
        getFilteredProducts()

    }, [selectedCategoryId])
    
    // =========================================================================
    // III. LÓGICA DE FILTRADO (Lado del Cliente)
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
    // IV. HANDLERS DE ACCIONES CRUD
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

    // Funciones para manejar el focus en los inputs (AHORA SOLO MANIPULAN EL ESTILO DEL BORDE)
    const handleInputFocus = (e) => { e.currentTarget.style.borderColor = '#ff5722'; };
    const handleInputBlur = (e) => { e.currentTarget.style.borderColor = '#424242'; };

    // =========================================================================
    // V. RENDERIZADO (Con Clases CSS)
    // =========================================================================

    if (loading && !isCategoriesLoaded) {
        return <div className="products-list-container"><p className="products-list-loading">Cargando lista de productos y categorías...</p></div>;
    }

    return (
        <div className="products-list-container">
            <h1 className="products-list-header">Gestión de Productos ({products.length} Mostrados)</h1>

            {error && <p className="products-list-error-box">{error}</p>}

            {/* Controles: Búsqueda, Filtro y Creación */}
            <div className="top-controls">

                <div className="controls-left">
                    {/* Búsqueda */}
                    <div className="search-container" 
                         onFocus={handleInputFocus} 
                         onBlur={handleInputBlur}>
                        <CiSearch size={20} style={{ color: '#bdbdbd' }} />

                        <input
                            type="text"
                            placeholder="Buscar por ID o Nombre de Producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>


                    {/* Filtro por Categoría */}
                    <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="filter-select"
                        title="Filtrar por Categoría"
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        disabled={loading}
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
                    className="create-button"
                >
                    <CiSquarePlus size={20} />
                    Crear Nuevo
                </button>
            </div>


            {/* Tabla de Productos */}

            <div className="table-container">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th >Imagen</th>
                            <th >ID</th>
                            <th >Nombre</th>

                            <th ><CiFilter size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Categoría</th>
                            <th >Precio</th>

                            <th >Stock</th>

                            <th className="td-actions">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ?
                            (
                                filteredProducts.map((product) => (
                                    <tr
                                        key={product.id_key}
                                        // Las interacciones de hover se manejan en ProductsListScreen.css
                                    >
                                        <td >
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="product-image"
                                                onError={(e) => e.target.src = getForcedImageUrl(product.id_key)}
                                            />
                                        </td>
                                        <td className="product-id">{product.id_key}</td>
                                        <td >{product.name}</td>

                                        <td >{product.categoryName || product.category?.name || 'N/A'}</td>


                                        <td className="price-col">${product.price.toFixed(2)}</td>
                                        <td >
                                            <span className={product.stock <= 5 ? "stock-low" : "stock-sufficient"}>
                                                {product.stock}
                                            </span>


                                        </td>
                                        <td className="td-actions">

                                            {/* Botón Editar (Naranja) */}
                                            <button

                                                onClick={(e) => handleEdit(product.id_key, e)}

                                                className="action-button action-button-edit"
                                                title="Editar Producto"
                                            >

                                                <CiEdit size={18} />

                                            </button>


                                        </td>
                                    </tr>

                                ))

                            ) : (
                                <tr>
                                    <td colSpan="7" className="td-actions" style={{ textAlign: 'center', color: '#bdbdbd' }}>
                                        No se encontraron productos que coincidan con los filtros o la búsqueda.
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>


            </div>

            {products.length >= PRODUCT_LIMIT && (
                <p style={{ marginTop: '20px', color: '#ff5722', fontWeight: 'bold' }}>
                    Solo se muestran los primeros {PRODUCT_LIMIT} productos (Límite de la API).
                </p>

            )}

        </div>
    );
};

export default ProductsListScreen;
// --- FIN DEL ARCHIVO: src\screens\AdminDashboard\ListsScreens\ProductsListScreen.jsx ---