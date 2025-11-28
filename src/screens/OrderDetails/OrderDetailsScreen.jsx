import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CiBack, CiCalendar, CiDollar, CiDeliveryTruck, CiBox, CiUser } from "react-icons/ci";

// Mapeo de valores de ENUM (Status)
const ORDER_STATUS_MAP = {
    1: 'Pendiente',      
    2: 'En Progreso',    
    3: 'Entregado',      
    4: 'Cancelado',      
};
// Mapeo de valores de ENUM (Delivery Method)
const DELIVERY_METHOD_MAP = {
    1: 'Recoger en Tienda (DRIVE_THRU)',
    2: 'Recoger en Tienda (ON_HAND)',
    3: 'Envío a Domicilio (HOME_DELIVERY)',
}

// Función para simular una imagen forzada para el producto (placeholder)
const getForcedImageUrl = (id) => `https://placehold.co/80x80/2563eb/ffffff?text=P-${id}`; 

const OrderDetailsScreen = () => {
    const { orderId } = useParams(); // Obtiene el ID del pedido de la URL
    const navigate = useNavigate();
    
    // Validar que solo el cliente loggeado vea su propio pedido
    const { client_id, isLoggedIn } = useSelector(state => state.auth);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // =========================================================================
    // I. CARGA DE DATOS
    // =========================================================================
    
    const fetchOrderDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        if (!isLoggedIn || !client_id) {
            navigate('/login');
            return;
        }
        
        try {
            // Llama al endpoint de detalle de pedido (GET /orders/{id})
            const response = await axios.get(`/orders/${orderId}`);
            
            // Seguridad básica en el frontend: verificar que el pedido pertenece al cliente actual
            if (response.data.client_id !== parseInt(client_id, 10)) {
                 setError('Acceso Denegado: Este pedido no pertenece a tu cuenta.');
                 setOrder(null);
                 return;
            }
            
            setOrder(response.data);
            
        } catch (err) {
            console.error(`Error fetching order ${orderId}:`, err);
            setError(`Error al cargar el Pedido ID: ${orderId}.`);
            setOrder(null); 
        } finally {
            setLoading(false);
        }
    }, [orderId, client_id, isLoggedIn, navigate]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    // =========================================================================
    // II. RENDERIZADO
    // =========================================================================
    
    // Función para obtener el estilo del estado
    const getStatusStyle = (statusValue) => {
        let color = '#6b7280'; // Default gray
        if (statusValue === 3) color = '#10b981'; // DELIVERED (Green)
        if (statusValue === 4) color = '#ef4444'; // CANCELED (Red)
        if (statusValue === 2) color = '#f59e0b'; // IN_PROGRESS (Orange)
        return { 
            fontWeight: 'bold', 
            color: color, 
            backgroundColor: `${color}1A`,
            padding: '5px 12px',
            borderRadius: '5px',
        };
    };

    const styles = {
        container: { maxWidth: '900px', margin: '40px auto', padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' },
        header: { fontSize: '2.5rem', fontWeight: 'bold', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px', marginBottom: '20px', color: '#3b82f6' },
        backButton: { display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', backgroundColor: '#f3f4f6', color: '#1f2937', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', border: '1px solid #e5e7eb', fontWeight: '600', transition: 'background-color 0.15s' },
        
        infoCard: { display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '30px', padding: '20px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#f9fafb' },
        infoItem: { flex: 1, minWidth: '180px' },
        infoLabel: { fontSize: '0.9rem', color: '#6b7280', fontWeight: '600', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' },
        infoValue: { fontSize: '1.2rem', fontWeight: 'bold', color: '#1f2937' },
        
        detailsHeader: { fontSize: '1.8rem', fontWeight: 'bold', borderBottom: '1px solid #d1d5db', paddingBottom: '5px', marginBottom: '15px' },
        detailTable: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
        th: { padding: '12px 15px', textAlign: 'left', backgroundColor: '#e5e7eb', borderBottom: '2px solid #d1d5db', color: '#374151', fontSize: '0.9rem', textTransform: 'uppercase' },
        td: { padding: '12px 15px', borderBottom: '1px solid #f3f4f6', fontSize: '1rem', color: '#4b5563' },
        totalRow: { backgroundColor: '#e5f7ed', fontWeight: 'bold', borderTop: '2px solid #10b981' },
        loadingText: { textAlign: 'center', color: '#3b82f6', fontSize: '1.2rem', margin: '40px 0' },
        errorText: { textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin: '40px 0' },
    };

    if (loading) {
        return <div style={styles.container}><p style={styles.loadingText}>Cargando detalles del pedido...</p></div>;
    }

    if (error || !order) {
        return <div style={styles.container}><p style={styles.errorText}>{error || 'Pedido no encontrado o acceso no autorizado.'}</p></div>;
    }
    
    const orderDetails = order.order_details || [];
    const orderDate = new Date(order.date).toLocaleDateString();

    return (
        <div style={styles.container}>
            
            <button 
                style={styles.backButton} 
                onClick={() => navigate('/orders')}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d1d5db'}
                onMouseLeave={(e) => e.target.style.backgroundColor = styles.backButton.backgroundColor}
            >
                <CiBack size={20} />
                Volver a Mis Pedidos
            </button>
            
            <h1 style={styles.header}>Recibo de Pedido #{order.id_key}</h1>

            {/* Tarjeta de Información Principal */}
            <div style={styles.infoCard}>
                
                <div style={styles.infoItem}>
                    <p style={styles.infoLabel}><CiCalendar size={18} /> Fecha del Pedido</p>
                    <p style={styles.infoValue}>{orderDate}</p>
                </div>
                
                <div style={styles.infoItem}>
                    <p style={styles.infoLabel}><CiDeliveryTruck size={18} /> Estado</p>
                    <div style={{ padding: '0', display: 'inline-block' }}>
                        <span style={getStatusStyle(order.status)}>
                            {ORDER_STATUS_MAP[order.status] || 'Desconocido'}
                        </span>
                    </div>
                </div>

                <div style={styles.infoItem}>
                    <p style={styles.infoLabel}><CiDollar size={18} /> Total Pagado</p>
                    <p style={{...styles.infoValue, color: '#10b981'}}>${order.total.toFixed(2)}</p>
                </div>

                <div style={styles.infoItem}>
                    <p style={styles.infoLabel}><CiDeliveryTruck size={18} /> Método de Entrega</p>
                    <p style={styles.infoValue}>
                        {DELIVERY_METHOD_MAP[order.delivery_method] || 'N/A'}
                    </p>
                </div>
            </div>

            {/* Tabla de Detalles del Pedido (Productos) */}
            <h2 style={styles.detailsHeader}>Artículos ({orderDetails.length})</h2>
            
            <div style={{...styles.infoCard, padding: '0', border: 'none', boxShadow: 'none', backgroundColor: 'white'}}>
                <table style={styles.detailTable}>
                    <thead>
                        <tr>
                            <th style={styles.th}></th>
                            <th style={styles.th}>Producto ID</th>
                            <th style={styles.th}>Nombre del Producto</th>
                            <th style={styles.th}>Cantidad</th>
                            <th style={styles.th}>Precio Unitario</th>
                            <th style={styles.th}>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderDetails.map((detail) => (
                            <tr key={detail.id_key}>
                                <td style={styles.td}>
                                     <img 
                                        src={getForcedImageUrl(detail.product_id)} 
                                        alt={detail.product?.name || 'Producto'} 
                                        style={{ width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover' }}
                                    />
                                </td>
                                <td style={{...styles.td, color: '#3b82f6', cursor: 'pointer'}}
                                    onClick={() => navigate(`/products/${detail.product_id}`)}
                                >
                                    <span style={{fontWeight: 'bold'}}>{detail.product_id}</span>
                                </td>
                                {/* Asumimos que el detalle incluye el nombre del producto (Product{}) */}
                                <td style={styles.td}>{detail.product?.name || 'Producto Desconocido'}</td>
                                <td style={styles.td}>{detail.quantity}</td>
                                <td style={styles.td}>${detail.price.toFixed(2)}</td>
                                <td style={{...styles.td, fontWeight: 'bold'}}>${(detail.price * detail.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                        <tr style={styles.totalRow}>
                            <td colSpan="5" style={{...styles.td, textAlign: 'right'}}>TOTAL FINAL:</td>
                            <td style={styles.td}>${order.total.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Referencia de Cliente y Factura (Opcional para el cliente) */}
            <div style={{ marginTop: '30px', textAlign: 'right', color: '#6b7280', fontSize: '0.9rem' }}>
                <p>Factura Asociada: <span style={{fontWeight: 'bold'}}>{order.bill_id}</span></p>
                <p>Tu ID de Cliente: <span style={{fontWeight: 'bold'}}>{order.client_id}</span></p>
            </div>
            
        </div>
    );
};

export default OrderDetailsScreen;