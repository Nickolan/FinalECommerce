import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { CiSaveDown1 } from "react-icons/ci";
import { IoChevronBackCircle } from "react-icons/io5";

const CategoryFormScreen = () => {
    const { categoryId } = useParams(); // ID solo está presente en modo edición
    const navigate = useNavigate();
    
    // Si hay un categoryId, estamos editando
    const isEditing = !!categoryId;

    const [formData, setFormData] = useState({
        name: '',
    });
    const [loading, setLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // =========================================================================
    // I. CARGA DE DATOS PARA EDICIÓN
    // =========================================================================
    
    const fetchCategoryData = useCallback(async () => {
        if (!isEditing) return;
        
        setLoading(true);
        setError(null);

        try {
            // Asumimos que GET /categories/{id} es el endpoint de detalle
            const response = await axios.get(`/categories/${categoryId}`);
            setFormData({
                name: response.data.name || '',
            });
        } catch (err) {
            console.error(`Error fetching category ${categoryId}:`, err);
            setError("Error al cargar los datos de la categoría para edición.");
        } finally {
            setLoading(false);
        }
    }, [isEditing, categoryId]);

    useEffect(() => {
        fetchCategoryData();
    }, [fetchCategoryData]);


    // =========================================================================
    // II. HANDLERS
    // =========================================================================
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsSubmitting(true);

        if (!formData.name) {
            setError('El nombre de la categoría es obligatorio.');
            setIsSubmitting(false);
            return;
        }

        try {
            const method = isEditing ? axios.put : axios.post;
            const endpoint = isEditing ? `/categories/${categoryId}` : `/categories`;
            
            await method(endpoint, formData);

            setSuccessMessage(`Categoría ${isEditing ? 'actualizada' : 'creada'} con éxito.`);
            
            // Redirigir al listado después de una pequeña pausa
            setTimeout(() => {
                navigate('/admin/categories');
            }, 1000);

        } catch (err) {
            console.error("Error al guardar categoría:", err);
            let message = `Error al ${isEditing ? 'actualizar' : 'crear'} la categoría.`;
            if (err.response?.status === 409) {
                message = "Error: El nombre de la categoría ya existe (conflicto de unicidad).";
            }
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Estilos CSS estándar
    const styles = {
        container: { padding: '30px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
        header: (isEditing) => ({ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            marginBottom: '30px', 
            color: isEditing ? '#3b82f6' : '#10b981',
        }),
        backButton: { display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', backgroundColor: '#e5e7eb', color: '#1f2937', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', border: 'none', fontWeight: '600' },
        form: { padding: '25px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)', backgroundColor: 'white', border: '1px solid #e5e7eb' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '5px' },
        input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' },
        buttonGroup: { display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' },
        saveButton: { padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
        cancelButton: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
        errorBox: { padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '15px', border: '1px solid #f5c6cb' },
        successBox: { padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '15px', border: '1px solid #c3e6cb' },
    };

    if (loading) {
        return <div style={styles.container}>Cargando datos de la categoría...</div>;
    }

    return (
        <div style={styles.container}>
            <button 
                style={styles.backButton} 
                onClick={() => navigate('/admin/categories')}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d1d5db'}
                onMouseLeave={(e) => e.target.style.backgroundColor = styles.backButton.backgroundColor}
            >
                <IoChevronBackCircle size={20} />
                Volver al Listado
            </button>
            
            <h1 style={styles.header(isEditing)}>
                {isEditing ? `Editar Categoría ID: ${categoryId}` : 'Crear Nueva Categoría'}
            </h1>

            {error && <div style={styles.errorBox}>{error}</div>}
            {successMessage && <div style={styles.successBox}>{successMessage}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
                
                <div style={styles.formGroup}>
                    <label style={styles.label}>Nombre de la Categoría</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ej: Electrónica, Ropa, Libros"
                        required
                        disabled={isSubmitting}
                        style={styles.input}
                    />
                </div>

                <div style={styles.buttonGroup}>
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        style={styles.saveButton}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.saveButton.backgroundColor}
                    >
                        <CiSaveDown1 size={20} style={{verticalAlign: 'middle', marginRight: '5px'}}/>
                        {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => navigate('/admin/categories')} 
                        style={styles.cancelButton}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#555'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.cancelButton.backgroundColor}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CategoryFormScreen;