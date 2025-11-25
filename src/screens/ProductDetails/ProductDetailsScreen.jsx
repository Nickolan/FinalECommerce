import React, { useState, useEffect, useMemo, useCallback } from 'react'; // <-- useCallback agregado
// Asumimos que estás usando react-router-dom para el enrutamiento
import { useNavigate, useParams } from 'react-router-dom'; 
// Importación de librerías externas de React Redux
import { useDispatch, useSelector } from 'react-redux'; 
import axios from 'axios';

// Importar acciones del carrito de Redux Toolkit
// Rutas corregidas asumiendo que este archivo está en el root (o un nivel superior a redux/)
import { addItemToCart } from '../../redux/slices/cartSlice'; 

// --- CONFIGURACIÓN ESTATICAS Y FUNCIONES LOCALES ---

// Función para simular una imagen forzada para el producto (placeholder)
// Se incluye aquí para evitar el error de importación de './HomeScreen'
const getForcedImageUrl = (id) => `https://placehold.co/300x200/2563eb/ffffff?text=Producto-${id}`; 

const ProductDetailsScreen = () => {
    // Hooks de navegación y estado global
    const navigate = useNavigate();
    const { productId } = useParams(); // Obtiene el ID de la URL (ej: /products/10)
    const dispatch = useDispatch();

    // Estado local para los datos del producto
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1); // Cantidad a añadir al carrito

    // Estado global de autenticación (para validar si puede comprar/comentar)
    const { isLoggedIn } = useSelector(state => state.auth);

    // =========================================================================
    // I. CARGA DE DATOS DEL PRODUCTO Y RESEÑAS
    // =========================================================================

    const fetchProductDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Cargar Producto Específico
            const productResponse = await axios.get(`/products/${productId}`);
            const productData = productResponse.data;

            // Cargar Reseñas para el producto 
            // Asumimos que la API SÍ soporta el filtro por product_id en el query string
            const reviewsResponse = await axios.get(`/reviews?product_id=${productId}`);
            const reviewsData = reviewsResponse.data;
            
            // Adjuntar la URL de imagen forzada
            productData.imageUrl = getForcedImageUrl(productData.id_key);
            
            // Combinar y guardar el estado
            setProduct({ ...productData, reviews: reviewsData });

        } catch (err) {
            console.error("Error cargando detalles del producto:", err);
            setError("Producto no encontrado o error de conexión.");
        } finally {
            setLoading(false);
        }
    }, [productId]); // Dependencia del ID de la URL

    useEffect(() => {
        if (productId) {
            fetchProductDetails();
        }
    }, [productId, fetchProductDetails]); // fetchProductDetails se usa como dependencia para useCallback/useEffect


    // =========================================================================
    // II. LÓGICA DEL CARRITO
    // =========================================================================
    
    // Handler para agregar el producto al carrito (dispatch a Redux)
    const handleAddToCart = () => {
        if (!isLoggedIn) {
            // Usar la función navigate de react-router-dom para la redirección
            navigate('/login'); 
            return;
        }

        if (!product || product.stock < quantity) {
            alert('Error: Stock insuficiente o producto no disponible.');
            return;
        }

        // 1. Dispatch de la acción de Redux Toolkit
        dispatch(addItemToCart({
            product_id: product.id_key,
            name: product.name,
            price: product.price,
            quantity: quantity, // Usamos la cantidad seleccionada
        }));
        
        // 2. Notificación y limpieza (opcional)
        // Reemplazar alert() por una notificación modal o mensaje en pantalla
        alert(`${quantity} unidad(es) de ${product.name} agregada(s) al carrito!`);
        setQuantity(1); // Resetear selector de cantidad
    };
    
    // Lógica para limitar la cantidad máxima que se puede comprar
    const maxQuantity = useMemo(() => product ? product.stock : 1, [product]);

    // =========================================================================
    // III. RENDERIZADO
    // =========================================================================
    
    // Estilos CSS estándar
    const styles = {
        container: { maxWidth: '1000px', margin: '40px auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
        loadingText: { textAlign: 'center', fontSize: '1.2rem', color: '#555' },
        // Contenedor Superior (Detalles)
        topContainer: { 
            display: 'flex', 
            gap: '40px', 
            borderBottom: '1px solid #e0e0e0', 
            paddingBottom: '30px', 
            marginBottom: '30px',
            flexWrap: 'wrap', // Responsive básico
        },
        imageContainer: { 
            flex: 1, 
            minWidth: '300px', // Mínimo para móvil
            maxWidth: '450px', 
            borderRadius: '8px', 
            overflow: 'hidden', 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            order: 1 // Orden inicial
        },
        productImage: { width: '100%', height: 'auto', display: 'block' },
        infoContainer: { 
            flex: 1, 
            minWidth: '300px', // Mínimo para móvil
            padding: '10px 0',
            order: 2 // Orden inicial
        },
        productName: { fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px', color: '#333' },
        productPrice: { fontSize: '2rem', color: '#10b981', fontWeight: '700', marginBottom: '15px' },
        stockText: { fontSize: '1rem', marginBottom: '20px', fontWeight: '600', color: product && product.stock > 0 ? '#10b981' : '#ef4444' },
        
        // Controlador de Carrito
        cartControls: { display: 'flex', gap: '15px', alignItems: 'center', marginTop: '20px' },
        quantityInput: { padding: '8px', width: '60px', borderRadius: '5px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold' },
        addButton: { 
            padding: '12px 25px', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            transition: 'background-color 0.2s',
            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)', 
        },
        
        // Contenedor Inferior (Reviews)
        reviewsContainer: { padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f9f9f9' },
        reviewItem: { border: '1px solid #ddd', padding: '15px', borderRadius: '5px', marginBottom: '15px', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
        reviewRating: { fontWeight: 'bold', color: '#f59e0b', fontSize: '1.2rem' },
        reviewComment: { color: '#6b7280', marginTop: '5px', fontSize: '0.95rem' }
    };

    if (loading) {
        return <div style={styles.loadingText}>Cargando detalles del producto...</div>;
    }

    if (error) {
        return <div style={{ ...styles.container, color: '#ef4444', textAlign: 'center' }}>Error: {error}</div>;
    }

    return (
        <div style={styles.container}>
            {/* ------------------------------------------------------------------ */}
            {/* Contenedor Superior: Imagen, Info y Controlador de Carrito */}
            {/* ------------------------------------------------------------------ */}
            <div style={styles.topContainer}>
                
                {/* Lado Izquierdo (Imagen) */}
                <div style={styles.imageContainer}>
                    <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        style={styles.productImage}
                        onError={(e) => e.target.src = getForcedImageUrl(product.id_key)}
                    />
                </div>
                
                {/* Lado Derecho (Info y Controles) */}
                <div style={styles.infoContainer}>
                    <h1 style={styles.productName}>{product.name}</h1>
                    
                    <p style={styles.productPrice}>${product.price.toFixed(2)}</p>

                    <p style={styles.stockText}>
                        {product.stock > 0 ? `En Stock: ${product.stock} unidades` : 'AGOTADO'}
                    </p>

                    <p style={{ marginBottom: '20px', color: '#555' }}>
                        {/* Descripción genérica, ya que el modelo no tiene 'description' */}
                        Este es un producto de alta calidad de FinalCommerce. Cómpralo ahora y disfruta de la mejor experiencia.
                    </p>

                    {/* Controlador de Carrito */}
                    {product.stock > 0 && (
                        <div style={styles.cartControls}>
                            <label style={styles.label}>Cantidad:</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
                                min="1"
                                max={maxQuantity}
                                disabled={maxQuantity === 0}
                                style={styles.quantityInput}
                            />
                            <button 
                                onClick={handleAddToCart}
                                disabled={maxQuantity === 0 || quantity > maxQuantity}
                                style={styles.addButton}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = styles.addButton.backgroundColor}
                            >
                                Agregar al Carrito
                            </button>
                        </div>
                    )}
                    
                    {!isLoggedIn && (
                        <p style={{ marginTop: '20px', color: '#ef4444', fontWeight: 'bold' }}>
                            Inicie sesión para agregar este producto al carrito.
                        </p>
                    )}
                </div>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Contenedor Inferior: Reviews */}
            {/* ------------------------------------------------------------------ */}
            <div style={styles.reviewsContainer}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#333' }}>
                    Reseñas del Producto ({product.reviews?.length || 0})
                </h2>

                {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map(review => (
                        <div key={review.id_key} style={styles.reviewItem}>
                            <p style={styles.reviewRating}>
                                Calificación: {'★'.repeat(Math.round(review.rating))} ({review.rating.toFixed(1)})
                            </p>
                            <p style={styles.reviewComment}>
                                {review.comment || "Sin comentario."}
                            </p>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#999' }}>Sé el primero en dejar una reseña sobre este producto.</p>
                )}

            </div>
        </div>
    );
};

export default ProductDetailsScreen;