import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CiSearch, CiUser, CiMail, CiPhone } from "react-icons/ci";

const ClientsListScreen = () => {
    const navigate = useNavigate();

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Asumimos que la API solo devuelve un listado y manejamos la paginación con un límite alto
    const CLIENT_LIMIT = 50; 

    // =========================================================================
    // I. CARGA DE DATOS
    // =========================================================================
    
    const fetchClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Llama al endpoint de listado de clientes
            const url = `/clients?skip=0&limit=${CLIENT_LIMIT}`;
            const response = await axios.get(url);
            
            setClients(response.data);
            
        } catch (err) {
            console.error("Error fetching clients:", err);
            setError("Error al cargar la lista de clientes. Verifique la conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // =========================================================================
    // II. LÓGICA DE FILTRADO (Lado del Cliente)
    // =========================================================================
    
    // Filtrado local por nombre, apellido, email o ID
    const filteredClients = clients.filter(client => {
        const term = searchTerm.toLowerCase();
        return (
            client.name?.toLowerCase().includes(term) ||
            client.lastname?.toLowerCase().includes(term) ||
            client.email?.toLowerCase().includes(term) ||
            String(client.id_key).includes(term)
        );
    });

    // =========================================================================
    // III. HANDLERS
    // =========================================================================
    
    const handleRowClick = (clientId) => {
        // Redirige a la pantalla de detalles
        navigate(`/admin/clients/${clientId}`);
    };

    // Estilos CSS estándar
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
        return <div style={styles.container}><p style={styles.loadingText}>Cargando lista de clientes...</p></div>;
    }

    if (error) {
        return <div style={styles.container}><p style={styles.errorText}>Error: {error}</p></div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Gestión de Clientes ({clients.length} Total)</h1>
            
            {/* Barra de Búsqueda */}
            <div style={styles.searchContainer}>
                <CiSearch size={20} style={styles.iconStyle} />
                <input
                    type="text"
                    placeholder="Buscar por ID, Nombre, Apellido o Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                />
            </div>
            
            {/* Tabla de Clientes */}
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Nombre Completo</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Teléfono</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                                <tr 
                                    key={client.id_key} 
                                    style={styles.tr}
                                    onClick={() => handleRowClick(client.id_key)}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.trHover.backgroundColor}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    <td style={styles.td}>{client.id_key}</td>
                                    <td style={styles.td}>{client.name} {client.lastname}</td>
                                    <td style={styles.td}>{client.email}</td>
                                    <td style={styles.td}>{client.telephone || 'N/A'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ ...styles.td, textAlign: 'center' }}>
                                    No se encontraron clientes que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {clients.length > CLIENT_LIMIT && (
                <p style={{ marginTop: '20px', color: '#ef4444', fontWeight: 'bold' }}>
                    Solo se muestran los primeros {CLIENT_LIMIT} clientes (Límite de la API).
                </p>
            )}
        </div>
    );
};

export default ClientsListScreen;