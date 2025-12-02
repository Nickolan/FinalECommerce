import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { CiMail, CiPhone, CiHome } from "react-icons/ci";
import { IoChevronBackCircle } from "react-icons/io5";

const ClientDetailsScreen = () => {
    const { clientId } = useParams();
// Obtiene el ID del cliente de la URL
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
    
    // Estilos CSS estándar (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE)
    const styles = {
        container: { padding: '0 10px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#e0e0e0' },
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
      
        infoBox: { 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)', 
            backgroundColor: '#1e1e1e', // Fondo de tarjeta oscuro
            marginBottom: '30px', 
            borderTop: '4px solid #ff5722' // Rojo Primario
        },
        infoRow: { 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px', 
            marginBottom: '10px', 
            fontSize: '1.1rem', 
            borderBottom: '1px dotted #424242', // Separador discreto
            paddingBottom: '8px' 
        },
        label: { 
            fontWeight: '600', 
            color: '#bdbdbd', // Gris para etiquetas
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            minWidth: '100px' 
        },
        addressHeader: { 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            borderBottom: '2px solid #424242', 
            paddingBottom: '5px', 
            marginBottom: '15px', 
            color: '#ff5722' // Rojo Primario
        },
    
        addressItem: { 
            padding: '15px', 
            border: '1px solid #424242', // Borde oscuro
            borderRadius: '8px', 
            marginBottom: '15px', 
            backgroundColor: '#2e2e2e' // Fondo más oscuro para items de lista
        },
        loadingText: { textAlign: 'center', color: '#ff5722', fontSize: '1.2rem', margin: '40px 0' },
        errorText: { textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin: '40px 0' },
    };
    
    const handleBackHover = (e, hover) => {
        e.currentTarget.style.backgroundColor = hover ? '#383838' : styles.backButton.backgroundColor;
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
                onMouseEnter={(e) => handleBackHover(e, true)}
                onMouseLeave={(e) => handleBackHover(e, false)}
            >
                <IoChevronBackCircle size={20} />
                Volver al Listado
            </button>
            
           
            <h1 style={styles.header}>Detalles del Cliente: {client.name} {client.lastname}</h1>

            {/* Box de Información Principal */}
            <div style={styles.infoBox}>
                <div style={styles.infoRow}>
                    <span style={styles.label}>ID:</span>
                    <span style={{ color: '#ff5722', fontWeight: 'bold' }}>{client.id_key}</span>
      
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                {client.addresses && client.addresses.length > 0 ?
                (
                    client.addresses.map((address) => (
                        <div key={address.id_key} style={styles.addressItem}>
                             <p style={{ color: '#bdbdbd', fontSize: '0.9rem', marginBottom: '10px' }}>
                                Dirección ID: {address.id_key}
                             </p>
                            <div style={styles.infoRow}>
                                <span style={styles.label}><CiHome size={18} /> Calle:</span>
   
                                <span>{address.street}, N° {address.number || 'S/N'}</span>
                            </div>
                            <div style={styles.infoRow}>
                      
                                <span style={styles.label}>Ciudad:</span>
                                <span>{address.city}</span>
                            </div>
                            {/* Retiramos CP y Estado siguiendo la lógica de AddressForm */}
                            <div style={styles.infoRow}>
                                <span style={styles.label}>Completa:</span>
                                <span>{address.city}, {address.street} {address.number}</span>
                            </div>
                        </div>
            
                    ))
                ) : (
                    <p style={{ color: '#bdbdbd', padding: '10px', gridColumn: '1 / -1' }}>Este cliente no tiene direcciones registradas.</p>
                )}
            </div>
            
        </div>
    );
};

export default ClientDetailsScreen;