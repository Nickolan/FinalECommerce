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
            bill.bill_number?.toLowerCase().includes(term) || // Por Número de Factura
            String(bill.client_id).includes(term) || // Por ID de Cliente
            PAYMENT_TYPE_MAP[bill.payment_type]?.toLowerCase().includes(term)
        );
    });
    
    // =========================================================================
    // III. HANDLERS Y ESTILOS
    // =========================================================================
    
    const handleRowClick = (billId) => {
        // Redirige a la pantalla de detalles
        navigate(`/admin/bills/${billId}`);
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
        totalAmount: { fontWeight: 'bold', color: '#10b981' }
    };

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
                <CiSearch size={20} style={{ color: '#6b7280' }} />
                <input
                    type="text"
                    placeholder="Buscar por ID, Número de Factura o ID de Cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
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
                        {filteredBills.length > 0 ? (
                            filteredBills.map((bill) => (
                                <tr 
                                    key={bill.id_key} 
                                    style={styles.tr}
                                    onClick={() => handleRowClick(bill.id_key)}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.trHover.backgroundColor}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    <td style={styles.td}>{bill.id_key}</td>
                                    <td style={{...styles.td, fontWeight: 'bold'}}>{bill.bill_number}</td>
                                    <td style={styles.td}>{new Date(bill.date).toLocaleDateString()}</td>
                                    <td style={{...styles.td, color: '#3b82f6', fontWeight: 'bold'}}>{bill.client_id}</td>
                                    <td style={styles.td}>{PAYMENT_TYPE_MAP[bill.payment_type] || 'Desconocido'}</td>
                                    <td style={{...styles.td, ...styles.totalAmount}}>${bill.total.toFixed(2)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ ...styles.td, textAlign: 'center' }}>
                                    No se encontraron facturas que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {bills.length > BILL_LIMIT && (
                <p style={{ marginTop: '20px', color: '#ef4444', fontWeight: 'bold' }}>
                    Solo se muestran las primeras {BILL_LIMIT} facturas (Límite de la API).
                </p>
            )}
        </div>
    );
};

export default BillsListScreen;