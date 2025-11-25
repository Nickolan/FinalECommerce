import React, { useState } from 'react';
import axios from 'axios';

// URL base de la API, asumimos que está corriendo en localhost:8000

// Definición de los campos del formulario en español y su mapeo al nombre del campo en la API (en inglés).
const formFields = [
    { label: 'Nombre', name: 'name', type: 'text', required: true },
    { label: 'Apellido', name: 'lastname', type: 'text', required: true },
    { label: 'Correo Electrónico', name: 'email', type: 'email', required: true },
    { label: 'Teléfono', name: 'telephone', type: 'tel', required: true, placeholder: '+525512345678' },
];

// Estilos CSS estándar
const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f9fafb', // bg-gray-50
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Arial, sans-serif'
    },
    card: {
        width: '100%',
        maxWidth: '512px', // max-w-lg
        backgroundColor: '#fff',
        padding: '32px',
        borderRadius: '12px', // rounded-xl
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // shadow-2xl
        border: '1px solid #f3f4f6', // border-gray-100
    },
    header: {
        fontSize: '2rem', // text-3xl
        fontWeight: '800', // font-extrabold
        color: '#1f2937', // text-gray-900
        textAlign: 'center',
        marginBottom: '24px', // mb-6
    },
    subtitle: {
        textAlign: 'center',
        fontSize: '0.875rem', // text-sm
        color: '#6b7280', // text-gray-500
        marginBottom: '32px', // mb-8
    },
    formGroup: {
        marginBottom: '24px', // space-y-6 equivalent
    },
    label: {
        display: 'block',
        fontSize: '0.875rem', // text-sm
        fontWeight: '600', // font-semibold
        color: '#374151', // text-gray-700
        marginBottom: '4px', // mb-1
    },
    input: {
        width: '100%',
        padding: '10px 16px', // px-4 py-2
        border: '1px solid #d1d5db', // border-gray-300
        borderRadius: '8px', // rounded-lg
        transition: 'all 0.15s ease-in-out',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // shadow-sm
    },
    inputFocus: {
        borderColor: '#3b82f6', // focus:border-blue-500
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)', // focus:ring-2 focus:ring-blue-500
        outline: 'none',
    },
    button: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '12px 16px', // py-3 px-4
        border: 'none',
        borderRadius: '8px', // rounded-lg
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)', // shadow-lg
        fontSize: '1.125rem', // text-lg
        fontWeight: '700', // font-bold
        color: 'white',
        backgroundColor: '#2563eb', // bg-blue-600
        cursor: 'pointer',
        transition: 'background-color 0.15s ease-in-out',
    },
    buttonHover: {
        backgroundColor: '#1d4ed8', // hover:bg-blue-700
    },
    buttonDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    messageBase: {
        padding: '12px', // p-3
        borderRadius: '8px', // rounded-lg
        fontWeight: '600', // font-medium
        marginBottom: '16px', // mb-4
        borderWidth: '1px',
        borderStyle: 'solid',
    },
    messageSuccess: {
        backgroundColor: '#d4edda', // bg-green-100
        color: '#155724', // text-green-700
        borderColor: '#c3e6cb', // border-green-200
    },
    messageError: {
        backgroundColor: '#f8d7da', // bg-red-100
        color: '#721c24', // text-red-700
        borderColor: '#f5c6cb', // border-red-200
    },
    spinner: {
        marginRight: '12px', // mr-3
        height: '20px', // h-5
        width: '20px', // w-5
        animation: 'spin 1s linear infinite',
    },
    '@keyframes spin': {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
    }
};

const SignupScreen = () => {
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

        // Validaciones básicas del lado del cliente (React)
        if (!formData.name || !formData.lastname || !formData.email || !formData.telephone) {
            setMessage({ type: 'error', text: 'Por favor, complete todos los campos obligatorios.' });
            setLoading(false);
            return;
        }

        try {
            // El servidor espera los campos en inglés: { name, lastname, email, telephone }
            const response = await axios.post(`/clients`, formData);

            setLoading(false);
            setMessage({ 
                type: 'success', 
                text: `¡Registro exitoso! Tu ID de Cliente es: ${response.data.id_key}. Úsalo para el login.`
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
                errorMessage = 'No se pudo conectar al servidor API. Asegúrate de que el servidor esté corriendo en ' + API_BASE_URL;
            }

            setMessage({ type: 'error', text: errorMessage });
        }
    };

    const MessageComponent = ({ type, text }) => {
        if (!text) return null;
        const style = type === 'success' ? styles.messageSuccess : styles.messageError;
        
        return <div style={{ ...styles.messageBase, ...style }}>{text}</div>;
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.header}>
                    Crear Cuenta (Registro)
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
                                {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
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
                                // Añadir manejo de focus para estilos más dinámicos si fuera necesario
                                onFocus={(e) => e.target.style.borderColor = styles.inputFocus.borderColor}
                                onBlur={(e) => e.target.style.borderColor = styles.input.borderColor}
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
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'REGISTRARME'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignupScreen;