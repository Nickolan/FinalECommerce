import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Importación de librerías externas de React Redux
import { useSelector, useDispatch } from 'react-redux'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Rutas corregidas para Redux slices
import { clearCart } from '../../redux/slices/cartSlice'; 
const ENUMS = {
    // PaymentType: 1: CASH, 2: CARD
    PAYMENT_TYPE: { CASH: 1, CARD: 2, DEBIT: 3, CREDIT: 4, BANK_TRANSFER: 5 }, 
    // DeliveryMethod: 1: DRIVE_THRU, 2: ON_HAND, 3: HOME_DELIVERY
    DELIVERY_METHOD: { DRIVE_THRU: 1, ON_HAND: 2, HOME_DELIVERY: 3 }, 
    // Status: 1: PENDING
    ORDER_STATUS: { PENDING: 1 } 
};

// 1. Crear Bill; 2. Crear Order; 3. Crear Order_detail

const CheckoutScreen = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Obtener estado global de Redux
    const { client_id, isLoggedIn } = useSelector(state => state.auth);
    const { items: cartItems, totalAmount } = useSelector(state => state.cart);
    console.log(cartItems);
    

    // --- ESTADO LOCAL DEL CHECKOUT ---
    const [loading, setLoading] = useState(false);
    const [flowStatus, setFlowStatus] = useState('Listo para confirmar');
    const [apiError, setApiError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState(ENUMS.PAYMENT_TYPE.CARD);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addresses, setAddresses] = useState([]); // Direcciones del cliente
    
    // IDs generados durante el flujo (para seguimiento)
    const [generatedIds, setGeneratedIds] = useState({ billId: null, orderId: null });

    // Carga las direcciones del cliente al montar el componente
    useEffect(() => {
        if (!isLoggedIn || !client_id) {
            navigate('/login');
            return;
        }

        const fetchAddresses = async () => {
            try {
                // Endpoint para obtener direcciones del cliente (Asumimos GET /addresses?client_id={id} funciona)
                const response = await axios.get(`/addresses?client_id=${client_id}`);
                setAddresses(response.data);
                if (response.data.length > 0) {
                    setSelectedAddress(response.data[0].id_key);
                }
            } catch (err) {
                console.error("Error cargando direcciones:", err);
                setAddresses([]);
            }
        };
        fetchAddresses();
    }, [isLoggedIn, client_id, navigate]);
    
    // Validación de pre-requisitos
    const canCheckout = useMemo(() => {
        return isLoggedIn && cartItems.length > 0 && selectedAddress !== null && totalAmount > 0;
    }, [isLoggedIn, cartItems, selectedAddress, totalAmount]);
    
    // =========================================================================
    // I. FUNCIÓN PRINCIPAL: ORQUESTACIÓN TRANSACCIONAL
    // =========================================================================

    const handleConfirmPurchase = useCallback(async () => {
        if (!canCheckout) {
            setApiError('Carrito vacío o faltan datos de envío/sesión.');
            return;
        }

        setLoading(true);
        setApiError(null);
        setFlowStatus('Iniciando Transacción...');

        try {
            // --- PASO 1: CREAR FACTURA (BILL) ---
            setFlowStatus('1/3 Creando Factura...');
            const billData = {
                bill_number: `${client_id}${Date.now()}`, 
                date: new Date().toISOString().split('T')[0],
                total: totalAmount,
                payment_type: paymentMethod,
                client_id: parseInt(client_id)
            };
            
            const billResponse = await axios.post(`/bills`, billData);
            const newBillId = billResponse.data.id_key;
            
            // --- PASO 2: CREAR PEDIDO (ORDER) ---
            setFlowStatus('2/3 Creando Pedido...');
            const orderData = {
                total: totalAmount,
                delivery_method: ENUMS.DELIVERY_METHOD.HOME_DELIVERY,
                status: ENUMS.ORDER_STATUS.PENDING,
                date: new Date().toISOString(),
                client_id: parseInt(client_id),
                bill_id: newBillId 
            };
            console.log(orderData);
            
            const orderResponse = await axios.post(`/orders`, orderData);
            const newOrderId = orderResponse.data.id_key;
            
            setGeneratedIds({ billId: newBillId, orderId: newOrderId });
            
            // --- PASO 3: CREAR DETALLES DEL PEDIDO (ORDER DETAILS) ---
            // Esta es la parte más CRÍTICA (stock deduction y price validation)
            setFlowStatus('3/3 Procesando Detalles y Stock...');
            
            const detailPromises = cartItems.map(async (item, index) => {
                const detailData = {
                    quantity: item.quantity,
                    price: item.price, 
                    order_id: newOrderId,
                    product_id: item.product_id
                };
                // El servidor validará stock y precio en este POST
                return axios.post(`/order_details`, detailData);
            });
            
            // Esperar a que todos los detalles se confirmen
            await Promise.all(detailPromises);
            
            // --- TRANSACCIÓN EXITOSA ---
            dispatch(clearCart()); // Limpiar carrito de Redux
            setFlowStatus('COMPLETADO');
            setLoading(false);
            // Reemplazar alert() por una notificación o modal
            alert(`🎉 Pedido ${newOrderId} creado con éxito. Stock reservado.`);
            navigate(`/orders/${newOrderId}`);

        } catch (err) {
            // --- MANEJO DE ERRORES: Stock Insuficiente o FK Fallida ---
            let errorMsg = 'Error fatal en la transacción. El pedido no fue completado.';
            if (err.response) {
                // Captura el mensaje de error de la API (e.g., Stock insuficiente o FK no existe)
                errorMsg = err.response.data.detail || err.response.data.message || `Error HTTP: ${err.response.status}`;
                if (errorMsg.includes('Insufficient stock')) {
                    errorMsg = `FALLO DE STOCK: Stock insuficiente para uno o más productos.`;
                } else if (errorMsg.includes('Price mismatch')) {
                    errorMsg = `FALLO DE PRECIO: El precio del producto en el carrito es incorrecto.`;
                }
            } else if (err.request) {
                errorMsg = 'Error de conexión con el servidor API.';
            }
            console.log(err);
            

            setApiError(errorMsg);
            setFlowStatus('FALLIDO');
        } finally {
            setLoading(false);
        }
    }, [canCheckout, client_id, totalAmount, cartItems, paymentMethod, navigate, dispatch]);


    // Estilos CSS estándar
    const styles = {
        container: { maxWidth: '800px', margin: '40px auto', padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
        header: { fontSize: '2rem', fontWeight: 'bold', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px', marginBottom: '20px' },
        section: { marginBottom: '25px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' },
        sectionHeader: { fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px', color: '#333' },
        cartItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ccc' },
        total: { fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', marginTop: '15px', textAlign: 'right' },
        addressSelect: { padding: '10px', width: '100%', borderRadius: '5px', border: '1px solid #ccc' },
        button: { padding: '12px 25px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '20px' },
        buttonDisabled: { backgroundColor: '#9ca3af', cursor: 'not-allowed' },
        errorBox: { padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', border: '1px solid #f5c6cb', fontWeight: 'bold', marginBottom: '15px' },
        spinner: { margin: '10px auto', border: '4px solid rgba(0, 0, 0, 0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' },
        '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } }
    };
    
    // Mostrar mensaje de error si no hay items
    if (!isLoggedIn) {
        return <div style={{ ...styles.container, textAlign: 'center', marginTop: '100px' }}>
            <h2 style={styles.header}>Acceso Denegado</h2>
            <p>Debe iniciar sesión para acceder al Checkout.</p>
            <button onClick={() => navigate('/login')} style={{ ...styles.button, width: 'auto' }}>Ir a Login</button>
        </div>;
    }
    
    if (cartItems.length === 0) {
        return <div style={{ ...styles.container, textAlign: 'center', marginTop: '100px' }}>
            <h2 style={styles.header}>Carrito Vacío</h2>
            <p>No tienes productos en el carrito para proceder al pago.</p>
            <button onClick={() => navigate('/')} style={{ ...styles.button, width: 'auto', backgroundColor: '#10b981' }}>Volver a la Tienda</button>
        </div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Checkout</h1>

            {apiError && <div style={styles.errorBox}>Error de Compra: {apiError}</div>}
            
            {/* 1. Resumen del Carrito */}
            <div style={styles.section}>
                <h2 style={styles.sectionHeader}>Artículos ({cartItems.length})</h2>
                {cartItems.map((item) => (
                    <div key={item.product_id} style={styles.cartItem}>
                        <span>{item.name} (x{item.quantity})</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
                <div style={styles.total}>Total: ${totalAmount.toFixed(2)}</div>
            </div>
            
            {/* 2. Dirección de Envío */}
            <div style={styles.section}>
                <h2 style={styles.sectionHeader}>Dirección de Envío</h2>
                {addresses.length > 0 ? (
                    <select
                        value={selectedAddress}
                        onChange={(e) => setSelectedAddress(parseInt(e.target.value))}
                        style={styles.addressSelect}
                        disabled={loading}
                    >
                        {addresses.map(addr => (
                            <option key={addr.id_key} value={addr.id_key}>
                                {addr.street}, {addr.city}
                            </option>
                        ))}
                    </select>
                ) : (
                    <p style={styles.errorBox}>No tienes direcciones registradas. Por favor, regístralas en tu perfil.</p>
                )}
            </div>
            
            {/* 3. Método de Pago */}
            <div style={styles.section}>
                <h2 style={styles.sectionHeader}>Método de Pago</h2>
                <label>
                    <input
                        type="radio"
                        name="payment"
                        value={ENUMS.PAYMENT_TYPE.CASH}
                        checked={paymentMethod === ENUMS.PAYMENT_TYPE.CASH}
                        onChange={() => setPaymentMethod(ENUMS.PAYMENT_TYPE.CASH)}
                        disabled={loading}
                        style={{ marginRight: '10px' }}
                    />
                    Efectivo (Pago a la entrega)
                </label>
                <br />
                <label>
                    <input
                        type="radio"
                        name="payment"
                        value={ENUMS.PAYMENT_TYPE.CARD}
                        checked={paymentMethod === ENUMS.PAYMENT_TYPE.CARD}
                        onChange={() => setPaymentMethod(ENUMS.PAYMENT_TYPE.CARD)}
                        disabled={loading}
                        style={{ marginRight: '10px' }}
                    />
                    Tarjeta de Crédito
                </label>

                <br />
                <label>
                    <input
                        type="radio"
                        name="payment"
                        value={ENUMS.PAYMENT_TYPE.DEBIT}
                        checked={paymentMethod === ENUMS.PAYMENT_TYPE.DEBIT}
                        onChange={() => setPaymentMethod(ENUMS.PAYMENT_TYPE.DEBIT)}
                        disabled={loading}
                        style={{ marginRight: '10px' }}
                    />
                    Debito
                </label>

                <br />
                <label>
                    <input
                        type="radio"
                        name="payment"
                        value={ENUMS.PAYMENT_TYPE.CREDIT}
                        checked={paymentMethod === ENUMS.PAYMENT_TYPE.CREDIT}
                        onChange={() => setPaymentMethod(ENUMS.PAYMENT_TYPE.CREDIT)}
                        disabled={loading}
                        style={{ marginRight: '10px' }}
                    />
                    Credito
                </label>

                <br />
                <label>
                    <input
                        type="radio"
                        name="payment"
                        value={ENUMS.PAYMENT_TYPE.BANK_TRANSFER}
                        checked={paymentMethod === ENUMS.PAYMENT_TYPE.BANK_TRANSFER}
                        onChange={() => setPaymentMethod(ENUMS.PAYMENT_TYPE.BANK_TRANSFER)}
                        disabled={loading}
                        style={{ marginRight: '10px' }}
                    />
                    Transeferencia Bancaria
                </label>
            </div>

            {/* 4. Botón de Confirmación y Estado */}
            {loading && <div style={styles.spinner} aria-label="Procesando compra"></div>}
            <p style={{ textAlign: 'center', fontWeight: 'bold', color: flowStatus === 'FALLIDO' ? '#ef4444' : '#333' }}>
                {flowStatus}
            </p>

            <button
                onClick={handleConfirmPurchase}
                disabled={loading || !canCheckout || addresses.length === 0}
                style={{ ...styles.button, ...(loading || !canCheckout || addresses.length === 0 ? styles.buttonDisabled : {}) }}
                onMouseEnter={(e) => { if (!loading && canCheckout) e.target.style.backgroundColor = '#2563eb'; }}
                onMouseLeave={(e) => { if (!loading && canCheckout) e.target.style.backgroundColor = styles.button.backgroundColor; }}
            >
                {flowStatus.startsWith('3/3') ? 'FINALIZANDO...' : 'CONFIRMAR Y PAGAR'}
            </button>
            
            {(generatedIds.billId || generatedIds.orderId) && flowStatus !== 'COMPLETADO' && (
                <p style={{ marginTop: '10px', color: 'orange', textAlign: 'center', fontSize: '0.9rem' }}>
                    Factura/Pedido creado(s) temporalmente, pero la transacción de detalles falló.
                </p>
            )}

        </div>
    );
};

export default CheckoutScreen;