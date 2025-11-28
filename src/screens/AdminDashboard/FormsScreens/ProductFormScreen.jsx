import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { CiSaveDown1 } from "react-icons/ci";
import { IoChevronBackCircle } from "react-icons/io5";

const ProductFormScreen = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    
    const isEditing = !!productId;

    // Estado del formulario. Importante: price y stock deben ser manejados como números.
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        category_id: '', // Clave foránea a la tabla de categorías
    });
    const [categories, setCategories] = useState([]); // Listado de categorías disponibles
    
    const [loading, setLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // =========================================================================
    // I. CARGA DE DATOS (Categorías y Producto para Edición)
    // =========================================================================
    
    // Carga las categorías disponibles
    const fetchCategories = async () => {
        try {
            const response = await axios.get(`/categories?skip=0&limit=100`);
            setCategories(response.data);
            if (response.data.length > 0 && !isEditing) {
                // Seleccionar la primera categoría por defecto al crear un nuevo producto
                setFormData(prev => ({ ...prev, category_id: response.data[0].id_key }));
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
            setError("Error al cargar las categorías. No se pueden crear/editar productos sin categorías.");
        }
    };
    
    // Carga los datos del producto si estamos editando
    const fetchProductData = useCallback(async () => {
        if (!isEditing) return;
        
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/products/${productId}`);
            const data = response.data;
            setFormData({
                name: data.name || '',
                price: data.price || '',
                stock: data.stock || '',
                category_id: data.category_id || '',
            });
        } catch (err) {
            console.error(`Error fetching product ${productId}:`, err);
            setError("Error al cargar los datos del producto para edición.");
        } finally {
            setLoading(false);
        }
    }, [isEditing, productId]);
    
    useEffect(() => {
        fetchCategories();
        fetchProductData();
    }, [fetchProductData]);


    // =========================================================================
    // II. HANDLERS
    // =========================================================================
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Manejar Price y Stock como números
        if (name === 'price' || name === 'stock') {
            // Permitir decimales para price, solo enteros para stock
            const isFloat = name === 'price';
            
            // Validar que el valor es numérico antes de asignarlo
            if (value === '' || (isFloat ? /^\d*(\.\d{0,2})?$/.test(value) : /^\d*$/.test(value))) {
                 setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            // Otros campos (name, category_id)
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsSubmitting(true);

        const payload = {
            ...formData,
            // Convertir a tipo de dato numérico requerido por la API
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock, 10), 
            category_id: parseInt(formData.category_id, 10),
        };
        
        // Validación de datos antes de enviar
        if (!payload.name || payload.price <= 0 || payload.stock < 0 || !payload.category_id) {
            setError('Todos los campos son obligatorios. El precio debe ser positivo.');
            setIsSubmitting(false);
            return;
        }


        try {
            const method = isEditing ? axios.put : axios.post;
            const endpoint = isEditing ? `/products/${productId}` : `/products`;
            
            await method(endpoint, payload);

            setSuccessMessage(`Producto ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
            
            // Redirigir al listado después de una pequeña pausa
            setTimeout(() => {
                navigate('/admin/products');
            }, 1000);

        } catch (err) {
            console.error("Error al guardar producto:", err);
            let message = `Error al ${isEditing ? 'actualizar' : 'crear'} el producto.`;
            if (err.response?.status === 409) {
                message = "Error: El producto con este nombre o ID ya existe.";
            } else if (err.response?.data?.detail?.includes('Category not found')) {
                 message = "Error: La categoría seleccionada no existe.";
            }
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Estilos CSS estándar
    const styles = {
        container: { padding: '30px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
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
        select: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: 'white' },
        buttonGroup: { display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' },
        saveButton: { padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
        cancelButton: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
        errorBox: { padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '15px', border: '1px solid #f5c6cb' },
        successBox: { padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '15px', border: '1px solid #c3e6cb' },
    };

    if (loading && isEditing) {
        return <div style={styles.container}>Cargando datos del producto...</div>;
    }
    
    // Si no hay categorías, no podemos crear/editar productos
    if (categories.length === 0 && !isEditing) {
        return <div style={styles.container}>
             <h1 style={styles.header(isEditing)}>Crear Producto</h1>
             <div style={styles.errorBox}>
                 No hay categorías disponibles. Por favor, crea una categoría primero para poder asignar el producto.
                 <button onClick={() => navigate('/admin/categories/new')} style={{...styles.saveButton, marginLeft: '10px', backgroundColor: '#3b82f6'}}>
                    Ir a Crear Categoría
                 </button>
             </div>
        </div>
    }


    return (
        <div style={styles.container}>
            <button 
                style={styles.backButton} 
                onClick={() => navigate('/admin/products')}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d1d5db'}
                onMouseLeave={(e) => e.target.style.backgroundColor = styles.backButton.backgroundColor}
            >
                <IoChevronBackCircle size={20} />
                Volver al Listado
            </button>
            
            <h1 style={styles.header(isEditing)}>
                {isEditing ? `Editar Producto ID: ${productId}` : 'Crear Nuevo Producto'}
            </h1>

            {error && <div style={styles.errorBox}>{error}</div>}
            {successMessage && <div style={styles.successBox}>{successMessage}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
                
                <div style={styles.formGroup}>
                    <label style={styles.label}>Nombre del Producto</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ej: Laptop Gamer X1000"
                        required
                        disabled={isSubmitting}
                        style={styles.input}
                    />
                </div>
                
                <div style={styles.formGroup}>
                    <label style={styles.label}>Precio ($)</label>
                    <input
                        type="text" // Usamos text para controlar mejor el formato numérico
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Ej: 999.99"
                        required
                        disabled={isSubmitting}
                        style={styles.input}
                    />
                </div>
                
                <div style={styles.formGroup}>
                    <label style={styles.label}>Stock (Unidades)</label>
                    <input
                        type="text" // Usamos text para controlar mejor el formato numérico (solo enteros)
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="Ej: 50"
                        required
                        disabled={isSubmitting}
                        style={styles.input}
                    />
                </div>
                
                <div style={styles.formGroup}>
                    <label style={styles.label}>Categoría</label>
                    <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        style={styles.select}
                    >
                        {categories.map(cat => (
                            <option key={cat.id_key} value={cat.id_key}>
                                {cat.name} (ID: {cat.id_key})
                            </option>
                        ))}
                    </select>
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
                        {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Crear Producto')}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => navigate('/admin/products')} 
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

export default ProductFormScreen;