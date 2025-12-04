import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CiSearch, CiMoneyBill, CiCalendar, CiUser, CiHashtag } from "react-icons/ci";
// Mapeo de valores de ENUM (PaymentType) para mostrar texto legible
const PAYMENT_TYPE_MAP = {
    1: 'Efectivo',      // CASH
    2: 'Tarjeta',       // CARD (General)
    3: 'Débito',        // DEBIT
    4: 'Crédito',       // CREDIT
    5: 'Transferencia', // BANK_TRANSFER
};
const BillsListScreen = () => {
    const navigate = useNavigate();

    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const BILL_LIMIT = 50;
// =========================================================================
    // I. CARGA DE DATOS
    // =========================================================================
    
    const fetchBills = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Llama al endpoint de listado de facturas
            const url = `/bills?skip=0&limit=${BILL_LIMIT}`;
     
            const response = await axios.get(url);
            
            // Ordenar por fecha descendente
            const sortedBills = response.data.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
           
            setBills(sortedBills);
            
        } catch (err) {
            console.error("Error fetching bills:", err);
            setError("Error al cargar la lista de facturas. Verifique la conexión con el servidor.");
        } finally {
            setLoading(false);
   
        }
    }, []);
    useEffect(() => {
        fetchBills();
    }, [fetchBills]);
// =========================================================================
    // II. LÓGICA DE FILTRADO (Lado del Cliente)
    // =========================================================================
    
    // Filtrado local por ID de Factura, Número de Factura o ID de Cliente
    const filteredBills = bills.filter(bill => {
        const term = searchTerm.toLowerCase();
        return (
            String(bill.id_key).includes(term) || // Por ID interno
            bill.bill_number?.toLowerCase().includes(term) || // Por 
            String(bill.client_id).includes(term) || // Por ID de Cliente
            PAYMENT_TYPE_MAP[bill.payment_type]?.toLowerCase().includes(term)
        );
    });
// =========================================================================
    // III. HANDLERS Y ESTILOS (MERCADO FAKE)
    // =========================================================================
    
    const handleRowClick = (billId) => {
        // Redirige a la pantalla de detalles
        navigate(`/admin/bills/${billId}`);
    };

    // Estilos CSS estándar (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE)
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
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#424242',
        },
        searchInput: { 
            flexGrow: 1, 
            padding: '10px', 
            borderRadius: '5px', 
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#424242',
            marginLeft: '10px', 
            fontSize: '1rem',
            backgroundColor: '#2e2e2e', 
            color: '#e0e0e0'
        },
        tableContainer: { 
            overflowX: 'auto', 
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
            backgroundColor: '#2e2e2e' 
        },
        loadingText: { textAlign: 'center', color: '#ff5722', fontSize: '1.2rem', margin: '40px 0' },
        errorText: { textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin: '40px 0' },
        totalAmount: { fontWeight: 'bold', color: '#10b981' }, // Verde para Total
        idLink: { color: '#ff5722', fontWeight: 'bold' }
    };
    
    // Funciones para hover/focus
    const handleInputFocus = (e) => { e.target.style.borderColor = '#ff5722'; };
    const handleInputBlur = (e) => { e.target.style.borderColor = '#424242'; };

if (loading) {
        return <div style={styles.container}><p style={styles.loadingText}>Cargando lista de facturas...</p></div>;
}

    if (error) {
        return <div style={styles.container}><p style={styles.errorText}>Error: {error}</p></div>;
}

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Gestión de Facturas ({bills.length} Total)</h1>
            
            {/* Barra de Búsqueda */}
            <div style={styles.searchContainer}>
                <CiSearch size={20} style={{ color: '#bdbdbd' }} />
      
                <input
                    type="text"
                    placeholder="Buscar por ID, Número de Factura o ID de Cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                />
            </div>
            
            {/* Tabla de Facturas */}
            <div style={styles.tableContainer}>
          
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID Interno</th>
                   
                            <th style={styles.th}><CiHashtag size={18} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Número de Factura</th>
                            <th style={styles.th}><CiCalendar size={18} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Fecha</th>
                            <th style={styles.th}><CiUser size={18} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Cliente ID</th>
        
                            <th style={styles.th}>Método de Pago</th>
                            <th style={styles.th}><CiMoneyBill size={18} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Total</th>
                        </tr>
                 
                    </thead>
                    <tbody>
                        {filteredBills.length > 0 ?
                        (
                            filteredBills.map((bill) => (
                                <tr 
                                    key={bill.id_key} 
 
                                    style={styles.tr}
                                    onClick={() => handleRowClick(bill.id_key)}
                          
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.trHover.backgroundColor}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.table.backgroundColor}
                                >
              
                                    <td style={{...styles.td, color: '#ff5722', fontWeight: 'bold'}}>{bill.id_key}</td>
                                    <td style={styles.td}>{bill.bill_number}</td>
                                    <td style={styles.td}>{new Date(bill.date).toLocaleDateString()}</td>
                                    <td style={{...styles.td, color: '#3b82f6', fontWeight: 'bold'}}>{bill.client_id}</td>
                                    <td style={styles.td}>{PAYMENT_TYPE_MAP[bill.payment_type] || 'Desconocido'}</td>
                                    <td style={{...styles.td, ...styles.totalAmount}}>${bill.total.toFixed(2)}</td>
                                </tr>
                            ))
  
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#bdbdbd' }}>
          
                                    No se encontraron facturas que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {bills.length > BILL_LIMIT && (
                <p style={{ marginTop: '20px', color: '#ff5722', fontWeight: 'bold' }}>
                    Solo se muestran las primeras {BILL_LIMIT} facturas (Límite de la API).
                </p>
            )}
        </div>
    );
};

export default BillsListScreen;