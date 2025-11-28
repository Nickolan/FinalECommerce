import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Componentes
import AddressForm from '../../components/AddressForm/AddressForm'; // <-- Nuevo: Importamos el formulario
import { clearCart } from '../../redux/slices/cartSlice'; 

// --- CONFIGURACIONES ESTÁTICAS Y ENUMS ---
const ENUMS = {
    // PaymentType: 1: CASH, 2: CARD, 3: DEBIT, 4: CREDIT, 5: BANK_TRANSFER
    PAYMENT_TYPE: { CASH: 1, CARD: 2, DEBIT: 3, CREDIT: 4, BANK_TRANSFER: 5 }, 
    // DeliveryMethod: 1: DRIVE_THRU, 2: ON_HAND, 3: HOME_DELIVERY
    DELIVERY_METHOD: { DRIVE_THRU: 1, ON_HAND: 2, HOME_DELIVERY: 3 }, 
    // Status: 1: PENDING
    ORDER_STATUS: { PENDING: 1 } 
};

const DELIVERY_METHODS_UI = [
    { id: ENUMS.DELIVERY_METHOD.HOME_DELIVERY, name: 'Envío a Domicilio', price: 10.00 },
    { id: ENUMS.DELIVERY_METHOD.DRIVE_THRU, name: 'Recoger en Tienda (Drive Thru)', price: 0.00 },
    { id: ENUMS.DELIVERY_METHOD.ON_HAND, name: 'Recoger en Tienda (En Persona)', price: 0.00 },
];

const PAYMENT_METHODS = [
    { id: ENUMS.PAYMENT_TYPE.CASH, name: 'Efectivo (Pago a la entrega)' },
    { id: ENUMS.PAYMENT_TYPE.CARD, name: 'Tarjeta de Crédito/Débito' },
    { id: ENUMS.PAYMENT_TYPE.DEBIT, name: 'Débito' },
    { id: ENUMS.PAYMENT_TYPE.CREDIT, name: 'Crédito' },
    { id: ENUMS.PAYMENT_TYPE.BANK_TRANSFER, name: 'Transferencia Bancaria' },
];


const CheckoutScreen = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Obtener estado global de Redux
    const { client_id, isLoggedIn } = useSelector(state => state.auth);
    const { items: cartItems, totalAmount } = useSelector(state => state.cart);
    
    // --- ESTADO LOCAL DEL CHECKOUT ---
    const [loading, setLoading] = useState(false);
    const [flowStatus, setFlowStatus] = useState('Listo para confirmar');
    const [apiError, setApiError] = useState(null);
    
    // Estados del flujo de 3 pasos
    const [step, setStep] = useState(1); // 1: Dirección, 2: Envío/Pago, 3: Confirmación
    const [addresses, setAddresses] = useState([]); 
    const [selectedAddressId, setSelectedAddressId] = useState(null); 
    const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState(DELIVERY_METHODS_UI[0]); 
    const [paymentMethod, setPaymentMethod] = useState(ENUMS.PAYMENT_TYPE.CARD);
    
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false); // Para el formulario
    
    // IDs generados durante el flujo (para seguimiento)
    const [generatedIds, setGeneratedIds] = useState({ billId: null, orderId: null });

    // Cálculo del total con envío (solo para UI, el backend usa totalAmount)
    const finalTotalUI = useMemo(() => {
        return totalAmount + (selectedDeliveryMethod.price || 0);
    }, [totalAmount, selectedDeliveryMethod]);
    
    // =========================================================================
    // I. CARGA DE DATOS Y LÓGICA DE DIRECCIÓN
    // =========================================================================

    const fetchAddresses = useCallback(async () => {
        if (!client_id) return;
        setApiError(null);
        try {
            // Asumimos GET /clients/{id} devuelve un objeto con la lista de direcciones anidadas
            const response = await axios.get(`/clients/${client_id}`);
            const fetchedAddresses = response.data.addresses || [];
            setAddresses(fetchedAddresses);
            
            if (fetchedAddresses.length > 0 && selectedAddressId === null) {
                // Selecciona la primera dirección por defecto si existe
                setSelectedAddressId(fetchedAddresses[0].id_key);
            }
        } catch (err) {
            console.error("Error cargando direcciones:", err);
            setAddresses([]);
            setApiError("Error al cargar las direcciones guardadas.");
        }
    }, [client_id, selectedAddressId]);
    
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        if (cartItems.length === 0) {
             return;
        }
        fetchAddresses();
    }, [isLoggedIn, navigate, cartItems.length, fetchAddresses]);
    
    // Validación de pre-requisitos
    const canCheckout = useMemo(() => {
        return isLoggedIn && cartItems.length > 0 && selectedAddressId !== null && totalAmount > 0;
    }, [isLoggedIn, cartItems, selectedAddressId, totalAmount]);
    
    // =========================================================================
    // II. MANEJO DE PASOS Y FLUJO TRANSACCIONAL (Flujo Original de 3 pasos)
    // =========================================================================

    // Handler para avanzar al siguiente paso
    const handleNextStep = () => {
        setApiError(null);
        if (step === 1 && selectedAddressId === null) {
            setApiError("Debe seleccionar una dirección de envío para continuar.");
            return;
        }
        setStep(prev => Math.min(prev + 1, 3));
    };

    // Handler para retroceder al paso anterior
    const handlePrevStep = () => {
        setApiError(null);
        setStep(prev => Math.max(prev - 1, 1));
    };

    // --- FUNCIÓN PRINCIPAL: ORQUESTACIÓN TRANSACCIONAL (Flujo Original) ---
    const handleConfirmPurchase = useCallback(async () => {
        if (!canCheckout) {
            setApiError('Faltan datos esenciales (carrito vacío o dirección no seleccionada).');
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
                total: totalAmount, // TOTAL SIN ENVÍO, como en el flujo original
                payment_type: paymentMethod,
                client_id: parseInt(client_id)
            };
            
            const billResponse = await axios.post(`/bills`, billData);
            const newBillId = billResponse.data.id_key;
            
            // --- PASO 2: CREAR PEDIDO (ORDER) ---
            setFlowStatus('2/3 Creando Pedido...');
            const orderData = {
                total: totalAmount, // TOTAL SIN ENVÍO, como en el flujo original
                delivery_method: selectedDeliveryMethod.id, // Método seleccionado
                status: ENUMS.ORDER_STATUS.PENDING,
                date: new Date().toISOString(),
                client_id: parseInt(client_id),
                bill_id: newBillId 
                // NOTA: La API no maneja `address_id` en `OrderModel`. Asumimos que la dirección se infiere.
            };
            
            const orderResponse = await axios.post(`/orders`, orderData);
            const newOrderId = orderResponse.data.id_key;
            
            setGeneratedIds({ billId: newBillId, orderId: newOrderId });
            
            // --- PASO 3: CREAR DETALLES DEL PEDIDO (ORDER DETAILS) ---
            setFlowStatus('3/3 Procesando Detalles y Stock...');
            
            const detailPromises = cartItems.map(async (item) => {
                const detailData = {
                    quantity: item.quantity,
                    price: item.price, 
                    order_id: newOrderId,
                    product_id: item.product_id
                };
                return axios.post(`/order_details`, detailData);
            });
            
            await Promise.all(detailPromises);
            
            // --- TRANSACCIÓN EXITOSA ---
            dispatch(clearCart()); 
            setFlowStatus('COMPLETADO');
            setLoading(false);
            
            alert(`🎉 Pedido ${newOrderId} creado con éxito. Stock reservado.`);
            navigate(`/orders/${newOrderId}`);

        } catch (err) {
            let errorMsg = 'Error fatal en la transacción. El pedido no fue completado.';
            if (err.response) {
                errorMsg = err.response.data.detail || err.response.data.message || `Error HTTP: ${err.response.status}`;
                if (errorMsg.includes('Insufficient stock')) {
                    errorMsg = `FALLO DE STOCK: Stock insuficiente para uno o más productos.`;
                } else if (errorMsg.includes('Price mismatch')) {
                    errorMsg = `FALLO DE PRECIO: El precio del producto en el carrito es incorrecto.`;
                }
            } else if (err.request) {
                errorMsg = 'Error de conexión con el servidor API.';
            }
            
            setApiError(errorMsg);
            setFlowStatus('FALLIDO');
        } finally {
            setLoading(false);
        }
    }, [canCheckout, client_id, totalAmount, cartItems, paymentMethod, selectedDeliveryMethod.id, navigate, dispatch, selectedAddressId]);

    // =========================================================================
    // III. RENDERIZADO POR PASO (Mercado Fake Style)
    // =========================================================================

    const styles = {
        container: { maxWidth: '1200px', margin: '40px auto', padding: '20px', fontFamily: 'Arial, sans-serif', color: '#e0e0e0', backgroundColor: '#121212', minHeight: '80vh' },
        header: { fontSize: '2.5rem', fontWeight: 'bold', color: '#ff5722', marginBottom: '30px', borderBottom: '2px solid #424242', paddingBottom: '10px' },
        mainLayout: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' },
        formCard: { padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)' },
        summaryCard: { padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)', height: 'fit-content' },
        stepHeader: { fontSize: '1.8rem', fontWeight: '600', color: '#e0e0e0', marginBottom: '15px', borderBottom: '1px solid #424242', paddingBottom: '10px' },
        buttonGroup: { display: 'flex', justifyContent: 'space-between', marginTop: '30px', gap: '15px' },
        prevButton: { padding: '12px 20px', backgroundColor: '#424242', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'background-color 0.2s', flexGrow: 1 },
        nextButton: { padding: '12px 20px', backgroundColor: '#ff5722', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', transition: 'background-color 0.2s', flexGrow: 1 },
        confirmButton: { padding: '15px 25px', backgroundColor: '#ff5722', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '1.2rem', width: '100%', transition: 'background-color 0.2s', marginTop: '20px' },
        buttonDisabled: { backgroundColor: '#424242', cursor: 'not-allowed' },
        errorBox: { padding: '15px', backgroundColor: '#401818', color: '#ef4444', borderRadius: '8px', border: '1px solid #dc2626', fontWeight: 'bold', marginBottom: '15px' },
        addressRadioLabel: (selected) => ({
            display: 'block', 
            padding: '10px',
            border: `2px solid ${selected ? '#ff5722' : '#424242'}`,
            borderRadius: '6px',
            marginBottom: '10px',
            backgroundColor: selected ? '#301818' : '#2e2e2e',
            cursor: 'pointer',
            transition: 'all 0.2s',
        }),
        radioInput: { marginRight: '10px', accentColor: '#ff5722' },
        summaryItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#bdbdbd' },
        summaryTotal: { display: 'flex', justifyContent: 'space-between', padding: '15px 0 5px 0', fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981', borderTop: '2px solid #424242', marginTop: '10px' },
        addButton: { padding: '8px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
        spinner: { margin: '10px auto', border: '4px solid rgba(255, 87, 34, 0.3)', borderTopColor: '#ff5722', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' },
    };

    // --- RENDERIZADO PASO 1: DIRECCIÓN ---
    const renderStep1 = () => (
        <div>
            <h2 style={styles.stepHeader}>Paso 1: Seleccionar Dirección</h2>
            
            {/* Botón para Agregar Nueva Dirección */}
            {!isAddingNewAddress && (
                <button 
                    style={{...styles.addButton, marginBottom: '20px'}}
                    onClick={() => setIsAddingNewAddress(true)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.addButton.backgroundColor}
                >
                    + Agregar Nueva Dirección
                </button>
            )}

            {/* Formulario para agregar una nueva dirección */}
            {isAddingNewAddress && (
                <div style={{ marginBottom: '20px' }}>
                    <AddressForm 
                        client_id={client_id}
                        onSuccess={() => {
                            setIsAddingNewAddress(false);
                            fetchAddresses(); // Recargar direcciones
                        }}
                        onCancel={() => setIsAddingNewAddress(false)}
                    />
                </div>
            )}
            
            {/* Listado de direcciones existentes */}
            {addresses.length > 0 ? (
                <div style={{ marginTop: isAddingNewAddress ? '0' : '15px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#bdbdbd' }}>Direcciones Guardadas</h3>
                    {addresses.map(addr => (
                        <label 
                            key={addr.id_key} 
                            style={styles.addressRadioLabel(addr.id_key === selectedAddressId)}
                        >
                            <input
                                type="radio"
                                name="address"
                                checked={addr.id_key === selectedAddressId}
                                onChange={() => setSelectedAddressId(addr.id_key)}
                                style={styles.radioInput}
                            />
                            <strong>{addr.street} #{addr.number}</strong>, {addr.city}.
                            {addr.id_key === selectedAddressId && <span style={{ float: 'right', color: '#ff5722' }}>SELECCIONADA</span>}
                        </label>
                    ))}
                </div>
            ) : !isAddingNewAddress && (
                 <p style={styles.errorBox}>No tienes direcciones registradas. Agrega una para continuar.</p>
            )}
        </div>
    );
    
    // --- RENDERIZADO PASO 2: MÉTODO DE ENTREGA Y PAGO ---
    const renderStep2 = () => (
        <div>
            <h2 style={styles.stepHeader}>Paso 2: Entrega y Pago</h2>
            
            {/* Sección: Método de Entrega */}
            <h3 style={{ fontSize: '1.4rem', marginBottom: '10px', color: '#bdbdbd' }}>Método de Entrega</h3>
            {DELIVERY_METHODS_UI.map(method => (
                <label key={method.id} style={styles.addressRadioLabel(method.id === selectedDeliveryMethod.id)}>
                    <input
                        type="radio"
                        name="delivery"
                        checked={method.id === selectedDeliveryMethod.id}
                        onChange={() => setSelectedDeliveryMethod(method)}
                        style={styles.radioInput}
                    />
                    <strong>{method.name}</strong> 
                    <span style={{ float: 'right', color: method.price > 0 ? '#ff5722' : '#10b981', fontWeight: 'bold' }}>
                        {method.price > 0 ? `+ $${method.price.toFixed(2)}` : 'GRATIS'}
                    </span>
                </label>
            ))}

            {/* Sección: Método de Pago */}
            <h3 style={{ fontSize: '1.4rem', marginTop: '25px', marginBottom: '10px', color: '#bdbdbd' }}>Método de Pago</h3>
            {PAYMENT_METHODS.map(method => (
                <label key={method.id} style={styles.addressRadioLabel(method.id === paymentMethod)}>
                    <input
                        type="radio"
                        name="payment"
                        checked={method.id === paymentMethod}
                        onChange={() => setPaymentMethod(method.id)}
                        disabled={loading}
                        style={styles.radioInput}
                    />
                    {method.name}
                </label>
            ))}
        </div>
    );

    // --- RENDERIZADO PASO 3: CONFIRMACIÓN ---
    const renderStep3 = () => (
        <div>
            <h2 style={styles.stepHeader}>Paso 3: Confirmación Final</h2>
            <div style={{ padding: '0 10px' }}>
                <p style={{ marginBottom: '10px' }}>
                    <span style={styles.addressRadioLabel(true)}>
                        <strong style={{color: '#ff5722'}}>ENTREGA:</strong> {addresses.find(a => a.id_key === selectedAddressId)?.street || 'Dirección no disponible'}
                    </span>
                </p>
                 <p style={{ marginBottom: '10px' }}>
                    <span style={styles.addressRadioLabel(true)}>
                        <strong style={{color: '#ff5722'}}>MÉTODO:</strong> {selectedDeliveryMethod.name}
                    </span>
                </p>
                 <p style={{ marginBottom: '10px' }}>
                    <span style={styles.addressRadioLabel(true)}>
                        <strong style={{color: '#ff5722'}}>PAGO:</strong> {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name || 'Método no disponible'}
                    </span>
                </p>
            </div>
            
            <p style={{ color: '#bdbdbd', fontSize: '0.9rem', border: '1px solid #424242', padding: '10px', borderRadius: '5px', marginTop: '20px' }}>
                *Al presionar **CONFIRMAR Y PAGAR**, se realiza una transacción de 3 pasos (Factura $\rightarrow$ Pedido $\rightarrow$ Detalles/Stock) en la API.
            </p>
        </div>
    );
    
    // --- RENDERIZADO RESUMEN (COLUMNA DERECHA) ---
    const renderSummary = () => (
        <div style={styles.summaryCard}>
            <h2 style={{ ...styles.stepHeader, border: 'none' }}>Resumen de Compra</h2>
            
            {cartItems.map(item => (
                <div key={item.product_id} style={styles.summaryItem}>
                    <span style={{ color: '#bdbdbd' }}>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            ))}
            
            <div style={{...styles.summaryItem, marginTop: '20px', borderTop: '1px dashed #424242', paddingTop: '10px'}}>
                <span>Subtotal (Productos)</span>
                <span>${totalAmount.toFixed(2)}</span>
            </div>
            
             <div style={styles.summaryItem}>
                <span>Costo de Envío</span>
                <span style={{ color: selectedDeliveryMethod.price > 0 ? '#ff5722' : '#10b981' }}>
                    {selectedDeliveryMethod.price > 0 ? `+ $${selectedDeliveryMethod.price.toFixed(2)}` : 'Gratis'}
                </span>
            </div>
            
            <div style={styles.summaryTotal}>
                <span>Total Final</span>
                <span>${finalTotalUI.toFixed(2)}</span>
            </div>
        </div>
    );
    
    // --- RENDERIZADO PRINCIPAL ---
    if (!isLoggedIn) {
        // Manejar el caso de no loggeado
         return null; 
    }
    
    if (cartItems.length === 0) {
        // Manejar el caso de carrito vacío
        return null; 
    }
    
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Checkout</h1>

            <div style={styles.mainLayout}>
                {/* Columna Izquierda: Pasos de Checkout */}
                <div style={styles.formCard}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </div>

                {/* Columna Derecha: Resumen y Botón de Pago */}
                <div>
                    {renderSummary()}
                    
                    {/* Botón de Pago y Controles */}
                    <div style={{ padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)', marginTop: '30px' }}>
                        
                        {apiError && <div style={{...styles.errorBox, marginBottom: '15px'}}>{apiError}</div>}
                        
                        {loading && <div style={styles.spinner} aria-label="Procesando compra"></div>}
                        <p style={{ textAlign: 'center', fontWeight: 'bold', color: flowStatus === 'FALLIDO' ? '#ef4444' : '#bdbdbd', marginTop: '10px' }}>
                            {flowStatus}
                        </p>
                        
                        {/* Botones de Navegación de Flujo */}
                        {step === 3 ? (
                            <button
                                onClick={handleConfirmPurchase}
                                disabled={loading || !canCheckout}
                                style={{ 
                                    ...styles.confirmButton, 
                                    ...(loading || !canCheckout ? styles.buttonDisabled : {}) 
                                }}
                                onMouseEnter={(e) => { if (!loading && canCheckout) e.target.style.backgroundColor = '#e64a19'; }}
                                onMouseLeave={(e) => { if (!loading && canCheckout) e.target.style.backgroundColor = styles.confirmButton.backgroundColor; }}
                            >
                                {flowStatus.startsWith('3/3') ? 'FINALIZANDO...' : 'CONFIRMAR Y PAGAR'}
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '15px' }}>
                                {step > 1 && (
                                    <button 
                                        onClick={handlePrevStep} 
                                        style={styles.prevButton}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#616161'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.prevButton.backgroundColor}
                                    >
                                        Atrás
                                    </button>
                                )}
                                <button 
                                    onClick={handleNextStep} 
                                    disabled={loading || (step === 1 && !selectedAddressId) || (step === 2 && !paymentMethod)}
                                    style={{ 
                                        ...styles.nextButton, 
                                        ...(loading || (step === 1 && !selectedAddressId) || (step === 2 && !paymentMethod) ? styles.buttonDisabled : {}) 
                                    }}
                                    onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#e64a19'; }}
                                    onMouseLeave={(e) => { if (!loading) e.target.style.backgroundColor = styles.nextButton.backgroundColor; }}
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}

                        {generatedIds.billId && flowStatus !== 'COMPLETADO' && (
                            <p style={{ marginTop: '10px', color: 'orange', textAlign: 'center', fontSize: '0.9rem' }}>
                                Factura/Pedido creado(s) temporalmente, pero la transacción de detalles falló.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutScreen;