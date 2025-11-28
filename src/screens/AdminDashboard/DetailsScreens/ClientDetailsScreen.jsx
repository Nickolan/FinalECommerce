import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { CiMail, CiPhone, CiHome } from "react-icons/ci";
import { IoChevronBackCircle } from "react-icons/io5";

const ClientDetailsScreen = () => {
    const { clientId } = useParams(); // Obtiene el ID del cliente de la URL
    const navigate = useNavigate();

    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // =========================================================================
    // I. CARGA DE DATOS
    // =========================================================================
    
    const fetchClientDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Llama al endpoint de detalle de cliente (GET /clients/{id})
            const response = await axios.get(`/clients/${clientId}`);
            setClient(response.data);
            
        } catch (err) {
            console.error(`Error fetching client ${clientId}:`, err);
            setError(`Error al cargar los detalles del Cliente ID: ${clientId}.`);
            setClient(null); // Aseguramos que el cliente sea null en caso de error
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        if (clientId) {
            fetchClientDetails();
        }
    }, [clientId, fetchClientDetails]);

    // =========================================================================
    // II. RENDERIZADO
    // =========================================================================
    
    const styles = {
        container: { padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
        header: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '25px', color: '#1f2937' },
        backButton: { display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', backgroundColor: '#e5e7eb', color: '#1f2937', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', border: 'none', fontWeight: '600' },
        infoBox: { padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: 'white', marginBottom: '30px', borderTop: '4px solid #3b82f6' },
        infoRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', fontSize: '1.1rem', borderBottom: '1px dotted #e5e7eb', paddingBottom: '8px' },
        label: { fontWeight: '600', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px', minWidth: '100px' },
        addressHeader: { fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '2px solid #e0e0e0', paddingBottom: '5px', marginBottom: '15px', color: '#1f2937' },
        addressItem: { padding: '15px', border: '1px solid #d1ddff', borderRadius: '8px', marginBottom: '15px', backgroundColor: '#f0f5ff' },
        loadingText: { textAlign: 'center', color: '#3b82f6', fontSize: '1.2rem', margin: '40px 0' },
        errorText: { textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin: '40px 0' },
    };

    if (loading) {
        return <div style={styles.container}><p style={styles.loadingText}>Cargando detalles del cliente...</p></div>;
    }

    if (error || !client) {
        return <div style={styles.container}><p style={styles.errorText}>{error || 'Cliente no encontrado.'}</p></div>;
    }

    return (
        <div style={styles.container}>
            
            <button 
                style={styles.backButton} 
                onClick={() => navigate('/admin/clients')}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d1d5db'}
                onMouseLeave={(e) => e.target.style.backgroundColor = styles.backButton.backgroundColor}
            >
                <IoChevronBackCircle size={20} />
                Volver al Listado
            </button>
            
            <h1 style={styles.header}>Detalles del Cliente: {client.name} {client.lastname}</h1>

            {/* Box de Información Principal */}
            <div style={styles.infoBox}>
                <div style={styles.infoRow}>
                    <span style={styles.label}>ID:</span>
                    <span>{client.id_key}</span>
                </div>
                <div style={styles.infoRow}>
                    <span style={styles.label}><CiMail size={18} /> Email:</span>
                    <span>{client.email}</span>
                </div>
                <div style={styles.infoRow}>
                    <span style={styles.label}><CiPhone size={18} /> Teléfono:</span>
                    <span>{client.telephone || 'No registrado'}</span>
                </div>
            </div>

            {/* Box de Direcciones */}
            <h2 style={styles.addressHeader}>Direcciones Registradas ({client.addresses?.length || 0})</h2>

            {client.addresses && client.addresses.length > 0 ? (
                client.addresses.map((address) => (
                    <div key={address.id_key} style={styles.addressItem}>
                        <div style={styles.infoRow}>
                            <span style={styles.label}><CiHome size={18} /> Calle:</span>
                            <span>{address.street}, N° {address.number || 'S/N'}</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.label}>Ciudad:</span>
                            <span>{address.city} ({address.state})</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.label}>C.P.:</span>
                            <span>{address.zip_code || 'N/A'}</span>
                        </div>
                    </div>
                ))
            ) : (
                <p style={{ color: '#6b7280', padding: '10px' }}>Este cliente no tiene direcciones registradas.</p>
            )}
            
            {/* Espacio para futuros detalles como Historial de Pedidos */}
        </div>
    );
};

export default ClientDetailsScreen;