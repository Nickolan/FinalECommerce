import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
    setProducts,
    setCategories,
    setCurrentPage,
    setSelectedCategory,
    setSearchTerm,
    setSelectedProduct
} from '../../redux/slices/catalogSlice';
import { useNavigate } from 'react-router-dom';
import ProductSummaryModal from '../../components/ProductSummaryModal/ProductSummaryModal';
import BANNER_IMAGE_URL from '../../assets/banner.png'

// Función para simular una imagen forzada para el producto (placeholder)
const getForcedImageUrl = (id) => `https://picsum.photos/300/200?random=${id}`;

// CONSTANTE DE HEURÍSTICA DE CACHÉ
const CACHE_HIT_THRESHOLD_MS = 18;

const HomeScreen = () => {
    const dispatch = useDispatch();
    const {
        products,
        categories,
        currentPage,
        productsPerPage,
        totalProducts,
        currentSearchTerm,
        selectedCategoryId
    } = useSelector(state => state.catalog);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredProductId, setHoveredProductId] = useState(null);

    // ESTADOS PARA EL MODAL DE CACHÉ
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProduct, setModalProduct] = useState(null);

    // =========================================================================
    // I. CARGA Y SINCRONIZACIÓN DE DATOS (Optimización de Llamadas)
    // =========================================================================

    useEffect(() => {
        
        // Función para cargar las categorías (si están vacías en Redux)
        const loadInitialCategories = async () => {
            if (categories.length > 0) return; // Si ya hay categorías, salimos
            try {
                const response = await axios.get(`/categories`);
                dispatch(setCategories(response.data));
            } catch (err) {
                console.error("Error cargando categorías:", err);
                setError("Error al cargar las categorías iniciales.");
            }
        };

        const loadProducts = async () => {
            setLoading(true);
            setError(null);

            const skip = (currentPage - 1) * productsPerPage;
            
            let productsToProcess = [];
            let totalRecords = 0; // Total de registros para calcular totalPages

            try {
                // --- 1. Carga con Filtro de Categoría ---
                if (selectedCategoryId) {
                    // Carga TODOS los productos de la categoría para paginar localmente
                    const categoriesResponse = await axios.get(`/categories/${selectedCategoryId}`);
                    productsToProcess = categoriesResponse.data.products.filter((e) => e.stock > 0);
                    
                    totalRecords = productsToProcess.length; 

                    // Aplicamos la paginación de forma local (en el frontend)
                    const startIndex = skip;
                    const endIndex = startIndex + productsPerPage;
                    productsToProcess = productsToProcess.slice(startIndex, endIndex);

                } else {
                    // --- 2. Carga Sin Filtro (Pagina el servidor) ---
                    let url = `/products`; 
                    const productsResponse = await axios.get(url);
                    
                    // Aplicamos el filtro de stock en el frontend para consistencia
                    const allProductsWithStock = productsResponse.data.filter((e) => e.stock > 0); 
                    
                    totalRecords = allProductsWithStock.length;
                    
                    // Aplicamos paginación local aquí también, ya que la API puede no limitar el retorno
                    const startIndex = skip;
                    const endIndex = startIndex + productsPerPage;
                    productsToProcess = allProductsWithStock.slice(startIndex, endIndex);
                }
                
                let fetchedProducts = productsToProcess.map(p => ({
                    ...p,
                    imageUrl: getForcedImageUrl(p.id_key)
                }));
                
                // NOTA CLAVE: El total para el paginado es el total de registros filtrados (totalRecords)
                dispatch(setProducts({
                    products: fetchedProducts,
                    total: totalRecords, // <-- USAMOS EL TOTAL REAL DE REGISTROS CON STOCK
                    currentPage: currentPage
                }));

            } catch (err) {
                console.error("Error cargando productos:", err);
                setError("Error al cargar los productos. Verifique la conexión con el servidor.");
            } finally {
                setLoading(false);
            }
        };
        
        // Disparo de la carga:
        loadInitialCategories(); // Carga categorías si no existen
        loadProducts(); // Carga productos basado en filtros y página

    // Dependencias CLAVE: Las llamadas se disparan SÓLO cuando cambian estos valores.
    }, [dispatch, currentPage, productsPerPage, selectedCategoryId, categories.length]); 


    // =========================================================================
    // II. LÓGICA DE INTERACCIÓN (Detección de Caché)
    // =========================================================================

    // Aplicar filtro de búsqueda por nombre (search bar) sobre la lista actual.
    const filteredProducts = useMemo(() => {
        if (!currentSearchTerm) {
            return products;
        }
        const term = currentSearchTerm.toLowerCase();
        return products.filter(product =>
            product.name.toLowerCase().includes(term)
        );
    }, [products, currentSearchTerm]);

    // Handler para decidir si mostrar modal o redirigir
    const handleProductClick = async (productId) => {

        // 1. INICIO DE MEDICIÓN DE LATENCIA
        const startTime = Date.now();

        try {
            // 2. Obtener los detalles completos del producto
            const response = await axios.get(`/products/${productId}`);

            // 3. FIN DE MEDICIÓN Y CÁLCULO
            const endTime = Date.now();
            const timeDiff = endTime - startTime;

            const productData = response.data;
            productData.imageUrl = getForcedImageUrl(productData.id_key);

            // 4. DECISIÓN: CACHÉ HIT vs. CACHÉ MISS
            if (timeDiff < CACHE_HIT_THRESHOLD_MS) {
                // CACHÉ HIT (Latencia baja): Mostrar Modal
                setModalProduct(productData);
                setIsModalOpen(true);

            } else {
                // CACHÉ MISS (Latencia alta): Redirigir a la pantalla de detalle
                dispatch(setSelectedProduct(productData));
                navigate(`/products/${productId}`);
            }

        } catch (err) {
            console.error("Error al obtener detalles del producto:", err);
            setError("Error al cargar los detalles. Intente de nuevo.");
        }
    };

    // Búsqueda instantánea por nombre
    const handleSearchChange = (e) => {
        dispatch(setSearchTerm(e.target.value));
    };

    // Cambio de categoría
    const handleCategoryChange = (e) => {
        // Al cambiar el filtro, forzamos la página a 1 para empezar de nuevo
        dispatch(setCurrentPage(1)); 
        dispatch(setSelectedCategory(e.target.value));
    };

    // Paginación (Siguiente/Anterior)
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            dispatch(setCurrentPage(newPage));
            // <-- NUEVO CAMBIO: Subir al inicio de la pantalla -->
            window.scrollTo(0, 0); 
            // <-- FIN NUEVO CAMBIO -->
        }
    };
    
    // =========================================================================
    // III. RENDERIZADO
    // =========================================================================

    // Estilos CSS estándar (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE)
    const styles = {
        container: { maxWidth: '1200px', margin: '0 auto', padding: '20px 0', fontFamily: 'Arial, sans-serif' },
        banner: { width: '100%', height: '300px', backgroundImage: `url(${BANNER_IMAGE_URL})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '30px', borderRadius: '8px' },
        controls: {
            display: 'flex',
            gap: '20px',
            marginBottom: '30px',
            padding: '15px',
            border: '1px solid #424242',
            borderRadius: '8px',
            backgroundColor: '#1e1e1e', // Fondo de control oscuro
            alignItems: 'center'
        },

        searchBar: {
            flexGrow: 1,
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #424242',
            fontSize: '1rem',
            backgroundColor: '#2e2e2e', // Fondo de input oscuro
            color: '#e0e0e0' // Texto de input claro
        },
        select: {
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #424242',
            fontSize: '1rem',
            backgroundColor: '#2e2e2e', // Fondo de select oscuro
            color: '#e0e0e0' // Texto de select claro
        },
        productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px', minHeight: '600px' },
        productCard: {
            border: '1px solid #424242',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            backgroundColor: '#1e1e1e', // Fondo de tarjeta oscuro
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s'
        },
        productCardHover: {
            transform: 'translateY(-5px)',
            borderColor: '#ff5722' // Borde primario en hover
        },

        imageBox: { width: '100%', height: '200px', overflow: 'hidden' },
        productImage: { width: '100%', height: '100%', objectFit: 'cover' },
        productInfo: { padding: '15px' },
        productName: {
            fontSize: '1.2rem',
            fontWeight: 'bold',
            marginBottom: '5px',
            color: '#e0e0e0' // Texto claro
        },
        productPrice: {
            fontSize: '1.4rem',
            color: '#ff5722', // Color Primario (Rojo)
            fontWeight: '700'
        },
        pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '30px', marginBottom: "30px" },

        pageButton: {
            padding: '10px 15px',
            border: '1px solid #424242',
            borderRadius: '5px',
            backgroundColor: '#2e2e2e', // Fondo de botón oscuro
            color: '#e0e0e0', // Texto claro
            cursor: 'pointer'
        },
        pageButtonActive: {
            backgroundColor: '#ff5722', // Rojo Primario Activo
            color: 'white',
            borderColor: '#ff5722'
        },
        errorBox: {
            padding: '20px',
            backgroundColor: '#401818', // Fondo rojo oscuro (error)
            color: '#ef4444',
            borderRadius: '8px',
            border: '1px solid #dc2626',
            textAlign: 'center'
        },
        loadingSpinner: {
            border: '4px solid rgba(255, 87, 34, 0.3)',
            borderTopColor: '#ff5722', // Spinner en rojo
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            animation: 'spin 1s linear infinite',
            margin: '40px auto'
        },

        '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } }
    };

    return (
        <div style={styles.container}>
            {/* 1. Banner Estático */}
            <div style={styles.banner}>
                {/* [Image of Banner de E-commerce] */}
            </div>

            {/* 2. Controlador de Búsqueda y Filtro */}

            <div style={styles.controls}>
                {/* Search Bar */}
                <input
                    type="text"
                    placeholder="Buscar productos por nombre..."

                    value={currentSearchTerm}
                    onChange={handleSearchChange}
                    style={styles.searchBar}
                    title="Busca instantánea por nombre (filtro local)"
                />


                {/* Select de Categorías */}
                <select
                    value={selectedCategoryId}
                    onChange={handleCategoryChange}
                    style={styles.select}

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

            {/* Mensajes de Estado */}
            {error && <div style={styles.errorBox}>{error}</div>}
            {loading ?
                (
                    // Simulación de Spinner con CSS
                    <div style={styles.loadingSpinner} aria-label="Cargando productos"></div>
                ) : filteredProducts.length === 0 ?
                    (
                        <div style={styles.errorBox}>No se encontraron productos que coincidan con los filtros.</div>
                    ) : null}

            {/* Paginación Final */}
            {!loading && totalPages > 1 && (
                <div style={styles.pagination}>
                    <button
                        onClick={() => handlePageChange(currentPage -
                            1)}
                        disabled={currentPage === 1}
                        style={currentPage === 1 ? styles.pageButton : { ...styles.pageButton, backgroundColor: '#ff5722', color: 'white', borderColor: '#ff5722' }}
                        onMouseEnter={(e) => { if (currentPage !== 1) e.target.style.backgroundColor = '#e64a19'; }}
                        onMouseLeave={(e) => { if (currentPage !== 1) e.target.style.backgroundColor = '#ff5722'; }}
                    >
                        Anterior

                    </button>
                    <span style={{ color: '#e0e0e0' }}>Página {currentPage} de {totalPages}</span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}

                        // Deshabilitar si la página actual ya devolvió menos que el límite
                        disabled={currentPage >= totalPages || filteredProducts.length < productsPerPage}
                        style={currentPage >= totalPages || filteredProducts.length < productsPerPage ? styles.pageButton : { ...styles.pageButton, backgroundColor: '#ff5722', color: 'white', borderColor: '#ff5722' }}
                        onMouseEnter={(e) => { if (!(currentPage >= totalPages || filteredProducts.length < productsPerPage)) e.target.style.backgroundColor = '#e64a19'; }}
                        onMouseLeave={(e) => { if (!(currentPage >= totalPages || filteredProducts.length < productsPerPage)) e.target.style.backgroundColor = '#ff5722'; }}
                    >

                        Siguiente
                    </button>
                </div>
            )}

            {/* 3. Sector de Productos */}
            <div style={styles.productGrid}>
                {filteredProducts.map((product) => (

                    <div
                        key={product.id_key}
                        style={{ ...styles.productCard, ...(hoveredProductId === product.id_key ? styles.productCardHover : {}) }}
                        onClick={() => handleProductClick(product.id_key)}

                        onMouseEnter={() => setHoveredProductId(product.id_key)}
                        onMouseLeave={() => setHoveredProductId(null)}
                    >
                        {/* Cuadro de Imagen Forzada */}

                        <div style={styles.imageBox}>
                            <img
                                src={product.imageUrl}

                                alt={product.name}
                                style={styles.productImage}
                                onError={(e) => e.target.src = getForcedImageUrl(product.id_key)}
                            />
                        </div>


                        <div style={styles.productInfo}>
                            <h3 style={styles.productName}>{product.name}</h3>

                            <p style={styles.productPrice}>${product.price.toFixed(2)}</p>
                            <p style={{
                                fontSize: '0.9rem', color: product.stock > 0 ?
                                    '#10b981' : '#ef4444'
                            }}>
                                {product.stock > 0 ?
                                    `Stock: ${product.stock}` : 'AGOTADO'}
                            </p>
                        </div>
                    </div>
                ))}

            </div>

            {/* Paginación Final */}
            {!loading && totalPages > 1 && (
                <div style={styles.pagination}>
                    <button
                        onClick={() => handlePageChange(currentPage -
                            1)}
                        disabled={currentPage === 1}
                        style={currentPage === 1 ? styles.pageButton : { ...styles.pageButton, backgroundColor: '#ff5722', color: 'white', borderColor: '#ff5722' }}
                        onMouseEnter={(e) => { if (currentPage !== 1) e.target.style.backgroundColor = '#e64a19'; }}
                        onMouseLeave={(e) => { if (currentPage !== 1) e.target.style.backgroundColor = '#ff5722'; }}
                    >
                        Anterior

                    </button>
                    <span style={{ color: '#e0e0e0' }}>Página {currentPage} de {totalPages}</span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}

                        // Deshabilitar si la página actual ya devolvió menos que el límite
                        disabled={currentPage >= totalPages || filteredProducts.length < productsPerPage}
                        style={currentPage >= totalPages || filteredProducts.length < productsPerPage ? styles.pageButton : { ...styles.pageButton, backgroundColor: '#ff5722', color: 'white', borderColor: '#ff5722' }}
                        onMouseEnter={(e) => { if (!(currentPage >= totalPages || filteredProducts.length < productsPerPage)) e.target.style.backgroundColor = '#e64a19'; }}
                        onMouseLeave={(e) => { if (!(currentPage >= totalPages || filteredProducts.length < productsPerPage)) e.target.style.backgroundColor = '#ff5722'; }}
                    >

                        Siguiente
                    </button>
                </div>
            )}

            {/* RENDERIZADO CONDICIONAL DEL MODAL DE CACHÉ */}
            {isModalOpen && modalProduct && (
                <ProductSummaryModal
                    product={modalProduct}
                    onClose={() => {
                        setIsModalOpen(false);
                        setModalProduct(null); // Limpiar al cerrar
                    }}
                />
            )}
        </div>
    );
};

export default HomeScreen;