import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddressForm = ({ client_id, initialData, onSuccess, onCancel }) => {
    const isEditing = !!initialData;
    const [formData, setFormData] = useState({
        street: initialData?.street || '',
        number: initialData?.number || '',
        city: initialData?.city || '',
        // Eliminados: state: initialData?.state || '',
        // Eliminados: zip_code: initialData?.zip_code || '',
        client_id: client_id,
    }); // 
    const [loading, setLoading] = useState(false); // [cite: 294]
    const [error, setError] = useState(null); // [cite: 294]
// Sincronizar datos iniciales si cambian (para modo edición)
    useEffect(() => {
        if (initialData) {
            setFormData({
                street: initialData.street || '',
                number: initialData.number || '',
                city: initialData.city || '',
       
                // Eliminados: state: initialData.state || '',
                // Eliminados: zip_code: initialData.zip_code || '',
                client_id: client_id,
            }); // [cite: 295, 296]
        }
    }, [initialData, client_id]);
    const handleChange = (e) => {
        const { name, value } = e.target; // [cite: 297]
        setFormData(prev => ({ ...prev, [name]: value })); // [cite: 298]
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // [cite: 299]
        setError(null); // [cite: 299]
        setLoading(true);

        if (!formData.street || !formData.city) {
            setError('La calle y la ciudad son obligatorias.');
            setLoading(false); // [cite: 300]
            return;
        }

        try {
            const endpoint = isEditing ?
                `/addresses/${initialData.id_key}` : 
                `/addresses`; // [cite: 301]
            const method = isEditing ? axios.put : axios.post; // [cite: 302]
            
            const payload = {
                ...formData,
                // Excluir campos innecesarios para PUT (solo enviar cambios)
                ...(isEditing ? { id_key: initialData.id_key } : {})
            };
            await method(endpoint, payload); // [cite: 303]

            alert(`Dirección ${isEditing ? 'actualizada' : 'creada'} con éxito.`);
            onSuccess(); // [cite: 304]
// Llamar a la función de éxito para recargar el perfil

        } catch (err) {
            console.error("Error al guardar dirección:", err); // [cite: 304]
            setError(`Error al ${isEditing ? 'actualizar' : 'crear'} la dirección.`); // [cite: 305]
        } finally {
            setLoading(false); // [cite: 306]
        }
    };
    
    // Estilos CSS estándar (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE)
    const styles = {
        formContainer: { 
            border: '1px solid #424242', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            backgroundColor: '#1e1e1e', // Fondo de tarjeta oscuro
            color: '#e0e0e0',
            borderLeft: `5px solid ${isEditing ? '#ff5722' : '#10b981'}`, // Rojo Primario o Verde Éxito // [cite: 307]
        },
        formTitle: { 
            fontSize: '1.4rem', 
            fontWeight: 'bold', 
            marginBottom: '15px', 
            color: isEditing ? '#ff5722' : '#10b981' // [cite: 307]
        },
        inputRow: { display: 'flex', gap: '15px', marginBottom: '15px' },
        inputGroup: { flex: 1 },
        label: { 
            display: 'block', 
            fontSize: '0.9rem', 
            fontWeight: '600', 
            color: '#bdbdbd', // Color de etiqueta
            marginBottom: '5px' 
        },
        input: { 
            width: '100%', 
            padding: '8px', 
            border: '1px solid #424242', // Borde oscuro
            borderRadius: '5px',
            backgroundColor: '#2e2e2e', // Fondo de input oscuro
            color: '#e0e0e0', 
        },
        buttonGroup: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' },
        saveButton: { 
            padding: '10px 15px', 
            backgroundColor: '#10b981', // Verde de Éxito // [cite: 308]
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            fontWeight: 'bold' 
        },
        cancelButton: { 
            padding: '10px 15px', 
            backgroundColor: '#ef4444', // Rojo de Peligro // [cite: 308]
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer' 
        },
        error: { color: '#ef4444', marginTop: '10px' }
    };
    return (
        <div style={styles.formContainer}>
            <h3 style={styles.formTitle}>
                {isEditing ? `Editar Dirección #${initialData.id_key}` : 'Agregar Nueva Dirección'}
            </h3>
            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
             
                <div style={styles.inputRow}>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Calle</label>
                        <input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Ej: 
Av. Reforma" style={styles.input} required /> {/* [cite: 311] */}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Número</label>
          
                        <input type="text" name="number" value={formData.number} onChange={handleChange} placeholder="Ej: 123" style={styles.input} /> {/* [cite: 312] */}
                    </div>
                </div>

                <div style={styles.inputRow}>
                    <div style={styles.inputGroup}>
    
                        <label style={styles.label}>Ciudad</label>
                        <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ej: Ciudad de México" style={styles.input} required /> {/*  */}
                    </div>
                    {/* Campos de Estado y Código Postal ELIMINADOS */}
                </div>

        
                <div style={styles.buttonGroup}> {/* [cite: 314] */}
                    <button type="submit" disabled={loading} style={styles.saveButton}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'} // Verde oscuro hover
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.saveButton.backgroundColor}
            
                    > {/* [cite: 315, 316] */}
                        {loading ?
'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
                    </button>
                    <button type="button" onClick={onCancel} style={styles.cancelButton}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'} // Rojo oscuro hover
                       
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.cancelButton.backgroundColor}
                    > {/* [cite: 317] */}
                        Cancelar
                    </button>
                </div>
            </form>
   
        </div>
    );
};

export default AddressForm;