import React, { useState, useEffect, useMemo, useCallback } from 'react';
// <-- useCallback agregado
// Asumimos que estás usando react-router-dom para el enrutamiento
import { useNavigate, useParams } from 'react-router-dom';
// Importación de librerías externas de React Redux
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
// Importar acciones del carrito de Redux Toolkit
// Rutas corregidas asumiendo que este archivo está en el root (o un nivel superior a redux/)
// IMPORTANTE: ASUMIMOS QUE addItemToCart PUEDE MANEJAR LA CANTIDAD COMPLETA.
import { addItemToCart } from '../../redux/slices/cartSlice'; 

// --- CONFIGURACIÓN ESTATICAS Y FUNCIONES LOCALES ---

// Función para simular una imagen forzada para el producto (placeholder)
// Usaremos el rojo de Mercado Fake para el placeholder.
const getForcedImageUrl = (id) => `https://placehold.co/400x400/ff5722/ffffff?text=Producto-${id}`;
const ProductDetailsScreen = () => {
    // Hooks de navegación y estado global
    const navigate = useNavigate();
    const { productId } = useParams(); // Obtiene el ID de la URL (ej: /products/10)
    const dispatch = useDispatch();
// Estado local para los datos del producto
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
// Cantidad a añadir al carrito <--- ESTADO DE CANTIDAD
    const [addedToCart, setAddedToCart] = useState(false);
// Estado para la notificación de éxito

    // Estado global de autenticación (para validar si puede comprar/comentar)
    const { isLoggedIn } = useSelector(state => state.auth);
// Obtener stock actual del carrito para calcular el máximo permitido
    const cartItem = useSelector(state => state.cart.items.find(item => item.product_id === parseInt(productId)));
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
            const reviewsData = productData.reviews
            
      
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
    }, [productId]); 

    useEffect(() => {
        if (productId) {
            fetchProductDetails();
        }
    }, [productId, fetchProductDetails]);
// =========================================================================
    // II. LÓGICA DEL CARRITO
    // =========================================================================
    
    // Lógica para limitar la cantidad máxima que se puede comprar
    const maxQuantity = useMemo(() => {
        if (!product) return 1;
        // El stock total menos lo que ya está en el carrito
        const currentCartQuantity = cartItem ? cartItem.quantity : 0;
        return product.stock - currentCartQuantity;
   
    }, [product, cartItem]); 
    
    // Handler para agregar el producto al carrito (dispatch a Redux)
    const handleAddToCart = () => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        if (!product || maxQuantity < quantity || quantity <= 0) {
            alert('Error: La cantidad solicitada excede el stock disponible o es inválida.');
            return;
        }

        // 1. Dispatch de la acción de Redux Toolkit con la CANTIDAD seleccionada
        dispatch(addItemToCart({
            product_id: product.id_key,
            name: product.name,
            price: product.price,
            quantity: quantity, // <-- CORRECCIÓN CLAVE: Enviar la cantidad
        }));
// 2. Notificación y limpieza 
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 3000);
// Ocultar mensaje después de 3s
        setQuantity(1);
// Resetear selector de cantidad
    };
    
    // Manejar el cambio del input numérico
    const handleQuantityChange = (e) => {
        let value = parseInt(e.target.value) ||
            1;
        
        // Limitar la cantidad para que no exceda el stock disponible
        const limitedValue = Math.max(1, Math.min(maxQuantity, value));
        setQuantity(limitedValue);
    };

    // =========================================================================
    // III. RENDERIZADO
    // =========================================================================
    
    // Estilos CSS estándar (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE - Estructura ML)
    const styles = {
        container: { 
            maxWidth: '1200px', 
            margin: '40px auto', 
            padding: '20px', 
            fontFamily: 'Arial, sans-serif', 
            backgroundColor: '#121212', 
            color: '#e0e0e0', 
        },
        loadingText: { textAlign: 'center', fontSize: '1.2rem', color: '#bdbdbd' },
        
        // Estructura principal de 2 columnas (ML-style)
        mainContent: { 
            display: 'grid', 
            gridTemplateColumns: '1fr 350px', // Imagen 1fr, Controles 350px
            gap: '30px', 
            paddingBottom: '30px', 
            marginBottom: '30px',
        },
        imageContainer: { 
            gridColumn: '1 / 2',
            minWidth: '300px', 
            borderRadius: '8px', 
            overflow: 'hidden', 
            backgroundColor: '#1e1e1e', // Fondo de la imagen
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        productImage: { 
            maxWidth: '100%', 
            height: 'auto', 
            display: 'block',
            objectFit: 'contain', 
        },
        
        // Columna Derecha (ML-style: precio, stock, botones)
        sidebarContainer: { 
            gridColumn: '2 / 3',
            padding: '20px',
            border: '1px solid #424242', 
            borderRadius: '8px', 
            backgroundColor: '#1e1e1e', 
            maxHeight: '400px', 
        },
        
        // Columna Izquierda Inferior (ML-style: Descripción/Reseñas)
        descriptionContainer: {
            gridColumn: '1 / 3', // Ocupa todo el ancho
            padding: '30px 0',
            borderTop: '1px solid #424242',
            marginTop: '20px',
        },
        
        productName: { 
            fontSize: '1.8rem', 
            fontWeight: '600', 
            color: '#e0e0e0',
            marginBottom: '20px', 
            gridColumn: '1 / 3', // Nombre siempre arriba, sobre las columnas
        },
        
        productPrice: { 
            fontSize: '2.5rem', // Precio grande y llamativo
            color: '#e0e0e0', // Texto claro (no color primario en el precio, como ML)
            fontWeight: '600', 
            marginBottom: '15px' 
        },
        
        stockText: { 
            fontSize: '0.9rem', 
            marginBottom: '10px', 
            fontWeight: '400', 
            color: product && product.stock > 0 ? '#10b981' : '#ef4444' 
        },
        
        // Controlador de Carrito
        cartControls: { 
            display: 'block', 
            marginTop: '20px',
            marginBottom: '20px',
        },
        quantityLabel: {
            display: 'block',
            marginBottom: '8px',
            fontSize: '0.9rem',
            color: '#bdbdbd',
        },
        quantityInput: { 
            padding: '8px', 
            width: '60px', 
            borderRadius: '5px', 
            border: '1px solid #424242', 
            backgroundColor: '#2e2e2e',
            color: '#e0e0e0',
            textAlign: 'center', 
            fontWeight: 'bold', 
            marginRight: '15px',
        },
        
        // Botones principales (ML-style)
        addButton: { 
            padding: '12px 0', 
            width: '100%',
            backgroundColor: '#ff5722', // Rojo Primario (Comprar/Agregar)
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontWeight: '700', 
            fontSize: '1.1rem',
            transition: 'background-color 0.2s',
            marginBottom: '10px', // Separación entre botones
        },
        buyButton: { 
            // Simular un botón "Comprar Ahora"
            padding: '12px 0', 
            width: '100%',
            backgroundColor: '#3b82f6', // Azul Secundario para 'Comprar Ahora'
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontWeight: '700', 
            fontSize: '1.1rem',
            transition: 'background-color 0.2s',
        },
        
        reviewsHeader: { 
            fontSize: '1.8rem', 
            fontWeight: 'bold', 
            marginBottom: '20px', 
            color: '#e0e0e0' 
        },
        reviewsContainer: { 
            padding: '0', 
            border: 'none',
            backgroundColor: 'transparent',
        },
        reviewItem: { 
            border: '1px solid #424242', 
            padding: '15px', 
            borderRadius: '5px', 
            marginBottom: '15px', 
            backgroundColor: '#1e1e1e', 
        },
        reviewRating: { 
            fontWeight: 'bold', 
            color: '#f59e0b', // Amarillo/Naranja para estrellas
            fontSize: '1.2rem',
            marginBottom: '5px',
        },
        reviewComment: { 
            color: '#bdbdbd', 
            marginTop: '5px', 
            fontSize: '0.95rem' 
        },
        
        // Estilo para la notificación de éxito
        successNotification: {
            backgroundColor: '#154030', // Fondo verde oscuro para éxito
            color: '#10b981', // Texto verde
            padding: '10px', 
            borderRadius: '5px', 
            marginTop: '15px', 
            fontWeight: 'bold',
            textAlign: 'center'
        }
    };
    
    // Función para manejar el "Comprar Ahora" (simplemente añade al carrito y navega al checkout)
    const handleBuyNow = () => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        if (!product || maxQuantity < quantity || quantity <= 0) {
            alert('Error: La cantidad solicitada excede el stock disponible o es inválida.');
            return;
        }

        // 1. Dispatch de la acción de Redux Toolkit con la CANTIDAD seleccionada
        dispatch(addItemToCart({
            product_id: product.id_key,
            name: product.name,
            price: product.price,
            quantity: quantity, 
        }));
        // 2. Navegar directamente al checkout
        navigate('/checkout');
    };

if (loading) {
        return <div style={styles.loadingText}>Cargando detalles del producto...</div>;
}

    if (error) {
        return <div style={{ ...styles.container, color: '#ef4444', textAlign: 'center' }}>Error: {error}</div>;
}

    return (
        <div style={styles.container}>
            
            {/* Nombre del Producto sobre el contenido principal */}
            <h1 style={styles.productName}>{product.name}</h1>

            <div style={styles.mainContent}>
                
                {/* ------------------------------------------------------------------ */}
                {/* Columna Izquierda: Imagen Principal */}
                {/* ------------------------------------------------------------------ */}
                <div style={styles.imageContainer}>
                    <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        style={styles.productImage}
                        onError={(e) => e.target.src = getForcedImageUrl(product.id_key)}
                    />
                </div>
            
                {/* ------------------------------------------------------------------ */}
                {/* Columna Derecha: Precio, Stock, Controles de Compra (ML-style Sidebar) */}
                {/* ------------------------------------------------------------------ */}
                <div style={styles.sidebarContainer}>
                    
                    {/* Precio */}
                    <p style={styles.productPrice}>${product.price.toFixed(2)}</p>

                    {/* Stock */}
                    <p style={styles.stockText}>
                        {maxQuantity > 0 ?
                        `Stock disponible para agregar: ${maxQuantity} unidades` : 
                        (product.stock > 0 ? 'Todas las unidades están en tu carrito.' : 'AGOTADO')}
                    </p>
                    
                    {/* Cantidad a agregar */}
                    {maxQuantity > 0 && (
                        <div style={styles.cartControls}>
                            <label style={styles.quantityLabel}>Cantidad:</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={handleQuantityChange}
                                min="1"
                                max={maxQuantity}
                                disabled={maxQuantity === 0}
                                style={styles.quantityInput}
                            />
                        </div>
                    )}
                    
                    {/* Botón de Comprar Ahora (Azul) */}
                    {maxQuantity > 0 && (
                        <button 
                            onClick={handleBuyNow}
                            disabled={maxQuantity === 0 || quantity > maxQuantity || quantity <= 0 || !isLoggedIn}
                            style={styles.buyButton}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = styles.buyButton.backgroundColor}
                        >
                            Comprar Ahora
                        </button>
                    )}

                    {/* Botón de Agregar al Carrito (Rojo Primario) */}
                    {maxQuantity > 0 && (
                        <button 
                            onClick={handleAddToCart}
                            disabled={maxQuantity === 0 || quantity > maxQuantity || quantity <= 0 || !isLoggedIn}
                            style={styles.addButton}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#e64a19'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = styles.addButton.backgroundColor}
                        >
                            Agregar al Carrito
                        </button>
                    )}
                    
                    {!isLoggedIn && (
                        <p style={{ marginTop: '20px', color: '#ef4444', fontWeight: 'bold' }}>
                            Inicie sesión para comprar.
                        </p>
                    )}
                    
                    {addedToCart && (
                        <div style={styles.successNotification}>
                            Producto(s) agregado(s) al carrito.
                        </div>
                    )}
                    
                </div> {/* Fin sidebarContainer */}

                
                {/* Contenedor que abarca ambas columnas para la descripción/reseñas */}
                <div style={styles.descriptionContainer}>
                    
                    {/* Reseñas */}
                    <div style={styles.reviewsContainer}>
                        <h2 style={styles.reviewsHeader}>
                            Opiniones sobre el Producto ({product.reviews?.length || 0})
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
                            <p style={{ color: '#bdbdbd' }}>Sé el primero en dejar una opinión sobre este producto.</p>
                        )}
                    </div>
                    
                </div>
                
            </div> {/* Fin mainContent */}
        </div>
    );
};

export default ProductDetailsScreen;