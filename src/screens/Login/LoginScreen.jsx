import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/slices/authSlice';

// URL base de la API, asumimos que está corriendo en localhost:8000

const LoginScreen = ({ onLogin }) => {
    // Definición de campos
    const [formData, setFormData] = useState({
        id_key: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const dispatch = useDispatch();

    const navigate = useNavigate()

    // Función para manejar los cambios en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Función para simular la redirección (en un app real se usaría React Router)
    const handleRedirect = () => {
        // En un entorno de aplicación real con routing (React Router): navigate('/');
        alert("¡Inicio de Sesión Exitoso! Redirigiendo a /");
        // Llama a una función externa para manejar el estado de la sesión
        navigate("/")
    };

    // Función para manejar la navegación a la pantalla de registro
    const handleSignupClick = (e) => {
        e.preventDefault();
        navigate('/signup')
    };

    // --- FLUJO DE LOGIN SIMULADO ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.id_key || !formData.email) {
            setError('Debe ingresar el ID de Cliente y el Correo Electrónico.');
            setLoading(false);
            return;
        }

        try {
            // 1. Enviar el ID al servidor para obtener la información del cliente
            // Endpoint: GET /clients/{id_key}
            const response = await axios.get(`/clients/${formData.id_key}`);
            const clientData = response.data;

            // 2. Comparar el correo electrónico localmente (Validación Simétrica)
            // (La validación es insegura pero cumple con la restricción de no modificar el servidor)
            if (clientData.email.toLowerCase() === formData.email.toLowerCase()) {

                // 3. Validación correcta: DISPATCH de la acción setCredentials
                dispatch(setCredentials({
                    id_key: clientData.id_key,
                    email: clientData.email,
                    name: clientData.name
                }));

                setLoading(false);
                handleRedirect();
            } else {
                // 4. Validación fallida: Email no coincide con el ID
                setError('El ID de Cliente o el Correo Electrónico son incorrectos.');
                setLoading(false);
            }

        } catch (error) {
            setLoading(false);

            let errorMessage = 'Error al intentar iniciar sesión.';
            if (error.response && error.response.status === 404) {
                errorMessage = 'ID de Cliente no encontrado.';
            } else if (error.request) {
                errorMessage = 'No se pudo conectar al servidor API. Verifique la URL.';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }

            setError(errorMessage);
        }
    };

    // Estilos CSS estándar
    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontFamily: 'Arial, sans-serif'
        },
        card: {
            width: '100%',
            maxWidth: '400px',
            backgroundColor: '#fff',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6',
        },
        header: {
            fontSize: '2rem',
            fontWeight: '800',
            color: '#1f2937',
            textAlign: 'center',
            marginBottom: '16px',
        },
        subtitle: {
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '32px',
        },
        formGroup: {
            marginBottom: '20px',
        },
        label: {
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px',
        },
        input: {
            width: '100%',
            padding: '10px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            transition: 'all 0.15s ease-in-out',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },
        button: {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontSize: '1.125rem',
            fontWeight: '700',
            color: 'white',
            backgroundColor: '#10b981', // Estilo primario verde
            cursor: 'pointer',
            transition: 'background-color 0.15s ease-in-out',
        },
        buttonHover: {
            backgroundColor: '#059669',
        },
        buttonDisabled: {
            opacity: 0.5,
            cursor: 'not-allowed',
        },
        errorText: {
            color: '#ef4444', // Rojo
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '10px',
            fontSize: '0.9rem'
        },
        spinner: {
            marginRight: '8px',
            height: '20px',
            width: '20px',
            animation: 'spin 1s linear infinite',
        },
        linkButton: {
            width: '100%',
            backgroundColor: 'transparent',
            color: '#2563eb', // Link color azul
            border: 'none',
            padding: '8px 0',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'color 0.15s ease-in-out',
            marginTop: '10px'
        },
        linkButtonHover: {
            textDecoration: 'underline',
            color: '#1d4ed8'
        },
        '@keyframes spin': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' },
        }
    };


    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.header}>
                    Iniciar Sesión
                </h1>
                <p style={styles.subtitle}>
                    Accede con tu ID de Cliente y correo electrónico.
                </p>

                <form onSubmit={handleSubmit}>

                    <div style={styles.formGroup}>
                        <label htmlFor="id_key" style={styles.label}>
                            ID de Cliente
                        </label>
                        <input
                            id="id_key"
                            name="id_key"
                            type="number"
                            value={formData.id_key}
                            onChange={handleChange}
                            placeholder="Tu ID numérico (ej: 1, 2)"
                            required
                            disabled={loading}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="email" style={styles.label}>
                            Correo Electrónico
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Tu email de registro"
                            required
                            disabled={loading}
                            style={styles.input}
                        />
                    </div>

                    {/* Mensaje de Error (letras rojas por encima del botón) */}
                    {error && <p style={styles.errorText}>{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            ...(loading ? styles.buttonDisabled : {})
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor;
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) e.currentTarget.style.backgroundColor = styles.button.backgroundColor;
                        }}
                    >
                        {loading ? (
                            <svg style={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }}></path>
                            </svg>
                        ) : 'INICIAR SESIÓN'}
                    </button>

                    {/* Botón de Redirección a Registro */}
                    <button
                        onClick={handleSignupClick}
                        style={styles.linkButton}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = styles.linkButtonHover.textDecoration}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                        No tengo una cuenta
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;