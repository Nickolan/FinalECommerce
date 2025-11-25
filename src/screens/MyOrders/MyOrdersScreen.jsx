import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Mapeo de valores de ENUM (Status) para mostrar texto legible
const ORDER_STATUS_MAP = {
    1: 'Pendiente',      // PENDING
    2: 'En Progreso',    // IN_PROGRESS
    3: 'Entregado',      // DELIVERED
    4: 'Cancelado',      // CANCELED
};

const MyOrdersScreen = () => {
    const navigate = useNavigate();
    
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
            const url = `/orders?client_id=${client_id}&skip=0&limit=100`;
            const response = await axios.get(url);
            
            // Ordenar los pedidos por fecha descendente
            const sortedOrders = response.data.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            setOrders(sortedOrders);

        } catch (err) {
            console.error("Error cargando pedidos:", err);
            setError("Error al cargar tu historial de pedidos. Por favor, intenta más tarde.");
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

    // =========================================================================
    // II. RENDERIZADO
    // =========================================================================

    const styles = {
        container: { maxWidth: '800px', margin: '40px auto', padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
        header: { fontSize: '2rem', fontWeight: 'bold', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px', marginBottom: '30px' },
        orderList: { display: 'flex', flexDirection: 'column', gap: '20px' },
        orderCard: { border: '1px solid #ddd', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', transition: 'background-color 0.2s' },
        orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
        orderId: { fontSize: '1.2rem', fontWeight: 'bold', color: '#3b82f6' },
        orderDate: { fontSize: '0.9rem', color: '#6b7280' },
        orderTotal: { fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' },
        orderStatus: (statusValue) => {
            let color = '#6b7280'; // Default gray
            if (statusValue === 3) color = '#10b981'; // DELIVERED (Green)
            if (statusValue === 4) color = '#ef4444'; // CANCELED (Red)
            if (statusValue === 2) color = '#f59e0b'; // IN_PROGRESS (Orange)
            return { fontWeight: 'bold', color: color, fontSize: '1rem' };
        },
        noOrders: { textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '1.1rem', border: '1px dashed #ccc', borderRadius: '8px' },
    };

    if (loading) {
        return <div style={styles.container}><p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#555' }}>Cargando tus pedidos...</p></div>;
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
                        style={{ ...styles.orderCard, backgroundColor: '#3b82f6', color: 'white', border: 'none', marginTop: '20px', cursor: 'pointer' }}
                    >
                        Volver a la Tienda
                    </button>
                </div>
            ) : (
                <div style={styles.orderList}>
                    {orders.map((order) => (
                        <div key={order.id_key} style={styles.orderCard}>
                            <div style={styles.orderHeader}>
                                <span style={styles.orderId}>Pedido #{order.id_key}</span>
                                <span style={styles.orderStatus(order.status)}>
                                    {ORDER_STATUS_MAP[order.status] || 'Desconocido'}
                                </span>
                            </div>
                            <p style={styles.orderDate}>
                                Fecha: {new Date(order.date).toLocaleDateString()}
                            </p>
                            <p>
                                Total de la Factura ({order.bill_id}): <span style={styles.orderTotal}>${order.total.toFixed(2)}</span>
                            </p>
                            <p>
                                Método de Entrega: {order.delivery_method === 3 ? 'A Domicilio' : 'Recoger en Tienda'}
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