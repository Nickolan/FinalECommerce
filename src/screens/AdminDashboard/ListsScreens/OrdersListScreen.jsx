import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CiSearch, CiDeliveryTruck, CiCalendar, CiDollar, CiUser } from "react-icons/ci";
// Mapeo de valores de ENUM (Status) para mostrar texto legible
const ORDER_STATUS_MAP = {
    1: 'Pendiente',      // PENDING
    2: 'En Progreso',    // IN_PROGRESS
    3: 'Entregado',      // DELIVERED
    4: 'Cancelado',      // CANCELED
};
const OrdersListScreen = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
// Límite de pedidos a cargar (simulando paginación con un límite alto)
    const ORDER_LIMIT = 50;
// =========================================================================
    // I. CARGA DE DATOS
    // =========================================================================
    
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Llama al endpoint de listado de pedidos
            // NOTA: Asumimos que la API devuelve los 
            const url = `/orders?skip=0&limit=${ORDER_LIMIT}`;
            const response = await axios.get(url);
            
            // Ordenar por fecha descendente
            const sortedOrders = response.data.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
  
            );
            
            setOrders(sortedOrders);
            
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError("Error al cargar la lista de pedidos. Verifique la conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
// =========================================================================
    // II. LÓGICA DE FILTRADO (Lado del Cliente)
    // =========================================================================
    
    // Filtrado local por ID de Pedido, ID de Cliente o Total
    const filteredOrders = orders.filter(order => {
        const term = searchTerm.toLowerCase();
        return (
            String(order.id_key).includes(term) || // Por ID de Pedido
            String(order.client_id).includes(term) || // Por ID 
            String(order.total).includes(term) || // Por Total
            ORDER_STATUS_MAP[order.status]?.toLowerCase().includes(term)
        );
    });
// Función para obtener la clase CSS basada en el estado (ACTUALIZADO)
    const getStatusStyle = (statusValue) => {
        let color = '#bdbdbd'; // Default gris
        let bgColor = '#424242';
// Default gray
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
            padding: '5px 10px', 
            borderRadius: '5px',
            backgroundColor: bgColor,
            border: `1px solid ${color}80` // Borde semi-transparente
        };
    };

    // =========================================================================
    // III. HANDLERS Y ESTILOS (MERCADO FAKE)
    // =========================================================================
    
    const handleRowClick = (orderId) => {
        // Redirige a la pantalla de detalles
        navigate(`/admin/orders/${orderId}`);
    };

    const styles = {
        container: { padding: '0 10px', maxWidth: '100%', fontFamily: 'Arial, sans-serif' },
        header: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '20px', color: '#ff5722' },
        searchContainer: { 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '30px', 
            padding: '15px', 
            backgroundColor: '#1e1e1e', 
            borderRadius: '8px', 
            border: '1px solid #424242' 
        },
        searchInput: { 
            flexGrow: 1, 
            padding: '10px', 
            borderRadius: '5px', 
            border: '1px solid #424242', 
            marginLeft: '10px', 
            fontSize: '1rem',
            backgroundColor: '#2e2e2e', 
            color: '#e0e0e0'
        },
        tableContainer: { overflowX: 
            'auto', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)', 
            borderRadius: '8px' 
        },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#1e1e1e' },
        th: { 
            padding: '12px 15px', 
            textAlign: 'left', 
            backgroundColor: '#2e2e2e', 
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
        tr: { cursor: 'pointer', transition: 'background-color 0.15s' },
        trHover: { 
            backgroundColor: '#2e2e2e', 
        },
        loadingText: { textAlign: 'center', color: '#ff5722', fontSize: '1.2rem', margin: '40px 0' },
        errorText: { textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin: '40px 0' },
        iconStyle: { color: '#bdbdbd' }
    };

    // Función para manejar el hover en el input de búsqueda
    const handleSearchInputFocus = (e) => {
        e.target.style.borderColor = '#ff5722'; // Borde rojo al enfocar
    };
    const handleSearchInputBlur = (e) => {
        e.target.style.borderColor = '#424242'; // Restaurar el borde
    };
    
if (loading) {
        return <div style={styles.container}><p style={styles.loadingText}>Cargando lista de pedidos...</p></div>;
}

    if (error) {
        return <div style={styles.container}><p style={styles.errorText}>Error: {error}</p></div>;
}

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Gestión de Pedidos ({orders.length} Total)</h1>
            
            {/* Barra de Búsqueda */}
            <div style={styles.searchContainer}>
                <CiSearch size={20} style={styles.iconStyle} />
         
                <input
                    type="text"
                    placeholder="Buscar por ID de Pedido, ID de Cliente o Estado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
  
                    style={styles.searchInput}
                    onFocus={handleSearchInputFocus}
                    onBlur={handleSearchInputBlur}
                />
            </div>
            
            {/* Tabla de Pedidos */}
            <div style={styles.tableContainer}>
             
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID Pedido</th>
                      
                            <th style={styles.th}><CiCalendar size={18} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Fecha</th>
                            <th style={styles.th}><CiUser size={18} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Cliente ID</th>
                            <th style={styles.th}>Estado</th>
                    
                            <th style={styles.th}><CiDollar size={18} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Total</th>
                        </tr>
                    </thead>
                    <tbody>
                    
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                                <tr 
                             
                                    key={order.id_key} 
                                    style={styles.tr}
                                    onClick={() => handleRowClick(order.id_key)}
                  
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.trHover.backgroundColor}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.table.backgroundColor}
                                >
      
                                    <td style={{...styles.td, color: '#ff5722', fontWeight: 'bold'}}>{order.id_key}</td>
                                    <td style={styles.td}>{new Date(order.date).toLocaleDateString()}</td>
                               
                                    <td style={{...styles.td, color: '#3b82f6', fontWeight: 'bold'}}>{order.client_id}</td>
                                    <td style={styles.td}>
                                        <span style={getStatusStyle(order.status)}>
                
                                            {ORDER_STATUS_MAP[order.status] || 'Desconocido'}
                                        </span>
                                    </td>
                        
                                    <td style={{...styles.td, fontWeight: 'bold', color: '#10b981'}}>${order.total.toFixed(2)}</td>
                                </tr>
                            ))
                       
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: '#bdbdbd' }}>
                               
                                    No se encontraron pedidos que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
   
                    </tbody>
                </table>
            </div>

            {orders.length > ORDER_LIMIT && (
                <p style={{ marginTop: '20px', color: '#ff5722', fontWeight: 'bold' }}>
               
                    Solo se muestran los primeros {ORDER_LIMIT} pedidos (Límite de la API).
                </p>
            )}
        </div>
    );
};

export default OrdersListScreen;