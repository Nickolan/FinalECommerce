import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux'; // <-- Importar useDispatch
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setSelectedOrder } from '../../redux/slices/catalogSlice';
// Mapeo de valores de ENUM (Status) para mostrar texto legible
const ORDER_STATUS_MAP = {
    1: 'Pendiente',      // PENDING
    2: 'En Progreso',    // IN_PROGRESS
    3: 'Entregado',      // DELIVERED
    4: 'Cancelado',      // CANCELED
};

const CACHE_HIT_THRESHOLD_MS = 70;

const MyOrdersScreen = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Obtener el ID de cliente del estado global (sesión)
    const { client_id, isLoggedIn } = useSelector(state => state.auth);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // =========================================================================
    // I. CARGA DE DATOS: PEDIDOS DEL CLIENTE
    // =========================================================================

    const fetchOrders = useCallback(async () => {
        if (!client_id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);


        try {
            // Asumimos que el endpoint GET /orders soporta el filtrado por client_id
            const url = `/clients/${client_id}`;
            const response = await axios.get(url);

            // Ordenar los pedidos por fecha descendente
            const sortedOrders
                = response.data.orders.sort((a, b) =>
                    new Date(b.date) - new Date(a.date)
                );

            setOrders(sortedOrders);

        } catch (err) {
            console.error("Error cargando pedidos:", err);
            setError("Error al cargar tu historial de pedidos.Por favor, intenta más tarde.");
        } finally {
            setLoading(false);
        }
    }, [client_id]);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
        } else {
            fetchOrders();

        }
    }, [isLoggedIn, navigate, fetchOrders]);

    const handleOrderClick = async (orderId) => {
        
        // 1. INICIO DE MEDICIÓN DE LATENCIA
        const startTime = Date.now();

        try {
            // 2. Obtener los detalles completos del pedido
            const response = await axios.get(`/orders/${orderId}`);
            
            // 3. FIN DE MEDICIÓN Y CÁLCULO
            const endTime = Date.now();
            const timeDiff = endTime - startTime; // Latencia Total de la API

            const orderData = response.data;
            
            // 4. Guardar el objeto completo en el estado global
            dispatch(setSelectedOrder(orderData)); 
            
            // 5. Opcional: Mostrar notificación de caché (solo en consola, el cliente no lo ve)
            if (timeDiff < CACHE_HIT_THRESHOLD_MS) {
                console.log(`[Cache Order]: HIT ⚡ Latencia: ${timeDiff}ms. Respuesta servida desde Redis (inferido).`);
            } else {
                console.log(`[Cache Order]: MISS. Latencia: ${timeDiff}ms. Accediendo a DB (inferido).`);
            }

            // 6. Redirigir a la pantalla de detalle
            navigate(`/orders/${orderId}`);
            
        } catch (err) {
            console.error("Error al obtener detalles del pedido:", err);
            setError("Error al cargar los detalles del pedido. Intente de nuevo.");
            // Si falla, limpiar la selección para forzar el fallback en la pantalla de detalles
            dispatch(setSelectedOrder(null)); 
        }
    };

    // =========================================================================
    // II. RENDERIZADO
    // =========================================================================

    const styles = {
        container: {
            maxWidth: '800px',
            margin: '40px auto',
            padding: '30px',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#1e1e1e', // Fondo de tarjeta oscuro
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            color: '#e0e0e0',
        },
        header: {
            fontSize: '2rem',
            fontWeight: 'bold',
            borderBottom: '2px solid #424242', // Borde oscuro
            paddingBottom: '10px',
            marginBottom: '30px'
        },
        orderList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        },
        orderCard: {
            border: '1px solid #424242',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
            transition: 'background-color 0.2s',
            backgroundColor: '#2e2e2e', // Fondo de cada pedido
            cursor: 'pointer',
        },
        orderCardHover: {
            backgroundColor: '#383838', // Gris más oscuro en hover
        },
        orderHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
        },
        orderId: {
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#ff5722' // Rojo Primario
        },
        orderDate: {
            fontSize: '0.9rem',
            color: '#bdbdbd' // Gris claro
        },
        orderTotal: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#10b981' // Verde de Éxito (Total)
        },

        orderStatus: (statusValue) => {
            let color = '#bdbdbd'; // Default gris claro
            // Default gray
            if (statusValue === 3) color = '#10b981';
            // DELIVERED (Green)
            if (statusValue === 4) color = '#ef4444';
            // CANCELED (Red)
            if (statusValue === 2) color = '#f59e0b';
            // IN_PROGRESS (Orange)
            return { fontWeight: 'bold', color: color, fontSize: '1rem' };
        },
        noOrders: {
            textAlign: 'center',
            padding: '40px',
            color: '#9ca3af',
            fontSize: '1.1rem',
            border: '1px dashed #424242', // Borde dashed oscuro
            borderRadius: '8px'
        },
    };
    if (loading) {
        return <div style={styles.container}><p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#bdbdbd' }}>Cargando tus pedidos...</p></div>;
    }

    if (error) {
        return <div style={styles.container}><p style={{ color: '#ef4444' }}>Error: {error}</p></div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Mis Pedidos</h1>

            {orders.length === 0 ? (
                <div style={styles.noOrders}>
                    Aún no has realizado ningún pedido. ¡Es hora de comprar!

                    <button
                        onClick={() => navigate('/')}
                        style={{
                            ...styles.orderCard,
                            backgroundColor: '#ff5722', // Botón Primario Rojo
                            color: 'white',
                            border: 'none',
                            marginTop: '20px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e64a19'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ff5722'}
                    >

                        Volver a la Tienda
                    </button>
                </div>
            ) : (
                <div style={styles.orderList}>

                    {orders.map((order) => (
                        <div
                            key={order.id_key}
                            onClick={() => handleOrderClick(order.id_key)}
                            style={styles.orderCard}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.orderCardHover.backgroundColor}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.orderCard.backgroundColor}
                        >
                            <div style={styles.orderHeader}>

                                <span style={styles.orderId}>Pedido #{order.id_key}</span>
                                <span style={styles.orderStatus(order.status)}>
                                    {ORDER_STATUS_MAP[order.status] ||
                                        'Desconocido'}
                                </span>
                            </div>
                            <p style={styles.orderDate}>

                                Fecha: {new Date(order.date).toLocaleDateString()}
                            </p>
                            <p>

                                Total de la Factura ({order.bill_id}): <span style={styles.orderTotal}>${order.total.toFixed(2)}</span>
                            </p>
                            <p style={{ color: '#bdbdbd' }}>

                                Método de Entrega: {order.delivery_method === 3 ?
                                    'A Domicilio' : 'Recoger en Tienda'}
                            </p>
                            {/* NOTA: Para ver los detalles del pedido (Order Details), se necesitaría un nuevo endpoint o una lógica de expansión */}

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrdersScreen;