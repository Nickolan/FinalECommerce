import React, { useState } from 'react';
import axios from 'axios';
// Importamos useNavigate para la redirección al Login
import { useNavigate } from 'react-router-dom';

// URL base de la API, asumimos que está corriendo en localhost:8000

// Definición de los campos del formulario en español y su mapeo al nombre del campo en la API (en inglés).
const formFields = [
    { label: 'Nombre', name: 'name', type: 'text', required: true },
    { label: 'Apellido', name: 'lastname', type: 'text', required: true },
    { label: 'Correo Electrónico', name: 'email', type: 'email', required: true },
    { label: 'Teléfono', name: 'telephone', type: 'tel', required: true, placeholder: '+525512345678' },
];

const SignupScreen = () => {
    const navigate = useNavigate(); // <-- Agregamos useNavigate

    // Expresión regular para validar el email (RFC 5322 simplificado)
    const emailRegex = /^\S+@\S+\.\S+$/;

    // Expresión regular para validar el teléfono internacional (+Dígitos, 10-15 dígitos)
    const phoneRegex = /^\+\d{10,15}$/;

    const [formData, setFormData] = useState({
        name: '',
        lastname: '',
        email: '',
        telephone: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Función para manejar los cambios en los inputs del formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Función para manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setLoading(true);

        // --- VALIDACIONES DE FORMATO Y OBLIGATORIEDAD (NUEVO) ---
        const { name, lastname, email, telephone } = formData;

        // 1. Campos obligatorios y longitud (1-100 caracteres) [cite: 1808]
        if (!name || name.length > 100 || !lastname || lastname.length > 100 || !email || !telephone) {
            setMessage({ type: 'error', text: 'Por favor, complete todos los campos obligatorios. Nombre y Apellido no deben exceder 100 caracteres.' });
            setLoading(false);
            return;
        }

        // 2. Validación de Email (RFC 5322)
        if (!emailRegex.test(email)) {
            setMessage({ type: 'error', text: 'El formato del Correo Electrónico no es válido (RFC 5322).' });
            setLoading(false);
            return;
        }

        // 3. Validación de Teléfono Internacional (ej: +525512345678)
        if (!phoneRegex.test(telephone)) {
            setMessage({ type: 'error', text: 'El formato del Teléfono es incorrecto. Debe ser internacional, comenzando con "+" y solo dígitos (ej: +525512345678).' });
            setLoading(false);
            return;
        }

        try {
            // El servidor espera los campos en inglés: { name, lastname, email, telephone }
            const response = await axios.post(`/clients`, formData);
            setLoading(false);
            setMessage({
                type: 'success',
                text: `¡Registro exitoso! Tu ID de Cliente es: ${response.data.id_key}. Ahora puedes Iniciar Sesión.`
            });
            // Opcional: Limpiar el formulario
            setFormData({ name: '', lastname: '', email: '', telephone: '' });
        } catch (error) {
            setLoading(false);
            let errorMessage = 'Error desconocido. Intente de nuevo más tarde.';
            if (error.response) {
                // El servidor devuelve el error de validación de Pydantic o de unicidad (409 Conflict)
                const apiError = error.response.data;
                if (error.response.status === 409) {
                    errorMessage = 'Error: El correo electrónico ya está registrado.';
                } else if (apiError.detail && Array.isArray(apiError.detail)) {
                    // Manejar errores de validación de Pydantic (422 Unprocessable Entity)
                    const details = apiError.detail.map(err => {
                        const fieldName = formFields.find(f => f.name === err.loc[1])?.label || err.loc[1];
                        return `${fieldName}: ${err.msg}`;
                    }).join(', ');
                    errorMessage = `Error de Validación: ${details}`;
                } else if (apiError.message) {
                    errorMessage = `Error: ${apiError.message}`;
                }
            } else if (error.request) {
                // Asumimos que la URL base está definida globalmente
                errorMessage = 'No se pudo conectar al servidor API. Asegúrate de que el servidor esté corriendo.';
            }

            setMessage({ type: 'error', text: errorMessage });
        }
    };

    // Función para manejar la navegación a la pantalla de Login
    const handleLoginClick = (e) => {
        e.preventDefault();
        navigate('/login')
    };

    const MessageComponent = ({ type, text }) => {
        if (!text) return null;
        const style = type === 'success' ? styles.messageSuccess : styles.messageError;

        return <div style={{ ...styles.messageBase, ...style }}>{text}</div>;
    };

    // Estilos CSS estándar (Actualizados para el tema Dark/Red)
    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#121212', // Fondo oscuro
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontFamily: 'Arial, sans-serif'
        },
        card: {
            width: '100%',
            maxWidth: '512px',
            backgroundColor: '#1e1e1e', // Fondo de tarjeta oscuro
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
            border: '1px solid #424242',
        },
        header: {
            fontSize: '2.5rem',
            fontWeight: '900',
            color: '#ff5722', // Rojo Primario
            textAlign: 'center',
            marginBottom: '16px',
        },
        subtitle: {
            textAlign: 'center',
            fontSize: '1rem',
            color: '#bdbdbd',
            marginBottom: '32px',
        },
        formGroup: {
            marginBottom: '24px',
        },
        label: {
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#e0e0e0', // Texto claro
            marginBottom: '4px',
        },
        input: {
            width: '100%',
            padding: '10px 16px',
            border: '1px solid #424242',
            borderRadius: '8px',
            backgroundColor: '#2e2e2e', // Fondo de input oscuro
            color: '#e0e0e0', // Texto de input claro
            transition: 'all 0.15s ease-in-out',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.6)',
        },
        button: {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(255, 87, 34, 0.4)',
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'white',
            backgroundColor: '#ff5722', // Rojo Primario
            cursor: 'pointer',
            transition: 'background-color 0.15s ease-in-out',
        },
        buttonHover: {
            backgroundColor: '#e64a19', // Rojo Oscuro en hover
        },
        buttonDisabled: {
            opacity: 0.5,
            cursor: 'not-allowed',
        },
        linkButton: { // NUEVO ESTILO DE BOTÓN DE NAVEGACIÓN
            width: '100%',
            backgroundColor: 'transparent',
            color: '#ff5722', // Link en color Primario
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
            color: '#e64a19'
        },
        messageBase: {
            padding: '12px',
            borderRadius: '8px',
            fontWeight: '600',
            marginBottom: '16px',
            borderWidth: '1px',
            borderStyle: 'solid',
        },
        messageSuccess: {
            backgroundColor: '#154030', // Fondo verde oscuro para éxito
            color: '#10b981', // Texto verde para éxito
            borderColor: '#059669',
        },
        messageError: {
            backgroundColor: '#401818', // Fondo rojo oscuro para error
            color: '#ef4444', // Texto rojo para error
            borderColor: '#dc2626',
        },
        spinner: {
            marginRight: '12px',
            height: '20px',
            width: '20px',
            animation: 'spin 1s linear infinite',
            // El color del spinner se define por el color del texto del botón, lo ajustamos en el JSX
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
                    Crea tu cuenta en Mercado Fake
                </h1>
                <p style={styles.subtitle}>
                    Ingresa tus datos. Se requiere el formato de teléfono internacional (ej: +525512345678).
                </p>

                <MessageComponent type={message.type} text={message.text} />

                <form onSubmit={handleSubmit} style={styles.formGroup}>
                    {formFields.map((field) => (
                        <div key={field.name} style={{ marginBottom: '20px' }}>
                            <label
                                htmlFor={field.name}
                                style={styles.label}
                            >
                                {field.label} {field.required && <span style={{ color: '#ff5722' }}>*</span>}
                            </label>
                            <input
                                id={field.name}
                                name={field.name}
                                type={field.type}
                                value={formData[field.name]}
                                onChange={handleChange}
                                placeholder={field.placeholder || field.label}
                                required={field.required}
                                disabled={loading}
                                style={styles.input}
                            />
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
                        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor; }}
                        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = styles.button.backgroundColor; }}
                    >
                        {loading ? (
                            <svg style={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }}></path>
                            </svg>
                        ) : 'REGISTRARME'}
                    </button>

                    {/* Botón de Redirección a Login */}
                    <button
                        onClick={handleLoginClick}
                        style={styles.linkButton}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = styles.linkButtonHover.textDecoration}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                        Ya tengo una cuenta
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignupScreen;