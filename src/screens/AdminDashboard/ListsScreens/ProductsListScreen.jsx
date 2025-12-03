// --- INICIO DEL ARCHIVO: src\screens\AdminDashboard\ListsScreens\ProductsListScreen.jsx ---

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CiSearch, CiSquarePlus, CiEdit, CiTrash, CiBoxList, CiDollar, CiFilter } from "react-icons/ci";
// Función para simular una imagen forzada para el producto (placeholder)
const getForcedImageUrl = (id) => `https://placehold.co/50x50/ff5722/ffffff?text=P-${id}`;
const ProductsListScreen = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); // Para el filtro de categorías
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    // Estado para filtrar

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
                // Añadir filtro por categoría si está seleccionada (asumiendo que la 
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

    // Intenta eliminar el producto. Si falla por FK (pedidos asociados), lo desactiva (stock a 0).
    // const handleDeleteOrDeactivate = async (product, e) => {
    //     e.stopPropagation();
    //     const productId = product.id_key;

    //     const confirmation = window.confirm(`ADVERTENCIA: ¿Estás seguro de que quieres gestionar el Producto ID ${productId}? Se intentará eliminar permanentemente. Si falla (tiene pedidos), se DESACTIVARÁ (Stock: 0).`);
    //     if (!confirmation) return;

    //     try {
    //         // **PASO 1: INTENTAR ELIMINAR FÍSICAMENTE**
    //         await axios.delete(`/products/${productId}`);

    //         alert(`✅ Producto ID ${productId} ELIMINADO completamente con éxito.`);

    //     } catch (err) {
    //         console.error(`Error al intentar eliminar ${productId}:`, err);

    //         // **PASO 2: SI FALLA, INTENTAR DESACTIVAR**
    //         let message = `Error al eliminar el producto ID ${productId}. Intentando desactivación...`;

    //         console.log(err.message);


    //         // Mitigación: Usamos la respuesta de la API para saber si falló por una restricción de FK
    //         if (err.response?.status === 500) {
    //             message = `El producto ID ${productId} tiene pedidos asociados. Se procede a DESACTIVAR (Stock: 0).`;
    //         } else {
    //             // Otros errores (404, 500 de la API sin FK, o error de conexión)
    //             message = `Fallo al gestionar el producto: ${err.response?.data?.detail || 'Error de conexión o API'}.`;
    //             alert(message);
    //             setError(message);
    //             return;
    //         }

    //         try {
    //             // **PASO 3: DESACTIVAR (PUT con stock: 0)**
    //             const deactivatePayload = {
    //                 name: product.name,
    //                 price: product.price,
    //                 stock: 0, // Forzar stock a cero
    //                 category_id: product.category_id,
    //             };

    //             console.log(deactivatePayload);


    //             await axios.put(`/products/${productId}`, deactivatePayload);
    //             alert(message + `\n✅ Desactivación exitosa (Stock: 0).`);

    //         } catch (deactivateErr) {
    //             console.error("Error al desactivar:", deactivateErr);
    //             alert(message + `\n❌ FALLO en la desactivación.`);
    //             setError(`Error en la desactivación del producto.`);
    //             return;
    //         }
    //     }

    //     fetchProducts(); // Recargar la lista en cualquier caso de éxito (eliminación o desactivación)
    // };

    // =========================================================================
    // IV. ESTILOS Y RENDERIZADO
    // =========================================================================

    // Estilos CSS estándar (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE)
    const styles = {
        container: { padding: '0 10px', maxWidth: '100%', fontFamily: 'Arial, sans-serif' },
        header: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px', color: '#ff5722' },
        topControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
        controlsLeft: { display: 'flex', gap: '15px', flexGrow: 1 },
        searchContainer: {

            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            border: '1px solid #424242',
            flexGrow: 1

        },
        searchInput: {
            flexGrow: 1,
            padding: '5px 10px',
            border: 'none',
            fontSize: '1rem',
            background: 'transparent',
            color: '#e0e0e0'

        },
        filterSelect: {
            padding: '8px 10px',
            borderRadius: '5px',
            border: '1px solid #424242',
            fontSize: '1rem',
            backgroundColor: '#2e2e2e',

            color: '#e0e0e0',
            display: 'flex',
            alignItems: 'center'
        },
        createButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',

            padding: '10px 15px',
            backgroundColor: '#ff5722', // Rojo Primario
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',

            transition: 'background-color 0.2s'
        },
        tableContainer: {
            overflowX: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)',
            borderRadius: '8px'
        },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#1e1e1e' },

        th: {
            padding: '12px 15px',
            textAlign: 'left',
            backgroundColor: '#2e2e2e',
            borderBottom: '2px solid #424242',
            color: '#bdbdbd',
            fontSize: '0.9rem',

            textTransform: 'uppercase'
        },
        td: {
            padding: '12px 15px',
            borderBottom: '1px solid #424242',
            fontSize: '1rem',
            color: '#e0e0e0'
        },

        tdActions: { width: '100px', textAlign: 'center' },
        actionButton: (color) => ({

            backgroundColor: color,
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '5px',
            cursor:
                'pointer',
            marginLeft: '5px',
            transition: 'opacity 0.15s'
        }),
        loadingText: { textAlign: 'center', color: '#ff5722', fontSize: '1.2rem', margin: '40px 0' },
        errorText: { textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin: '40px 0' },
        stockLow: { color: '#ef4444', fontWeight: 'bold' },
        stockSufficient: { color: '#10b981' },
        // Verde para buen stock
    };

    // Funciones para manejar el hover en los inputs
    const handleInputFocus = (e) => {
        e.target.style.borderColor = '#ff5722';
    };
    const handleInputBlur = (e) => { e.target.style.borderColor = '#424242'; };
    if (loading) {
        return <div style={styles.container}><p style={styles.loadingText}>Cargando lista de productos...</p></div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Gestión de Productos ({products.length} Mostrados)</h1>

            {error && <p style={styles.errorBox}>{error}</p>}

            {/* Controles: Búsqueda, Filtro y Creación */}
            <div style={styles.topControls}>


                <div style={styles.controlsLeft}>
                    {/* Búsqueda */}
                    <div style={styles.searchContainer}>
                        <CiSearch size={20} style={{ color: '#bdbdbd' }} />

                        <input
                            type="text"
                            placeholder="Buscar por ID o Nombre de Producto..."

                            value={searchTerm}

                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}

                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                        />
                    </div>


                    {/* Filtro por Categoría */}
                    <select
                        value={selectedCategoryId}


                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        style={styles.filterSelect}
                        title="Filtrar por Categoría"
                        onFocus={handleInputFocus}

                        onBlur={handleInputBlur}
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
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e64a19'}
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
                            <th style={styles.th}><CiBoxList size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Nombre</th>

                            <th style={styles.th}><CiFilter size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Categoría</th>
                            <th style={styles.th}><CiDollar size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Precio</th>

                            <th style={styles.th}>Stock</th>

                            <th style={{ ...styles.th, ...styles.tdActions }}>Acciones</th>
                        </tr>

                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ?
                            (
                                filteredProducts.map((product) => (
                                    <tr
                                        key={product.id_key}

                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.trHover.backgroundColor}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.table.backgroundColor}

                                    >
                                        <td style={styles.td}>
                                            <img

                                                src={product.imageUrl}

                                                alt={product.name}

                                                style={{ width: '40px', height: '40px', borderRadius: '5px', objectFit: 'cover' }}
                                            />

                                        </td>
                                        <td style={{ ...styles.td, color: '#ff5722', fontWeight: 'bold' }}>{product.id_key}</td>
                                        <td
                                            style={styles.td}>{product.name}</td>

                                        <td style={styles.td}>{product.categoryName}</td>


                                        <td style={{ ...styles.td, fontWeight: 'bold', color: '#10b981' }}>${product.price.toFixed(2)}</td>
                                        <td style={styles.td}>
                                            <span style={product.stock <= 5 ?
                                                styles.stockLow : styles.stockSufficient}>
                                                {product.stock}
                                            </span>


                                        </td>
                                        <td style={styles.tdActions}>

                                            {/* Botón Editar (Naranja) */}
                                            <button

                                                onClick={(e) => handleEdit(product.id_key, e)}

                                                style={styles.actionButton('#f59e0b')}

                                                title="Editar Producto"
                                                onMouseEnter={(e) => e.target.style.opacity = 0.8}
                                                onMouseLeave={(e) => e.target.style.opacity
                                                    = 1}

                                            >

                                                <CiEdit size={18} />

                                            </button>


                                            {/* Botón Desactivar (Rojo Peligro) */}

                                            {/* <button
                                                onClick={(e) => handleDeleteOrDeactivate(product, e)} // <-- Llama a la función de gestión


                                                style={styles.actionButton('#ef4444')}
                                                title="Eliminar (si no tiene pedidos) o Desactivar" // <-- Título actualizado

                                                onMouseEnter={(e) => e.target.style.opacity = 0.8}
                                                onMouseLeave={(e) => e.target.style.opacity = 1}

                                            >

                                                <CiTrash size={18} />
                                            </button> */}


                                        </td>
                                    </tr>

                                ))

                            ) : (
                                <tr>

                                    <td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: '#bdbdbd' }}>

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