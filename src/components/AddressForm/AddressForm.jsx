import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddressForm = ({ client_id, initialData, onSuccess, onCancel }) => {
    const isEditing = !!initialData;
    
    const [formData, setFormData] = useState({
        street: initialData?.street || '',
        number: initialData?.number || '',
        city: initialData?.city || '',
        state: initialData?.state || '',
        zip_code: initialData?.zip_code || '',
        client_id: client_id,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Sincronizar datos iniciales si cambian (para modo edición)
    useEffect(() => {
        if (initialData) {
            setFormData({
                street: initialData.street || '',
                number: initialData.number || '',
                city: initialData.city || '',
                state: initialData.state || '',
                zip_code: initialData.zip_code || '',
                client_id: client_id,
            });
        }
    }, [initialData, client_id]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!formData.street || !formData.city) {
            setError('La calle y la ciudad son obligatorias.');
            setLoading(false);
            return;
        }

        try {
            const endpoint = isEditing ? 
                `/addresses/${initialData.id_key}` : 
                `/addresses`;
            const method = isEditing ? axios.put : axios.post;
            
            const payload = {
                ...formData,
                // Excluir campos innecesarios para PUT (solo enviar cambios)
                ...(isEditing ? { id_key: initialData.id_key } : {})
            };
            
            await method(endpoint, payload);

            alert(`Dirección ${isEditing ? 'actualizada' : 'creada'} con éxito.`);
            onSuccess(); // Llamar a la función de éxito para recargar el perfil

        } catch (err) {
            console.error("Error al guardar dirección:", err);
            setError(`Error al ${isEditing ? 'actualizar' : 'crear'} la dirección.`);
        } finally {
            setLoading(false);
        }
    };
    
    // Estilos CSS estándar
    const styles = {
        formContainer: { border: '1px solid #10b981', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f0fff4' },
        formTitle: { fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '15px', color: isEditing ? '#3b82f6' : '#10b981' },
        inputRow: { display: 'flex', gap: '15px', marginBottom: '15px' },
        inputGroup: { flex: 1 },
        label: { display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '5px' },
        input: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px' },
        buttonGroup: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' },
        saveButton: { padding: '10px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
        cancelButton: { padding: '10px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
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
                        <input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Ej: Av. Reforma" style={styles.input} required />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Número</label>
                        <input type="text" name="number" value={formData.number} onChange={handleChange} placeholder="Ej: 123" style={styles.input} />
                    </div>
                </div>

                <div style={styles.inputRow}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Ciudad</label>
                        <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ej: Ciudad de México" style={styles.input} required />
                    </div>
                </div>

                <div style={styles.buttonGroup}>
                    <button type="submit" disabled={loading} style={styles.saveButton}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.saveButton.backgroundColor}
                    >
                        {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
                    </button>
                    <button type="button" onClick={onCancel} style={styles.cancelButton}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.cancelButton.backgroundColor}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddressForm;