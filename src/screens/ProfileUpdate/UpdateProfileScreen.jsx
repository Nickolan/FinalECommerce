import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux'; // <-- Importación corregida
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Importar acciones de Redux para actualizar las credenciales en el store (email)
import { setCredentials } from '../../redux/slices/authSlice'; // <-- Ruta corregida

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
        //{ label: 'Correo Electrónico', name: 'email', type: 'email', required: true },
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
            const response = await axios.put(`/clients/${client_id}`, formData);

            // Actualizar el estado global de Redux si el email cambia
            if (response.data.email !== client_email) {
                dispatch(setCredentials({ 
                    id_key: client_id, 
                    email: response.data.email 
                }));
            }

            setSuccessMessage("Perfil actualizado con éxito.");
            
        } catch (err) {
            console.error("Error al actualizar perfil:", err);
            // Manejar errores de API más específicos si es necesario (ej: 409 Conflict)
            setError("Error al actualizar el perfil. Verifique los datos (email único, formato de teléfono).");
        } finally {
            setIsSubmitting(false);
        }
    };

    const styles = {
        container: { maxWidth: '600px', margin: '40px auto', padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
        header: { fontSize: '2rem', fontWeight: 'bold', borderBottom: '2px solid #3b82f6', paddingBottom: '10px', marginBottom: '30px', color: '#3b82f6' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '5px' },
        input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' },
        button: { padding: '12px 25px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' },
        cancelButton: { padding: '12px 25px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
        errorBox: { padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '15px' },
        successBox: { padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '15px' }
    };

    if (loading) return <div style={styles.container}>Cargando datos del perfil...</div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Actualizar Perfil</h1>
            <p style={{ color: '#6b7280', marginBottom: '25px' }}>Modifica tus datos personales y presiona Actualizar. (ID: {client_id})</p>

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

                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    style={styles.button}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.button.backgroundColor}
                >
                    {isSubmitting ? 'Guardando...' : 'Actualizar'}
                </button>

                <button 
                    type="button" 
                    onClick={() => navigate('/profile')} 
                    style={styles.cancelButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#555'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.cancelButton.backgroundColor}
                >
                    Cancelar
                </button>
            </form>
        </div>
    );
};

export default UpdateProfileScreen;