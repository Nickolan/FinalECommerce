import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addItemToCart } from '../../redux/slices/cartSlice';
import { IoFlashOutline, IoArrowForwardCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';
import { CiShoppingCart } from "react-icons/ci";

// Replicamos la función de imagen forzada para consistencia
const getForcedImageUrl = (id) => `https://placehold.co/400x400/ff5722/ffffff?text=Producto-${id}`;


const ProductSummaryModal = ({ product, onClose }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isLoggedIn } = useSelector(state => state.auth);

    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    // Obtener el estado actual del carrito para este producto
    const cartItem = useSelector(state =>
        state.cart.items.find(item => item.product_id === product.id_key)
    );

    // Lógica para limitar la cantidad máxima que se puede comprar (Stock - Carrito)
    const maxQuantity = useMemo(() => {
        const currentCartQuantity = cartItem ? cartItem.quantity : 0;
        return product.stock - currentCartQuantity;
    }, [product, cartItem]);

    // --- Handlers de Compra y Carrito ---

    const handleQuantityChange = (e) => {
        let value = parseInt(e.target.value) || 1;
        const limitedValue = Math.max(1, Math.min(maxQuantity, value));
        setQuantity(limitedValue);
    };

    const handleAddToCart = () => {
        if (!isLoggedIn) {
            alert('Debe iniciar sesión para agregar productos al carrito.');
            navigate('/login');
            return;
        }

        if (maxQuantity < quantity || quantity <= 0) {
            alert('Error: La cantidad solicitada excede el stock disponible o es inválida.');
            return;
        }

        dispatch(addItemToCart({
            product_id: product.id_key,
            name: product.name,
            price: product.price,
            quantity: quantity,
        }));

        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 3000);
        setQuantity(1);
    };

    const handleBuyNow = () => {
        if (!isLoggedIn) {
            alert('Debe iniciar sesión para comprar.');
            navigate('/login');
            return;
        }

        if (maxQuantity < quantity || quantity <= 0) {
            alert('Error: La cantidad solicitada excede el stock disponible o es inválida.');
            return;
        }

        dispatch(addItemToCart({
            product_id: product.id_key,
            name: product.name,
            price: product.price,
            quantity: quantity,
        }));

        onClose(); // Cerrar modal antes de navegar
        navigate('/checkout');
    };

    const handleGoToDetails = () => {
        onClose(); // Cerrar modal
        navigate(`/products/${product.id_key}`); // Navegar a la pantalla completa
    }

    // --- Estilos para Modo Oscuro/Rojo ---
    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
        modal: {
            backgroundColor: '#1e1e1e',
            padding: '25px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '650px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
            border: '2px solid #ff5722',
            color: '#e0e0e0',
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '20px',
            position: 'relative',
            // Asegurar que el modal responda bien en móviles
            '@media (maxWidth: 700px)': {
                gridTemplateColumns: '1fr',
                padding: '15px'
            }
        },
        closeButton: { position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#bdbdbd' },
        imageContainer: {
            width: '200px',
            height: '200px',
            overflow: 'hidden',
            borderRadius: '5px',
            border: '1px solid #424242',
            // Ajuste para móvil
            '@media (maxWidth: 700px)': {
                width: '100%',
                height: 'auto',
                marginBottom: '15px'
            }
        },
        image: { width: '100%', height: '100%', objectFit: 'cover' },
        info: { display: 'flex', flexDirection: 'column' },
        name: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px', color: '#e0e0e0' },
        price: { fontSize: '1.8rem', fontWeight: '700', color: '#ff5722', marginBottom: '15px' },
        stock: { fontSize: '0.9rem', color: maxQuantity > 0 ? '#10b981' : '#ef4444', marginBottom: '15px' },

        // Botones de Carrito/Compra
        buttonGroup: { display: 'flex', gap: '10px', marginTop: '10px' },
        addButton: { flex: 1, padding: '10px', backgroundColor: '#ff5722', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' },
        buyButton: { flex: 1, padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' },

        // Controles de cantidad y detalle
        quantityInput: { padding: '8px', width: '60px', borderRadius: '5px', border: '1px solid #424242', backgroundColor: '#2e2e2e', color: '#e0e0e0', textAlign: 'center', marginRight: '15px' },
        detailsButton: { background: 'transparent', border: 'none', color: '#ff5722', cursor: 'pointer', fontSize: '0.8rem', marginTop: '10px', fontWeight: '600' },
        successNotification: { backgroundColor: '#154030', color: '#10b981', padding: '8px', borderRadius: '5px', marginTop: '10px', fontWeight: 'bold', fontSize: '0.9rem' }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            {/* Usamos una media query simple para la responsividad del modal en línea */}
            <div
                style={styles.modal}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Botón de Cierre */}
                <button style={styles.closeButton} onClick={onClose}>
                    <IoCloseCircleOutline size={24} />
                </button>

                {/* Columna Izquierda: Imagen */}
                <div style={styles.imageContainer}>
                    <img
                        src={product.imageUrl || getForcedImageUrl(product.id_key)}
                        alt={product.name}
                        style={styles.image}
                        onError={(e) => e.target.src = getForcedImageUrl(product.id_key)}
                    />
                </div>

                {/* Columna Derecha: Información y Controles */}
                <div style={styles.info}>
                    <h2 style={styles.name}>{product.name}</h2>
                    <p style={{ ...styles.stock, color: '#bdbdbd', fontSize: '0.8rem' }}>
                        <IoFlashOutline size={16} style={{ verticalAlign: 'middle', marginRight: '5px', color: styles.price.color }} />
                        Datos cargados desde la CACHÉ de Redis
                    </p>
                    <p style={styles.price}>${product.price.toFixed(2)}</p>
                    <p style={styles.stock}>
                        Stock disponible: {maxQuantity} unidades
                    </p>

                    {maxQuantity > 0 && (
                        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.9rem', color: '#bdbdbd', marginRight: '10px' }}>Cantidad:</label>
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

                    <div style={styles.buttonGroup}>
                        <button
                            onClick={handleBuyNow}
                            disabled={maxQuantity <= 0 || quantity > maxQuantity}
                            style={{ ...styles.buyButton, opacity: maxQuantity <= 0 ? 0.5 : 1 }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = styles.buyButton.backgroundColor}
                        >
                            Comprar Ahora
                        </button>
                        <button
                            onClick={handleAddToCart}
                            disabled={maxQuantity <= 0 || quantity > maxQuantity}
                            style={{ ...styles.addButton, opacity: maxQuantity <= 0 ? 0.5 : 1 }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#e64a19'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = styles.addButton.backgroundColor}
                        >
                            <CiShoppingCart size={20} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Agregar
                        </button>
                    </div>

                    {addedToCart && <div style={styles.successNotification}>Producto(s) agregado(s) al carrito.</div>}

                    {/* Botón extra para ir al detalle completo */}
                    <button
                        onClick={handleGoToDetails}
                        style={styles.detailsButton}
                        onMouseEnter={(e) => e.target.style.color = '#e64a19'}
                        onMouseLeave={(e) => e.target.style.color = styles.detailsButton.color}
                    >
                        Ver Detalles Completos <IoArrowForwardCircleOutline size={18} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductSummaryModal;