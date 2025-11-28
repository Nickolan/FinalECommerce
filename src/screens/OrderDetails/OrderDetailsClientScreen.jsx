import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CiCalendar, CiDollar, CiDeliveryTruck, CiUser } from "react-icons/ci";
import { IoChevronBackCircle, IoStar } from "react-icons/io5";

// Mapeo de valores de ENUM (Status)
const ORDER_STATUS_MAP = {
    1: 'Pendiente',      // PENDING [cite: 1174]
    2: 'En Progreso',    // IN_PROGRESS [cite: 1174]
    3: 'Entregado',      // DELIVERED [cite: 1174]
    4: 'Cancelado',      // CANCELED [cite: 1174]
};
// Mapeo de valores de ENUM (Delivery Method)
const DELIVERY_METHOD_MAP = {
    1: 'Recoger en Tienda (DRIVE_THRU)', // DRIVE_THRU [cite: 1175]
    2: 'Recoger en Tienda (ON_HAND)',    // ON_HAND [cite: 1175]
    3: 'Envío a Domicilio (HOME_DELIVERY)', // HOME_DELIVERY [cite: 1175]
}

// Estado 'Entregado'
const STATUS_DELIVERED = 3; // [cite: 1176]
// Estado 'Cancelado'
const STATUS_CANCELED = 4; // [cite: 1176]
// Estados que pueden ser cancelados (Pendiente o En Progreso)
const CANCELLABLE_STATUSES = [1, 2]; // [cite: 1176]
// Función para simular una imagen forzada para el producto (placeholder)
const getForcedImageUrl = (id) => `https://placehold.co/80x80/ff5722/ffffff?text=P-${id}`;
const OrderDetailsClientScreen = () => {
    const { orderId } = useParams();
// Obtiene el ID del pedido de la URL [cite: 1179]
    const navigate = useNavigate();
    const { client_id, isLoggedIn } = useSelector(state => state.auth);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState(null);
    const [cancelError, setCancelError] = useState(null);
// =========================================================================
    // I. CARGA DE DATOS
    // =========================================================================
    
    const fetchOrderDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        setCancelError(null);
        
        if (!isLoggedIn || !client_id) {
            navigate('/login');
            return;
    
        }
        
        try {
            const response = await axios.get(`/orders/${orderId}`);
            
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
    // II. LÓGICA DE CANCELACIÓN Y NAVEGACIÓN
    // =========================================================================

    const handleCancelOrder = async () => {
        if (!order || !CANCELLABLE_STATUSES.includes(order.status)) {
            setCancelError('Este pedido ya no puede ser cancelado.');
            return;
        }

        const confirmation = window.confirm(`¿Estás seguro de que deseas cancelar el Pedido #${order.id_key}? Esta acción no se puede revertir.`);
        if (!confirmation) return;

        setIsCancelling(true);
        setCancelError(null);

        try {
            const cancelPayload = { 
                status: STATUS_CANCELED,
                date: new Date().toISOString(),
                client_id: order.client_id,
                bill_id: order.bill_id,
         
                total: order.total,
                delivery_method: order.delivery_method
                // Nota: Solo enviamos los campos que queremos actualizar
            };
            await axios.put(`/orders/${orderId}`, cancelPayload);

            alert(`✅ Pedido #${order.id_key} ha sido CANCELADO con éxito.`);
            
            fetchOrderDetails();
        } catch (err) {
            console.error("Error al cancelar pedido:", err);
            let message = "Error al intentar cancelar el pedido. El servidor pudo haber rechazado la acción.";
            if (err.response?.status === 400 && err.response.data?.detail) {
                 message = `Error de la API: ${err.response.data.detail}`;
            }
            setCancelError(message);
        } finally {
            setIsCancelling(false);
        }
    };
// Nueva función para navegar a la pantalla de reseña
    const handleReviewClick = () => {
        // Navega a la ruta de reseña, pasando el orderId
        navigate(`/orders/${orderId}/review`);
    };


    // =========================================================================
    // III. RENDERIZADO
    // =========================================================================
    
    // Función para obtener el estilo del estado
    const getStatusStyle = (statusValue) => {
        let color = '#bdbdbd'; // Default gris
// Default gray [cite: 1200]
        if (statusValue === STATUS_DELIVERED) color = '#10b981';
// DELIVERED (Green) [cite: 1201]
        if (statusValue === STATUS_CANCELED) color = '#ef4444';
// CANCELED (Red) [cite: 1202]
        if (statusValue === 2) color = '#ff5722'; // IN_PROGRESS (Rojo Primario)
// IN_PROGRESS (Orange) [cite: 1203]
        return { 
            fontWeight: 'bold', 
            color: color, 
            backgroundColor: `${color}1A`, // Fondo con opacidad
            padding: '5px 12px',
            borderRadius: '5px',
            border: `1px solid ${color}80`
        };
    };

    const styles = {
        container: { 
            maxWidth: '900px', 
            margin: '40px auto', 
            padding: '30px', 
            fontFamily: 'Arial, sans-serif', 
            backgroundColor: '#1e1e1e', // Fondo de la tarjeta principal
            borderRadius: '10px', 
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
            color: '#e0e0e0',
        },
        header: { 
            fontSize: '2rem', 
            fontWeight: '700', 
            borderBottom: '2px solid #424242', 
            paddingBottom: '10px', 
            marginBottom: '20px', 
            color: '#ff5722' // Rojo Primario
        },
        backButton: { 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            marginBottom: '20px', 
            backgroundColor: '#2e2e2e', // Fondo de botón oscuro
            color: '#e0e0e0', 
            padding: '8px 15px', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            border: '1px solid #424242', 
            fontWeight: '600', 
            transition: 'background-color 0.15s' 
        },
  
        infoCard: { 
            display: 'flex', 
            justifyContent: 'space-between', 
            gap: '20px', 
            marginBottom: '30px', 
            padding: '20px', 
            border: '1px solid #424242', 
            borderRadius: '8px', 
            backgroundColor: '#2e2e2e', // Fondo de la tarjeta de info
            flexWrap: 'wrap' 
        },
        infoItem: { flex: 1, minWidth: '180px' },
        infoLabel: { 
            fontSize: '0.9rem', 
            color: '#bdbdbd', 
            fontWeight: '600', 
            marginBottom: '5px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px' 
        },
        infoValue: { 
            fontSize: '1.2rem', 
            fontWeight: 'bold', 
            color: '#e0e0e0' 
        },
        
        detailsHeader: { 
            fontSize: '1.8rem', 
            fontWeight: 'bold', 
            borderBottom: '1px solid #424242', 
            paddingBottom: '5px', 
            marginBottom: '15px' 
        },
        detailTable: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
        th: { 
            padding: '12px 15px', 
            textAlign: 'left', 
            backgroundColor: '#2e2e2e', // Fondo de encabezado de tabla
            borderBottom: '2px solid #424242', 
            color: '#bdbdbd', 
            fontSize: '0.9rem', 
            textTransform: 'uppercase' 
        },
        td: { 
            padding: '12px 15px', 
            borderBottom: '1px solid #424242', 
            fontSize: '1rem', 
            color: '#e0e0e0' 
        },
        totalRow: { 
            backgroundColor: '#301818', // Fondo rojo oscuro para total
            fontWeight: 'bold', 
            borderTop: '2px solid #ff5722' // Borde rojo primario
        },
        loadingText: { textAlign: 'center', color: '#ff5722', fontSize: '1.2rem', margin: '40px 0' },
        errorText: { textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin: '40px 0' },

        cancelButton: { 
            padding: '12px 20px', 
            backgroundColor: '#ef4444', // Rojo estándar de peligro
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'background-color 0.2s',
            marginLeft: '20px', 
        },
   
        reviewButton: {
             padding: '12px 20px', 
            backgroundColor: '#ff5722', // Rojo Primario para Reseña
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
    
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'background-color 0.2s',
            marginLeft: '20px', 
        },
        cancelWarningBox: { 
            backgroundColor: '#401818', // Fondo rojo oscuro
            color: '#ef4444', 
            border: '1px solid #dc2626', 
            padding: '15px', 
            borderRadius: '8px'
        }
    };
if (loading) {
        return <div style={styles.container}><p style={styles.loadingText}>Cargando detalles del pedido...</p></div>;
}

    if (error || !order) {
        return <div style={styles.container}><p style={styles.errorText}>{error || 'Pedido no encontrado o acceso no autorizado.'}</p></div>;
    }
    
    const orderDetails = order.order_details || []; // [cite: 1214]
    const orderDate = new Date(order.date).toLocaleDateString(); // [cite: 1214]
    
    const isCancelable = CANCELLABLE_STATUSES.includes(order.status); // [cite: 1214]
    const isDelivered = order.status === STATUS_DELIVERED; // [cite: 1214]
return (
        <div style={styles.container}>
            
            <button 
                style={styles.backButton} 
                onClick={() => navigate('/orders')}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#383838'}
          
                onMouseLeave={(e) => e.target.style.backgroundColor = styles.backButton.backgroundColor}
            >
                <IoChevronBackCircle size={20} />
                Volver a Mis Pedidos
            </button>
            
            <div style={{ display: 'flex', justifyContent: 
'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={styles.header}>Recibo de Pedido #{order.id_key}</h1>
                
                {/* Botones de Acción */}
                <div>
                    {/* Botón de 
                     Cancelación (Solo si es cancelable) */}
                    {isCancelable && (
                        <button
                            onClick={handleCancelOrder}
                     
                            disabled={isCancelling}
                            style={{
                                ...styles.cancelButton,
                                ...(isCancelling 
? { opacity: 0.6, cursor: 'not-allowed' } : {})
                            }}
                            onMouseEnter={(e) => { if (!isCancelling) e.target.style.backgroundColor = '#dc2626'; }}
                            onMouseLeave={(e) => { if (!isCancelling) e.target.style.backgroundColor = styles.cancelButton.backgroundColor; }}
                        >
                            {isCancelling ?
'Procesando...' : 'CANCELAR PEDIDO'}
                        </button>
                    )}
                    
                    {/* Botón Dejar Reseña (Solo si está entregado) */}
     
                    {isDelivered && (
                        <button
                            onClick={handleReviewClick}
                            style={styles.reviewButton}
   
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#e64a19'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = styles.reviewButton.backgroundColor}
                        >
               
                            <IoStar size={18} style={{verticalAlign: 'middle', marginRight: '5px'}}/>
                            Dejar Reseña
                        </button>
                    )}
         
                </div>
            </div>

            {/* Mensajes de Estado y Error */}
            {cancelError && <div style={{...styles.cancelWarningBox, marginBottom: '15px'}}>{cancelError}</div>}
            {order.status === STATUS_CANCELED && (
                <div style={{...styles.cancelWarningBox, marginBottom: '15px', color: '#ef4444', backgroundColor: '#401818', border: '1px solid #dc2626'}}>
   
                 ESTE PEDIDO HA SIDO CANCELADO.
                </div>
            )}
            {!isCancelable && !isDelivered && order.status !== STATUS_CANCELED && (
                <div style={{...styles.cancelWarningBox, marginBottom: '15px', color: '#ff5722', backgroundColor: '#402e18', border: '1px solid #a0522d'}}>
                    El pedido está en estado **{ORDER_STATUS_MAP[order.status]}**. No es cancelable ni está listo para reseña.
      
                </div>
            )}

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
                    <p style={styles.infoLabel}><CiDollar size={18} 
/> Total Pagado</p>
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
            
       
            <div style={{...styles.infoCard, padding: '0', border: 'none', boxShadow: 'none', backgroundColor: 'transparent'}}>
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
                                <td style={{...styles.td, color: '#ff5722', cursor: 'pointer'}}
                                    onClick={() => navigate(`/products/${detail.product_id}`)}
       
                                    >
                                    <span style={{fontWeight: 'bold'}}>{detail.product_id}</span>
                                </td>
     
                                <td style={styles.td}>{detail.product?.name || 'Producto Desconocido'}</td>
                                <td style={styles.td}>{detail.quantity}</td>
                                <td style={styles.td}>${detail.price.toFixed(2)}</td>
                                <td 
                                style={{...styles.td, fontWeight: 'bold'}}>${(detail.price * detail.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                        <tr style={styles.totalRow}>
                   
                            <td colSpan="5" style={{...styles.td, textAlign: 'right', borderBottom: 'none'}}>TOTAL FINAL:</td>
                            <td style={{...styles.td, color: '#10b981', borderBottom: 'none'}}>${order.total.toFixed(2)}</td>
                        </tr>
                    </tbody>
             
                </table>
            </div>

            {/* Referencia de Cliente y Factura (Opcional para el cliente) */}
            <div style={{ marginTop: '30px', textAlign: 'right', color: '#bdbdbd', fontSize: '0.9rem' }}>
                <p>Factura Asociada: <span style={{fontWeight: 'bold'}}>{order.bill_id}</span></p>
                <p>Tu ID de Cliente: <span 
                style={{fontWeight: 'bold'}}>{order.client_id}</span></p>
            </div>
            
        </div>
    );
};

export default OrderDetailsClientScreen;