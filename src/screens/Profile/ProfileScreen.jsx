import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Importar acciones de Redux (Ruta corregida: Subir dos niveles para src/redux)
import { logout } from '../../redux/slices/authSlice';

// Importar el componente de formulario de dirección (Ruta corregida: Subir un nivel para src/components)
// NOTA: Asumo que AddressForm y UpdateProfileScreen están en src/components y src/screens/ respectively.
import AddressForm from "../../components/AddressForm/AddressForm"

// URL base de la API

const ProfileScreen = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Obtener estado global de Redux (sesión)
    const { client_id, client_email, isLoggedIn } = useSelector(state => state.auth);

    const [clientData, setClientData] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estado para gestionar la visibilidad del formulario de nueva dirección
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
    // Estado para gestionar si se está editando una dirección existente
    const [editingAddress, setEditingAddress] = useState(null); 

    // Función para obtener las iniciales del cliente
    const getInitials = (name, lastname) => {
        if (!name || !lastname) return 'UN';
        // Solo toma la primera letra del nombre y apellido.
        return `${name.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
    };

    // =========================================================================
    // I. CARGA DE DATOS (Perfil y Direcciones)
    // =========================================================================
    
    const fetchProfileData = useCallback(async () => {
        if (!client_id) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            // Cargar datos del cliente
            const clientResponse = await axios.get(`/clients/${client_id}`);
            setClientData(clientResponse.data);
            
            // Cargar direcciones (asumimos GET /addresses?client_id={id} funciona)
            //const addressesResponse = await axios.get(`/addresses?client_id=${client_id}`);
            setAddresses(clientResponse.data.addresses);

        } catch (err) {
            console.error("Error cargando perfil:", err);
            setError("Error al cargar el perfil o las direcciones.");
        } finally {
            setLoading(false);
        }
    }, [client_id, navigate]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchProfileData();
        }
    }, [isLoggedIn, fetchProfileData]);

    // =========================================================================
    // II. GESTIÓN DE ACCIONES CRÍTICAS (Eliminar Cliente / Dirección)
    // =========================================================================
    
    // Eliminar Cuenta de Cliente
    const handleDeleteClient = async () => {
        // Simular alerta con window.prompt para confirmar el ID
        const confirmation = window.prompt(`ADVERTENCIA: Estás a punto de eliminar tu cuenta. Esto es irreversible. Escribe tu ID de Cliente (${client_id}) para confirmar.`);
        
        if (confirmation === String(client_id)) {
            setLoading(true);
            try {
                // DELETE /clients/{id} - Esto debería manejar el cascade delete de direcciones en el servidor.
                await axios.delete(`/clients/${client_id}`);
                
                // Limpiar la sesión después de la eliminación exitosa
                dispatch(logout());
                alert("Cuenta eliminada exitosamente.");
                navigate('/signup'); 
                
            } catch (err) {
                console.error("Error al eliminar cuenta:", err);
                setError("Error al eliminar la cuenta. El servidor devolvió un error.");
                setLoading(false);
            }
        } else if (confirmation !== null) {
            alert("Confirmación fallida. La cuenta no fue eliminada.");
        }
    };
    
    // Eliminar Dirección Específica
    const handleDeleteAddress = async (addressId) => {
        const confirmation = window.confirm("¿Estás seguro de que quieres eliminar esta dirección? Esta acción es irreversible.");
        
        if (confirmation) {
            try {
                // DELETE /addresses/{id}
                await axios.delete(`/addresses/${addressId}`);
                
                // Actualizar la lista de direcciones localmente
                setAddresses(prev => prev.filter(addr => addr.id_key !== addressId));
                alert("Dirección eliminada con éxito.");
                
            } catch (err) {
                console.error("Error al eliminar dirección:", err);
                setError("Error al eliminar la dirección.");
            }
        }
    };
    
    // Iniciar edición de dirección
    const handleEditAddress = (address) => {
        setEditingAddress(address);
        setIsAddingNewAddress(false); // Asegurar que el modo "Agregar nuevo" esté desactivado
    };
    
    // =========================================================================
    // III. RENDERIZADO
    // =========================================================================

    const styles = {
        container: { maxWidth: '1000px', margin: '40px auto', padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
        // Responsive: la card se apila en pantallas pequeñas
        profileCard: { display: 'flex', gap: '30px', alignItems: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: '30px', marginBottom: '30px', flexWrap: 'wrap' },
        avatarContainer: { width: '120px', height: '120px', borderRadius: '15px', backgroundColor: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' },
        avatarInitials: { fontSize: '3rem', fontWeight: 'bold', color: 'white' },
        infoSection: { flexGrow: 1, minWidth: '250px' },
        dataRow: { marginBottom: '10px', fontSize: '1.1rem', color: '#333' },
        label: { fontWeight: '600', color: '#6b7280', marginRight: '10px' },
        buttonsRow: { display: 'flex', gap: '15px', marginTop: '20px' },
        updateButton: { padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' },
        deleteButton: { padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' },
        addressesHeader: { fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' },
        addAddressButton: { padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px', marginTop: '10px' },
        addressList: { display: 'flex', flexDirection: 'column', gap: '15px' },
        addressItem: { border: '1px solid #ddd', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', backgroundColor: '#f9f9f9' },
        addressText: { marginBottom: '5px', color: '#333' },
        addressButtons: { display: 'flex', gap: '10px', marginTop: '10px' },
        editAddressButton: { padding: '8px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.9rem' },
        removeAddressButton: { padding: '8px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.9rem' },
        errorBox: { padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '15px' }
    };
    
    if (loading) return <div style={{...styles.container, textAlign: 'center'}}>Cargando perfil...</div>;
    if (error) return <div style={{...styles.container, color: '#ef4444'}}>Error: {error}</div>;
    if (!clientData) return <div style={{...styles.container, textAlign: 'center'}}>Inicie sesión para ver el perfil.</div>;

    const { name, lastname, email, telephone, id_key } = clientData;

    return (
        <div style={styles.container}>
            {/* ------------------------------------------------------------------ */}
            {/* Contenedor Superior: Perfil y Acciones */}
            {/* ------------------------------------------------------------------ */}
            <div style={styles.profileCard}>
                
                {/* Lado Izquierdo: Imagen con Iniciales */}
                <div style={styles.avatarContainer}>
                    <span style={styles.avatarInitials}>{getInitials(name, lastname)}</span>
                </div>
                
                {/* Lado Derecho: Datos y Botones */}
                <div style={styles.infoSection}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '15px' }}>{name} {lastname}</h2>

                    <div style={styles.dataRow}>
                        <span style={styles.label}>Email:</span> {email}
                    </div>
                    <div style={styles.dataRow}>
                        <span style={styles.label}>Teléfono:</span> {telephone}
                    </div>
                    <div style={styles.dataRow}>
                        <span style={styles.label}>ID de Cliente:</span> {id_key}
                    </div>

                    <div style={styles.buttonsRow}>
                        {/* Botón Azul: Actualizar */}
                        <button 
                            style={styles.updateButton}
                            onClick={() => navigate('/profile/update')}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = styles.updateButton.backgroundColor}
                        >
                            Actualizar
                        </button>
                        
                        {/* Botón Rojo: Eliminar */}
                        <button 
                            style={styles.deleteButton}
                            onClick={handleDeleteClient}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = styles.deleteButton.backgroundColor}
                        >
                            Eliminar Cuenta
                        </button>
                    </div>
                </div>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Sección Inferior: Direcciones */}
            {/* ------------------------------------------------------------------ */}
            <h2 style={styles.addressesHeader}>Mis Direcciones</h2>

            {/* Formulario para AGREGAR/EDITAR */}
            {(isAddingNewAddress || editingAddress) && (
                <div style={{ marginBottom: '20px' }}>
                    <AddressForm 
                        client_id={client_id}
                        initialData={editingAddress}
                        onSuccess={() => {
                            setIsAddingNewAddress(false);
                            setEditingAddress(null);
                            fetchProfileData(); // Recargar datos al guardar
                        }}
                        onCancel={() => {
                            setIsAddingNewAddress(false);
                            setEditingAddress(null);
                        }}
                    />
                </div>
            )}
            
            {/* Botón Agregar Nueva Dirección */}
            {!isAddingNewAddress && !editingAddress && (
                <button 
                    style={styles.addAddressButton}
                    onClick={() => setIsAddingNewAddress(true)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.addAddressButton.backgroundColor}
                >
                    + Agregar Nueva Dirección
                </button>
            )}

            {/* Listado de Direcciones */}
            <div style={styles.addressList}>
                {addresses.length === 0 ? (
                    <p style={{ color: '#999' }}>No tienes direcciones registradas.</p>
                ) : (
                    addresses.map(addr => (
                        <div key={addr.id_key} style={styles.addressItem}>
                            <p style={styles.addressText}>
                               <b>{addr.street}</b>, N° {addr.number} ({addr.city})
                            </p>
                            
                            <div style={styles.addressButtons}>
                                {/* Botón Azul: Editar */}
                                <button
                                    style={styles.editAddressButton}
                                    onClick={() => handleEditAddress(addr)}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.editAddressButton.backgroundColor}
                                >
                                    Editar
                                </button>

                                {/* Botón Rojo: Eliminar Dirección */}
                                <button
                                    style={styles.removeAddressButton}
                                    onClick={() => handleDeleteAddress(addr.id_key)}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.removeAddressButton.backgroundColor}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProfileScreen;