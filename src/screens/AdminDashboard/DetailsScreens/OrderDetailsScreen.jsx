import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { CiUser, CiCalendar, CiDollar, CiShoppingCart, CiBoxList } from "react-icons/ci";
import { IoChevronBackCircle } from "react-icons/io5";
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
    3: 'A Domicilio (HOME_DELIVERY)',
}

// Función para simular una imagen forzada para el producto (placeholder)
const getForcedImageUrl = (id) => `https://placehold.co/80x80/ff5722/ffffff?text=P-${id}`;
const OrderDetailsScreen = () => {
    const { orderId } = useParams();
// Obtiene el ID del pedido de la URL
    const navigate = useNavigate();
// Estado local, aquí no usamos useSelector ya que esta vista es de ADMIN, no del cliente.
    // Usamos el mismo nombre para evitar un error de eslint de use-state sin importación.
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [statusUpdateError, setStatusUpdateError] = useState(null);
    const [error, setError] = useState(null);

    // =========================================================================
    // I. CARGA DE DATOS
    // =========================================================================
    
    const fetchOrderDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        setStatusUpdateError(null);
        
        try {
            // Llama al endpoint de detalle de pedido (GET /orders/{id})
     
            const response = await axios.get(`/orders/${orderId}`);
            setOrder(response.data);
            
        } catch (err) {
            console.error(`Error fetching order ${orderId}:`, err);
            setError(`Error al cargar los detalles del Pedido ID: ${orderId}.`);
            setOrder(null); 
     
        } finally {
            setLoading(false);
        }
    }, [orderId]);
    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId, fetchOrderDetails]);
// =========================================================================
    // II. LÓGICA DE ACTUALIZACIÓN DE ESTADO
    // =========================================================================

    const handleStatusChange = async (e) => {
        const newStatus = parseInt(e.target.value, 10);
// Confirmación para estados terminales (Entregado o Cancelado)
        if (newStatus === 3 || newStatus === 4) {
            const confirmation = window.confirm(`ADVERTENCIA: ¿Está seguro de cambiar el estado a '${ORDER_STATUS_MAP[newStatus]}'? Esta acción es definitiva.`);
            if (!confirmation) {
                // Si el administrador cancela, restablecemos el select al estado anterior
                e.target.value = order.status;
                return;
            }
        }
        
        setIsUpdatingStatus(true);
        setStatusUpdateError(null);
        
        try {
            // Utilizamos el endpoint PUT /orders/{id}
            const updatePayload = { 
                status: newStatus,
                date: new Date().toISOString(),
                client_id: order.client_id,
             
                bill_id: order.bill_id,
                total: order.total,
                delivery_method: order.delivery_method
                // Nota: Solo enviamos el campo que queremos actualizar
            };
            await axios.put(`/orders/${orderId}`, updatePayload);

            // Actualización exitosa en el servidor
            //alert(`Estado del pedido ${orderId} actualizado a: ${ORDER_STATUS_MAP[newStatus]}.`);
// Reflejamos el cambio inmediatamente en el estado local
            setOrder(prev => ({ ...prev, status: newStatus }));
        } catch (err) {
            console.error("Error al actualizar estado:", err);
            let message = "Error al actualizar el estado del pedido.";
            if (err.response?.status === 400 && err.response.data?.detail) {
                 message = `Error de la API: ${err.response.data.detail}`;
            }
            setStatusUpdateError(message);
        } finally {
            setIsUpdatingStatus(false);
        }
    };
// Función para obtener la clase CSS basada en el estado
    const getStatusStyle = (statusValue) => {
        let color = '#bdbdbd'; // Default gris
        let bgColor = '#424242';

        if (statusValue === 3) {
            color = '#10b981'; // DELIVERED (Green)
            bgColor = '#154030';
        }
        if (statusValue === 4) {
            color = '#ef4444'; // CANCELED (Red)
            bgColor = '#401818';
        }
        if (statusValue === 2) {
            color = '#ff5722'; // IN_PROGRESS (Rojo Primario)
            bgColor = '#402e18';
        }
        if (statusValue === 1) {
            color = '#3b82f6'; // PENDING (Azul)
            bgColor = '#10304a';
        }
        
        return { 
            fontWeight: 'bold', 
            color: color, 
            padding: '5px 12px', 
            borderRadius: '5px',
            backgroundColor: bgColor,
            border: `1px solid ${color}80`
       
        };
    };

    // =========================================================================
    // III.
// RENDERIZADO (MERCADO FAKE)
    // =========================================================================
    
    const styles = {
        container: { maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#e0e0e0' },
        header: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '25px', color: '#ff5722' },
        backButton: { 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            marginBottom: '20px', 
            backgroundColor: '#2e2e2e', 
            color: '#e0e0e0', 
            padding: '8px 15px', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            border: '1px solid #424242', 
            fontWeight: '600', 
            transition: 'background-color 0.15s' 
        },
        infoGrid: { 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px', 
            marginBottom: '30px' 
        },
        infoCard: { 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)', 
            backgroundColor: '#1e1e1e', // Fondo de tarjeta oscuro
            borderLeft: '4px solid #ff5722' // Rojo Primario
        },
        detailCard: { borderLeftColor: '#10b981' }, // Verde para detalles de productos
        clientCard: { borderLeftColor: '#3b82f6' }, // Azul para datos de cliente
        cardTitle: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '15px', color: '#bdbdbd' },
        infoRow: { 
            marginBottom: '10px', 
            fontSize: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            borderBottom: '1px dotted #424242', 
            paddingBottom: '5px'
        },
        label: { fontWeight: '600', color: '#bdbdbd', minWidth: '80px' },
        detailTable: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
        th: { padding: '12px 15px', textAlign: 'left', backgroundColor: '#2e2e2e', borderBottom: '2px solid #424242', color: '#bdbdbd', fontSize: '0.9rem', textTransform: 'uppercase' },
        td: { padding: '12px 15px', borderBottom: '1px solid #424242', color: '#e0e0e0' },
        totalRow: { backgroundColor: '#301818', fontWeight: 'bold', borderTop: '2px solid #ff5722' },
        loadingText: { textAlign: 'center', 
            color: '#ff5722', fontSize: '1.2rem', margin: '40px 0' 
        },
        errorText: { textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin: '40px 0' },
        // Estilos para el Select de estado
        statusSelect: { 
            padding: '8px 12px', 
            borderRadius: '5px', 
            border: '1px solid #424242', 
     
            backgroundColor: '#1e1e1e', 
            color: '#e0e0e0',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'border-color 0.15s',
            minWidth: '150px'
        },
        statusUpdateBox: { 
            padding: '15px', 
      
            borderRadius: '8px', 
            backgroundColor: '#2e2e2e', 
            border: '1px solid #ff5722', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
        }
  
    };
    
    // Handler para hover del botón de atrás
    const handleBackHover = (e, hover) => {
        e.currentTarget.style.backgroundColor = hover ? '#383838' : styles.backButton.backgroundColor;
    };

    if (loading) {
        return <div style={styles.container}><p style={styles.loadingText}>Cargando detalles del pedido...</p></div>;
    }

    if (error || !order) {
        return <div style={styles.container}><p style={styles.errorText}>{error || 'Pedido no encontrado.'}</p></div>;
    }
    
    // Obtener los detalles del pedido y la información del cliente (asumiendo que están anidados)
    const orderDetails = order.order_details || [];
    const client = order.client || { name: 'N/A', email: 'N/A' };
    
    return (
        <div style={styles.container}>
            
            <button 
                style={styles.backButton} 
                onClick={() => navigate('/admin/orders')}
                onMouseEnter={(e) => handleBackHover(e, true)}
                onMouseLeave={(e) => handleBackHover(e, false)}
            >
                <IoChevronBackCircle size={20} />
                Volver al Listado
            </button>
            
            <h1 style={styles.header}>Detalles del Pedido #{order.id_key}</h1>

  
            {/* Box de Actualización de Estado */}
            <div style={styles.statusUpdateBox}>
                <h2 style={{...styles.cardTitle, margin: 0, fontSize: '1.2rem', color: '#ff5722'}}>
                    Actualizar Estado
                </h2>
           
                <select
                    value={order.status}
                    onChange={handleStatusChange}
                    disabled={isUpdatingStatus}
                   
                    style={{...styles.statusSelect, borderColor: statusUpdateError ? '#ef4444' : styles.statusSelect.borderColor}}
                >
                    {Object.entries(ORDER_STATUS_MAP).map(([key, value]) => (
                        <option key={key} value={key}>
                            
                            {value}
                        </option>
                    ))}
                </select>

                {isUpdatingStatus && <span style={{ color: '#3b82f6' }}>Guardando...</span>}
                {statusUpdateError && 
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{statusUpdateError}</span>
                }
            </div>


            {/* Grid de Información Principal */}
            <div style={styles.infoGrid}>
                
                {/* 1. Información General del Pedido */}
              
                <div style={{ ...styles.infoCard, borderLeftColor: '#ff5722' }}>
                    <h2 style={styles.cardTitle}>Información General</h2>
                    <div style={styles.infoRow}>
                        <span style={styles.label}><CiCalendar size={18} /> Fecha:</span>
                      
                        <span>{new Date(order.date).toLocaleDateString()}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>Estado Actual:</span>
                        <span style={getStatusStyle(order.status)}>
     
                            {ORDER_STATUS_MAP[order.status] || 'Desconocido'}
                        </span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>Entrega:</span>
          
                        <span>{DELIVERY_METHOD_MAP[order.delivery_method] || 'N/A'}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}><CiDollar size={18} /> Total:</span>
                        <span style={{ fontWeight: 'bold', color: '#10b981' }}>${order.total.toFixed(2)}</span>
 
                    </div>
                </div>

                {/* 2. Información del Cliente */}
                <div style={{ ...styles.infoCard, borderLeftColor: '#3b82f6' }}>
                    <h2 style={styles.cardTitle}>Datos del Cliente</h2>
                    <div style={styles.infoRow}>
                        <span style={styles.label}><CiUser size={18} /> ID:</span>
                        <span style={{ cursor: 'pointer', color: '#3b82f6', fontWeight: 'bold' }} 
                  
                            onClick={() => navigate(`/admin/clients/${order.client_id}`)}
                        >
                            {order.client_id}
                        </span>
            
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>Nombre:</span>
                        <span>{client.name} {client.lastname}</span>
                    </div>
 
                    <div style={styles.infoRow}>
                        <span style={styles.label}>Email:</span>
                        <span>{client.email}</span>
                    </div>
           
                    <div style={styles.infoRow}>
                        <span style={styles.label}>Teléfono:</span>
                        <span>{client.telephone || 'N/A'}</span>
                    </div>
                </div>

            </div>

            {/* Tabla de Detalles del Pedido (Productos) */}
            <h2 style={{...styles.cardTitle, borderBottom: '1px solid #424242', paddingBottom: '5px'}}>
                <CiBoxList size={22} style={{verticalAlign: 'middle', marginRight: '8px'}} />
                Productos Comprados ({orderDetails.length})
            </h2>
            
            <div style={{...styles.infoCard, padding: '0', borderLeft: 'none', boxShadow: 'none', backgroundColor: 'transparent'}}>
                <table style={styles.detailTable}>
                    <thead>
      
                        <tr>
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
              
                                <td style={{...styles.td, color: '#ff5722', fontWeight: 'bold'}}>
                                    {/* Link a los detalles del producto (si la ruta existe) */}
                              
                                    <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${detail.product_id}`)}>
                                        {detail.product_id}
                                    </span>
           
                                </td>
                                {/* Asumimos que el detalle incluye el nombre del producto (Product{}) */}
                                <td style={styles.td}>{detail.product?.name || 'Producto Desconocido'}</td>
                                <td style={styles.td}>{detail.quantity}</td>
                                <td style={styles.td}>${detail.price.toFixed(2)}</td>
                                <td 
                                style={styles.td}>${(detail.price * detail.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                        <tr style={styles.totalRow}>
                     
                            <td colSpan="4" style={{...styles.td, textAlign: 'right', borderBottom: 'none'}}>TOTAL FINAL:</td>
                            <td style={{...styles.td, color: '#10b981', borderBottom: 'none'}}>${order.total.toFixed(2)}</td>
                        </tr>
                    </tbody>
               
                </table>
            </div>

            {/* Enlace a la Factura (Bill) */}
            <p style={{ marginTop: '20px', textAlign: 'right', fontSize: '1.1rem', color: '#bdbdbd' }}>
                <span style={{ fontWeight: 'bold', color: '#e0e0e0' }}>Factura Asociada:</span> 
                <span 
                    style={{ color: '#ff5722', marginLeft: '10px', cursor: 'pointer', fontWeight: 'bold' }} 
                    onClick={() => navigate(`/admin/bills/${order.bill_id}`)}
                >
                    {order.bill_id}
                </span>
            </p>
        </div>
    );
};

export default OrderDetailsScreen;