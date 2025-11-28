import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux'; // <-- Importación corregida
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// Importar acciones de Redux para actualizar las credenciales en el store (email)
import { setCredentials } from '../../redux/slices/authSlice';
// <-- Ruta corregida

const UpdateProfileScreen = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { client_id, isLoggedIn, client_email } = useSelector(state => state.auth);
    const [formData, setFormData] = useState({
        name: '',
        lastname: '',
        email: '',
        telephone: '',
    });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    // Campos del formulario
    const formFields = [
        { label: 'Nombre', name: 'name', type: 'text', required: true },
        { label: 'Apellido', name: 'lastname', type: 'text', required: true },
        // El email es solo de lectura en esta implementación.
        { label: 'Teléfono', name: 'telephone', type: 'tel', required: true, placeholder: '+525512345678' },
    ];
// Cargar datos iniciales del servidor
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        const fetchCurrentData = async () => {
            setLoading(true);
            try {
        
                const response = await axios.get(`/clients/${client_id}`);
                const data = response.data;
                setFormData({
                    name: data.name || '',
                    lastname: data.lastname || '',
       
                    email: data.email || '',
                    telephone: data.telephone || '',
                });
            } catch (err) {
                setError("Error al cargar datos actuales del perfil.");
        
            } finally {
                setLoading(false);
            }
        };
        fetchCurrentData();
    }, [client_id, isLoggedIn, navigate]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsSubmitting(true);

        try {
            // PUT /clients/{id}
            // NOTA: Enviamos todos los campos incluyendo email para que el servidor
            // pueda actualizarlo si se permite, o ignorarlo/validarlo si es necesario.
            const response = await axios.put(`/clients/${client_id}`, formData);
            // Actualizar el estado global de Redux si el email cambia
            if (response.data.email !== client_email) {
                dispatch(setCredentials({ 
                    id_key: client_id, 
                    email: response.data.email,
                    name: response.data.name, // Actualizar nombre y apellido en el store si se quiere
                    lastname: response.data.lastname
             
                }));
            }

            setSuccessMessage("Perfil actualizado con éxito.");
        } catch (err) {
            console.error("Error al actualizar perfil:", err);
// Manejar errores de API más específicos si es necesario (ej: 409 Conflict)
            setError("Error al actualizar el perfil. Verifique los datos (el email puede estar ya registrado).");
        } finally {
            setIsSubmitting(false);
        }
    };
    // Estilos CSS estándar (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE)
    const styles = {
        container: { 
            maxWidth: '600px', 
            margin: '40px auto', 
            padding: '30px', 
            fontFamily: 'Arial, sans-serif', 
            backgroundColor: '#1e1e1e', // Fondo de tarjeta
            borderRadius: '10px', 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            color: '#e0e0e0',
        },
        header: { 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            borderBottom: '2px solid #ff5722', // Rojo Primario
            paddingBottom: '10px', 
            marginBottom: '30px', 
            color: '#ff5722' 
        },
        formGroup: { marginBottom: '20px' },
        label: { 
            display: 'block', 
            fontSize: '0.9rem', 
            fontWeight: '600', 
            color: '#bdbdbd', // Gris para etiqueta
            marginBottom: '5px' 
        },
        input: 
        { 
            width: '100%', 
            padding: '10px', 
            border: '1px solid #424242', // Borde oscuro
            borderRadius: '5px',
            backgroundColor: '#2e2e2e', // Fondo de input oscuro
            color: '#e0e0e0',
        },
        readOnlyInput: { 
            backgroundColor: '#383838', // Fondo más oscuro para campos no editables
            color: '#bdbdbd',
            cursor: 'not-allowed'
        },
        button: { 
            padding: '12px 25px', 
            backgroundColor: '#ff5722', // Rojo Primario
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            marginRight: '10px',
            transition: 'background-color 0.2s',
        },
        cancelButton: { 
            padding: '12px 25px', 
            backgroundColor: '#424242', // Gris oscuro
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
        },
        errorBox: { padding: '15px', backgroundColor: '#401818', color: '#ef4444', borderRadius: '8px', marginBottom: '15px', border: '1px solid #dc2626' },
        successBox: { padding: '15px', backgroundColor: '#154030', color: '#10b981', borderRadius: 
        '8px', marginBottom: '15px', border: '1px solid #059669' }
    };

    if (loading) return <div style={styles.container}>Cargando datos del perfil...</div>;
    
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Actualizar Perfil</h1>
            <p style={{ color: '#bdbdbd', marginBottom: '25px' }}>Modifica tus datos personales. (ID: {client_id})</p>

            {error && <div style={styles.errorBox}>{error}</div>}
            {successMessage && <div style={styles.successBox}>{successMessage}</div>}

            <form onSubmit={handleSubmit}>
       
                {formFields.map((field) => (
                    <div key={field.name} style={styles.formGroup}>
                        <label style={styles.label}>{field.label}</label>
                        <input
                  
                            type={field.type}
                            name={field.name}
                            value={formData[field.name]}
                            onChange={handleChange}
      
                            placeholder={field.placeholder}
                            required={field.required}
                            disabled={isSubmitting}
                      
                            style={styles.input}
                        />
                    </div>
                ))}
                
                {/* Campo Email (No editable en esta interfaz) */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Correo Electrónico (No Editable)</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled={true}
                        style={{...styles.input, ...styles.readOnlyInput}}
                    />
                </div>


                <button 
                 
                    type="submit" 
                    disabled={isSubmitting} 
                    style={styles.button}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e64a19'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.button.backgroundColor}
       
                    >
                    {isSubmitting ?
'Guardando...' : 'Actualizar'}
                </button>

                <button 
                    type="button" 
                    onClick={() => navigate('/profile')} 
                    style={styles.cancelButton}
 
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#616161'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.cancelButton.backgroundColor}
                >
                    Cancelar
                </button>
 
            </form>
        </div>
    );
};

export default UpdateProfileScreen;