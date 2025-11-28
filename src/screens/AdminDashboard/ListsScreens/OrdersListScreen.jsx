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
            // NOTA: Asumimos que la API devuelve los pedidos completos
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
            String(order.client_id).includes(term) || // Por ID de Cliente
            String(order.total).includes(term) || // Por Total
            ORDER_STATUS_MAP[order.status]?.toLowerCase().includes(term)
        );
    });
    
    // Función para obtener la clase CSS basada en el estado
    const getStatusStyle = (statusValue) => {
        let color = '#6b7280'; // Default gray
        if (statusValue === 3) color = '#10b981'; // DELIVERED (Green)
        if (statusValue === 4) color = '#ef4444'; // CANCELED (Red)
        if (statusValue === 2) color = '#f59e0b'; // IN_PROGRESS (Orange)
        return { 
            fontWeight: 'bold', 
            color: 'white', 
            padding: '5px 10px', 
            borderRadius: '5px',
            backgroundColor: color
        };
    };

    // =========================================================================
    // III. HANDLERS Y ESTILOS
    // =========================================================================
    
    const handleRowClick = (orderId) => {
        // Redirige a la pantalla de detalles
        navigate(`/admin/orders/${orderId}`);
    };

    const styles = {
        container: { padding: '30px', maxWidth: '100%', fontFamily: 'Arial, sans-serif' },
        header: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' },
        searchContainer: { display: 'flex', alignItems: 'center', marginBottom: '30px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' },
        searchInput: { flexGrow: 1, padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db', marginLeft: '10px', fontSize: '1rem' },
        tableContainer: { overflowX: 'auto', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', borderRadius: '8px' },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' },
        th: { padding: '12px 15px', textAlign: 'left', backgroundColor: '#e5e7eb', borderBottom: '2px solid #d1d5db', color: '#374151', fontSize: '0.9rem', textTransform: 'uppercase' },
        td: { padding: '12px 15px', borderBottom: '1px solid #f3f4f6', fontSize: '1rem', color: '#4b5563' },
        tr: { cursor: 'pointer', transition: 'background-color 0.15s' },
        trHover: { backgroundColor: '#f5f5f5' },
        loadingText: { textAlign: 'center', color: '#3b82f6', fontSize: '1.2rem', margin: '40px 0' },
        errorText: { textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin: '40px 0' },
        iconStyle: { color: '#6b7280' }
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
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    <td style={styles.td}>{order.id_key}</td>
                                    <td style={styles.td}>{new Date(order.date).toLocaleDateString()}</td>
                                    <td style={styles.td}>{order.client_id}</td>
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
                                <td colSpan="5" style={{ ...styles.td, textAlign: 'center' }}>
                                    No se encontraron pedidos que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {orders.length > ORDER_LIMIT && (
                <p style={{ marginTop: '20px', color: '#ef4444', fontWeight: 'bold' }}>
                    Solo se muestran los primeros {ORDER_LIMIT} pedidos (Límite de la API).
                </p>
            )}
        </div>
    );
};

export default OrdersListScreen;