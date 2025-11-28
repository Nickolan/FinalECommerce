import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { CiMoneyBill, CiCalendar, CiUser, CiDollar, CiCreditCard1, CiHashtag, CiShoppingCart } from "react-icons/ci";
import { IoChevronBackCircle } from "react-icons/io5";

// Mapeo de valores de ENUM (PaymentType)
const PAYMENT_TYPE_MAP = {
    1: 'Efectivo (CASH)',      
    2: 'Tarjeta (CARD)',       
    3: 'Débito (DEBIT)',        
    4: 'Crédito (CREDIT)',       
    5: 'Transferencia (BANK_TRANSFER)', 
};

const BillDetailsScreen = () => {
    const { billId } = useParams(); // Obtiene el ID de la factura de la URL
    const navigate = useNavigate();

    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // =========================================================================
    // I. CARGA DE DATOS
    // =========================================================================
    
    const fetchBillDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Llama al endpoint de detalle de factura (GET /bills/{id})
            // Asumimos que el servidor anida el Order y el Client asociado
            const response = await axios.get(`/bills/${billId}`);
            setBill(response.data);
            
        } catch (err) {
            console.error(`Error fetching bill ${billId}:`, err);
            setError(`Error al cargar los detalles de la Factura ID: ${billId}.`);
            setBill(null); 
        } finally {
            setLoading(false);
        }
    }, [billId]);

    useEffect(() => {
        if (billId) {
            fetchBillDetails();
        }
    }, [billId, fetchBillDetails]);

    // =========================================================================
    // II. RENDERIZADO
    // =========================================================================
    
    const styles = {
        container: { padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
        header: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '25px', color: '#1f2937' },
        backButton: { display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', backgroundColor: '#e5e7eb', color: '#1f2937', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', border: 'none', fontWeight: '600', transition: 'background-color 0.15s' },
        infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '30px' },
        infoCard: { padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)', backgroundColor: 'white', borderLeft: '4px solid #3b82f6' },
        cardTitle: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '15px', color: '#1f2937' },
        infoRow: { marginBottom: '10px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px' },
        label: { fontWeight: '600', color: '#6b7280', minWidth: '130px' },
        loadingText: { textAlign: 'center', color: '#3b82f6', fontSize: '1.2rem', margin: '40px 0' },
        errorText: { textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin: '40px 0' },
        totalAmount: { fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '15px' },
        link: { cursor: 'pointer', color: '#3b82f6', fontWeight: 'bold' }
    };

    if (loading) {
        return <div style={styles.container}><p style={styles.loadingText}>Cargando detalles de la factura...</p></div>;
    }

    if (error || !bill) {
        return <div style={styles.container}><p style={styles.errorText}>{error || 'Factura no encontrada.'}</p></div>;
    }
    
    // Suponemos que la API anida el pedido asociado (order) para obtener el ID de pedido
    const orderId = bill.order?.id_key || bill.order_id || 'N/A'; // order_id es la FK, order es el objeto anidado
    const client = bill.client || { name: 'N/A', email: 'N/A' };


    return (
        <div style={styles.container}>
            
            <button 
                style={styles.backButton} 
                onClick={() => navigate('/admin/bills')}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d1d5db'}
                onMouseLeave={(e) => e.target.style.backgroundColor = styles.backButton.backgroundColor}
            >
                <IoChevronBackCircle size={20} />
                Volver al Listado
            </button>
            
            <h1 style={styles.header}>Detalles de Factura #{bill.bill_number}</h1>

            {/* Grid de Información Principal */}
            <div style={styles.infoGrid}>
                
                {/* 1. Información de la Factura */}
                <div style={styles.infoCard}>
                    <h2 style={styles.cardTitle}>Detalles Financieros</h2>
                    <div style={styles.infoRow}>
                        <span style={styles.label}><CiHashtag size={18} /> Número:</span>
                        <span>{bill.bill_number}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}><CiCalendar size={18} /> Fecha:</span>
                        <span>{new Date(bill.date).toLocaleDateString()}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}><CiCreditCard1 size={18} /> Pago:</span>
                        <span>{PAYMENT_TYPE_MAP[bill.payment_type] || 'Desconocido'}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}><CiMoneyBill size={18} /> Total:</span>
                        <span style={styles.totalAmount}>${bill.total.toFixed(2)}</span>
                    </div>
                </div>

                {/* 2. Información del Cliente y Pedido */}
                <div style={{ ...styles.infoCard, borderLeftColor: '#f59e0b' }}>
                    <h2 style={styles.cardTitle}>Referencias</h2>
                    <div style={styles.infoRow}>
                        <span style={styles.label}><CiUser size={18} /> Cliente ID:</span>
                        <span 
                            style={styles.link} 
                            onClick={() => navigate(`/admin/clients/${bill.client_id}`)}
                        >
                            {bill.client_id}
                        </span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>Nombre Cliente:</span>
                        <span>{client.name} {client.lastname}</span>
                    </div>
                    
                    <div style={styles.infoRow}>
                        <span style={styles.label}><CiShoppingCart size={18} /> Pedido Asociado:</span>
                        <span 
                            style={styles.link} 
                            onClick={() => navigate(`/admin/orders/${orderId}`)}
                        >
                            {orderId}
                        </span>
                    </div>
                    
                    <p style={{ marginTop: '20px', color: '#6b7280', fontSize: '0.9rem' }}>
                        Nota: Los detalles de los productos se encuentran en la vista del Pedido asociado.
                    </p>
                </div>
            </div>
            
            {/* Espacio para la Impresión (Funcionalidad avanzada) */}
        </div>
    );
};

export default BillDetailsScreen;