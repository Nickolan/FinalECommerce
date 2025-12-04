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

    // Estilos CSS estándar (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE)
    const styles = {
        container: { padding: '0 10px', maxWidth: '100%', fontFamily: 'Arial, sans-serif' },
        header: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '20px', color: '#ff5722' },
        searchContainer: { 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '30px', 
            padding: '15px', 
            backgroundColor: '#1e1e1e', // Fondo de la tarjeta de búsqueda
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
            backgroundColor: '#2e2e2e', // Fondo de input oscuro
            color: '#e0e0e0',
            transition: 'border-color 0.2s'
        },
    
        tableContainer: { overflowX: 'auto', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)', borderRadius: '8px' },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#1e1e1e' },
        th: { 
            padding: '12px 15px', 
            textAlign: 'left', 
            backgroundColor: '#2e2e2e', // Fondo de encabezado
            borderBottom: '2px solid #424242', 
            color: '#bdbdbd', 
            fontSize: '0.9rem', 
            textTransform: 'uppercase' 
        },
        td: { 
            padding: '12px 15px', 
            borderBottom: '1px solid #424242', // Separador de fila más oscuro
            fontSize: '1rem', 
            color: '#e0e0e0' 
        },
        tr: { cursor: 'pointer', transition: 'background-color 0.15s' },
   
        trHover: { 
            backgroundColor: '#2e2e2e', // Gris oscuro en hover
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
                    onFocus={handleSearchInputFocus}
                    onBlur={handleSearchInputBlur}
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
                        {filteredClients.length > 0 ?
                        (
                            filteredClients.map((client) => (
                                <tr 
                                    key={client.id_key} 
 
                                    style={styles.tr}
                                    onClick={() => handleRowClick(client.id_key)}
                          
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.trHover.backgroundColor}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.table.backgroundColor}
                                >
              
                                    <td style={{...styles.td, color: '#ff5722', fontWeight: 'bold'}}>{client.id_key}</td>
                                    <td style={styles.td}>{client.name} {client.lastname}</td>
                                    <td style={styles.td}>{client.email}</td>
  
                                    <td style={styles.td}>{client.telephone || 'N/A'}</td>
                                </tr>
                            ))
   
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: '#bdbdbd' }}>
           
                                    No se encontraron clientes que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            
            </div>

            {clients.length > CLIENT_LIMIT && (
                <p style={{ marginTop: '20px', color: '#ff5722', fontWeight: 'bold' }}>
                    Solo se muestran los primeros {CLIENT_LIMIT} clientes (Límite de la API).
                </p>
            )}
  
        </div>
    );
};

export default ClientsListScreen;