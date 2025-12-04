// --- INICIO DEL ARCHIVO: src\screens\AdminDashboard\FormsScreens\ProductFormScreen.jsx ---

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { CiSaveDown1 } from "react-icons/ci";
import { IoChevronBackCircle, IoFlashOutline, IoCloudOfflineOutline } from "react-icons/io5";

const ProductFormScreen = () => {
    const { productId } = useParams();
    const navigate = useNavigate();

    const isEditing = !!productId;

    // Estado del formulario.
    // Importante: price y stock deben ser manejados como números.
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
    const [hasOrders, setHasOrders] = useState(false); // <-- NUEVO: Estado para verificar órdenes

    const [latency, setLatency] = useState(null); 
    const [cacheStatus, setCacheStatus] = useState('N/A')
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
        // Resetear el estado de caché en cada llamada
        setCacheStatus('Consultando...');
        setLatency(null);

        // <-- INICIO DE MEDICIÓN DE TIEMPO -->
        const startTime = Date.now();

        try {
            const response = await axios.get(`/products/${productId}`);
            const data = response.data;
            
            // <-- FIN DE MEDICIÓN DE TIEMPO -->
            const endTime = Date.now();
            const timeDiff = endTime - startTime;
            setLatency(timeDiff);

            // Inferencia de caché (Heurística en el frontend)
            // Asumimos: < 70ms = Cache Hit (Rápido) | > 150ms = Cache Miss (Lento/DB)
            if (timeDiff < 300) {
                setCacheStatus('Caché: HIT ⚡');
            } else if (timeDiff < 450) {
                setCacheStatus('Caché: MISS (Latencia media)');
            } else {
                 setCacheStatus('Base de Datos (Latencia alta)');
            }
            // <-- FIN INFERENCIA -->

            setFormData({
                name: data.name || '',
                price: data.price || '',
                stock: data.stock || '',
                category_id: data.category_id || '',
            });
            
            // ... (rest of the code remains unchanged) ...

        } catch (err) {
            console.error(`Error fetching product ${productId}:`, err);
            setError("Error al cargar los datos del producto para edición.");
            setCacheStatus('ERROR DE CONEXIÓN');
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
            const method = isEditing ?
                axios.put : axios.post;
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

    // Handler para Eliminar (si no tiene órdenes) o Desactivar (si tiene órdenes).
    const handleDeleteOrDeactivate = async () => {
        setError(null);
        setSuccessMessage(null);

        if (!isEditing || !productId) return;

        const actionType = hasOrders ? 'DESACTIVAR (Stock a 0)' : 'ELIMINAR PERMANENTEMENTE';

        const confirmation = window.confirm(`ADVERTENCIA: ¿Estás seguro de ${actionType} el Producto ID ${productId}?`);
        if (!confirmation) return;

        setIsSubmitting(true);

        try {
            if (hasOrders) {
                // Caso 1: Tiene órdenes asociadas -> DESACTIVAR (PUT stock: 0)
                const deactivatePayload = {
                    name: formData.name,
                    price: parseFloat(formData.price),
                    stock: 0, // Forzar stock a cero
                    category_id: parseInt(formData.category_id, 10),
                };

                await axios.put(`/products/${productId}`, deactivatePayload);
                alert(`✅ Producto ID ${productId} DESACTIVADO con éxito (Stock: 0).`);

            } else {
                // Caso 2: No tiene órdenes asociadas -> ELIMINAR (DELETE)
                await axios.delete(`/products/${productId}`);
                alert(`✅ Producto ID ${productId} ELIMINADO completamente con éxito.`);
            }

            navigate('/admin/products'); // Volver a la lista después de la acción.

        } catch (err) {
            console.error(`Error al gestionar el producto ${productId}:`, err);
            // Manejamos errores generales (comunicación, 404, etc.)
            setError(`Fallo al gestionar el producto: ${err.response?.data?.detail || 'Error de conexión o API'}.`);

        } finally {
            setIsSubmitting(false);
        }
    };

    // Estilos CSS estándar (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE)
    const styles = {
        container: { padding: '0 10px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#e0e0e0' },
        header: (isEditing) => ({
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '30px',

            color: isEditing ? '#3b82f6' : '#ff5722', // Azul para editar, Rojo para crear
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
            border: '1px solid #424242',
            fontWeight: '600',

            transition: 'background-color 0.15s'
        },
        form: {
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
            backgroundColor: '#1e1e1e', // Fondo de formulario oscuro

            border: '1px solid #424242'
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
            border: '1px solid #424242',
            borderRadius: '5px',
            backgroundColor: '#2e2e2e',

            color: '#e0e0e0'
        },
        select: {
            width: '100%',
            padding: '10px',
            border: '1px solid #424242',
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
        deleteButton: { // <-- NUEVO ESTILO
            padding: '10px 20px',
            backgroundColor: '#ef4444', // Rojo de Peligro
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
        },
        errorBox: {
            padding: '12px', backgroundColor: '#401818',
            color: '#ef4444', borderRadius: '8px', marginBottom: '15px', border: '1px solid #dc2626'
        },
        successBox: { padding: '12px', backgroundColor: '#154030', color: '#10b981', borderRadius: '8px', marginBottom: '15px', border: '1px solid #059669' },
        cacheIndicator: (status) => {
            let color = '#bdbdbd';
            if (status.includes('HIT')) color = '#10b981'; // Verde para éxito
            if (status.includes('MISS')) color = '#f59e0b'; // Naranja para advertencia
            if (status.includes('Base')) color = '#ef4444'; // Rojo para base de datos/falla
            
            return {
                padding: '10px 15px', 
                borderRadius: '8px', 
                backgroundColor: '#2e2e2e',
                color: color, 
                fontWeight: 'bold', 
                border: `1px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem',
                justifyContent: 'center'
            }
        }
    };
    // Handlers de hover
    const handleBackHover = (e, hover) => {
        e.currentTarget.style.backgroundColor = hover ?
            '#383838' : styles.backButton.backgroundColor;
    };
    const handleSaveHover = (e, hover) => {
        e.target.style.backgroundColor = hover ?
            '#e64a19' : styles.saveButton.backgroundColor;
    };
    const handleCancelHover = (e, hover) => {
        e.target.style.backgroundColor = hover ?
            '#616161' : styles.cancelButton.backgroundColor;
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
                <button
                    onClick={() => navigate('/admin/categories/new')}
                    style={{ ...styles.saveButton, marginLeft: '10px', backgroundColor: '#3b82f6' }} // Azul para ir a crear
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) =>
                        e.target.style.backgroundColor = '#3b82f6'}
                >
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
                onMouseEnter={(e) => handleBackHover(e, true)}
                onMouseLeave={(e) => handleBackHover(e, false)}
            >

                <IoChevronBackCircle size={20} />
                Volver al Listado
            </button>

            <h1 style={styles.header(isEditing)}>
                {isEditing ?
                    `Editar Producto ID: ${productId}` : 'Crear Nuevo Producto'}
            </h1>

            {isEditing && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>

                    {/* 1. Estado de Caché */}
                    <div style={styles.cacheIndicator(cacheStatus)}>
                        {cacheStatus.includes('HIT') ? <IoFlashOutline size={20} /> : <IoCloudOfflineOutline size={20} />}
                        {cacheStatus}
                    </div>

                    {/* 2. Latencia de Petición */}
                    <div style={styles.cacheIndicator(cacheStatus)}>
                        <IoFlashOutline size={20} />
                        Latencia: {latency !== null ? `${latency} ms` : 'N/A'}
                    </div>
                </div>
            )}


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
                        <option value="" disabled>-- Seleccione una Categoría --</option>

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
                        onMouseEnter={(e) => handleSaveHover(e, true)}
                        onMouseLeave={(e) => handleSaveHover(e, false)}

                    >

                        <CiSaveDown1 size={20} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                        {isSubmitting ?
                            'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Crear Producto')}
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            navigate('/admin/products')}
                        style={styles.cancelButton}
                        onMouseEnter={(e) => handleCancelHover(e, true)}
                        onMouseLeave={(e) => handleCancelHover(e, false)}


                    >
                        Cancelar
                    </button>
                </div>

                {/* BOTÓN DE GESTIÓN (ELIMINAR/DESACTIVAR) - Visible solo en Edición */}
                {isEditing && (
                    <div style={{ marginTop: '30px', borderTop: '1px solid #424242', paddingTop: '20px', textAlign: 'right' }}>
                        <button
                            type="button"
                            onClick={handleDeleteOrDeactivate}
                            disabled={isSubmitting}
                            style={styles.deleteButton}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = styles.deleteButton.backgroundColor}
                        >
                            {isSubmitting ? 'Procesando...' : (hasOrders ? 'DESACTIVAR (Stock 0)' : 'ELIMINAR')}
                        </button>
                    </div>
                )}
            </form>
        </div>

    );
};

export default ProductFormScreen;

// --- FIN DEL ARCHIVO: src\screens\AdminDashboard\FormsScreens\ProductFormScreen.jsx ---