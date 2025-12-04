import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { CiSaveDown1 } from "react-icons/ci";
import { IoChevronBackCircle } from "react-icons/io5";

const CategoryFormScreen = () => {
    const { categoryId } = useParams();
// ID solo está presente en modo edición
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
            const method = isEditing ?
                axios.put : axios.post;
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
// Estilos CSS estándar (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE)
    const styles = {
        container: { padding: '0 10px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#e0e0e0' },
        header: (isEditing) => ({ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            marginBottom: '30px', 
            color: isEditing ? '#3b82f6' : '#ff5722', // Azul para editar, Rojo Primario para crear
        }),
        backButton: { 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            marginBottom: '20px', 
            backgroundColor: '#2e2e2e', 
            color: '#e0e0e0', 
            padding: '8px 15px', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#424242',
            fontWeight: '600',
            transition: 'background-color 0.15s'
        },
        form: { 
            padding: '25px', 
            borderRadius: '10px', 
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)', 
            backgroundColor: '#1e1e1e', // Fondo de formulario oscuro
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#424242',
        },
        formGroup: { marginBottom: '20px' },
        label: { 
            display: 'block', 
            fontSize: '0.9rem', 
            fontWeight: '600', 
            color: '#bdbdbd', 
            marginBottom: '5px' 
        },
        input: { 
            width: '100%', 
            padding: '10px', 
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#424242',
            borderRadius: '5px',
            backgroundColor: '#2e2e2e',
            color: '#e0e0e0'
        },
        buttonGroup: { display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' },
        saveButton: { 
            padding: '10px 20px', 
            backgroundColor: '#ff5722', // Rojo Primario
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
        },
        cancelButton: { 
            padding: '10px 20px', 
            backgroundColor: '#424242', // Gris oscuro
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            transition: 'background-color 0.2s'
        },
        errorBox: { padding: '12px', backgroundColor: '#401818', color: '#ef4444', borderRadius: '8px', marginBottom: '15px', border: '1px solid #dc2626' },
        successBox: { padding: '12px', backgroundColor: '#154030', color: '#10b981', borderRadius: '8px', marginBottom: '15px', border: '1px solid #059669' },
    };

    // Handlers de hover/focus
    const handleBackHover = (e, hover) => {
        e.currentTarget.style.backgroundColor = hover ? '#383838' : styles.backButton.backgroundColor;
    };
    const handleSaveHover = (e, hover) => {
        e.target.style.backgroundColor = hover ? '#e64a19' : styles.saveButton.backgroundColor;
    };
    const handleCancelHover = (e, hover) => {
        e.target.style.backgroundColor = hover ? '#616161' : styles.cancelButton.backgroundColor;
    };
    const handleInputFocus = (e) => { e.target.style.borderColor = '#ff5722'; };
    const handleInputBlur = (e) => { e.target.style.borderColor = '#424242'; };

if (loading) {
        return <div style={styles.container}>Cargando datos de la categoría...</div>;
}

    return (
        <div style={styles.container}>
            <button 
                style={styles.backButton} 
                onClick={() => navigate('/admin/categories')}
                onMouseEnter={(e) => handleBackHover(e, true)}
                onMouseLeave={(e) => handleBackHover(e, false)}
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
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                    />
                </div>

                <div style={styles.buttonGroup}>
       
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        style={styles.saveButton}
            
                        onMouseEnter={(e) => handleSaveHover(e, true)}
                        onMouseLeave={(e) => handleSaveHover(e, false)}
                    >
                        <CiSaveDown1 size={20} style={{verticalAlign: 'middle', marginRight: '5px'}}/>
       
                        {isSubmitting ?
'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => navigate('/admin/categories')} 
 
                        style={styles.cancelButton}
                        onMouseEnter={(e) => handleCancelHover(e, true)}
                        onMouseLeave={(e) => handleCancelHover(e, false)}
                    >
 
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CategoryFormScreen;