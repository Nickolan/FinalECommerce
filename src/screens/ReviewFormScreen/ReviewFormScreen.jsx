import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoStar, IoChevronBackCircle } from "react-icons/io5";

// Estado 'Entregado'
const STATUS_DELIVERED = 3;
const ReviewFormScreen = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { client_id, isLoggedIn } = useSelector(state => state.auth);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // <-- Definición y uso correcto
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Estado del formulario de la reseña
    const [formData, setFormData] = useState({
        product_id: '',
        rating: 4.5,      // <-- Valor inicial cambiado a decimal
        comment: '',
        client_id: parseInt(client_id, 10),
    });
    // =========================================================================
    // I. CARGA DE DATOS Y VALIDACIÓN
    // =========================================================================

    const fetchOrderData = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!isLoggedIn || !client_id) {
            navigate('/login');
            return;
        }


        try {
            const response = await axios.get(`/orders/${orderId}`);
            const orderData = response.data;

            // 1. Validar que el pedido esté en estado "Entregado"
            if (orderData.status !== STATUS_DELIVERED) {
                setError("Solo se pueden reseñar pedidos que han sido marcados como Entregados.");

                setLoading(false);
                return;
            }

            setOrder(orderData);

            // 2. Si hay order_details, seleccionar el primer producto por defecto

            // CORRECCIÓN: Asignar un valor inicial al product_id si existen detalles
            if (orderData.order_details && orderData.order_details.length > 0) {
                setFormData(prev => ({
                    ...prev,

                    product_id: orderData.order_details[0].product_id
                }));
            }

        } catch (err) {
            console.error(`Error fetching order ${orderId}:`, err);
            setError("Error al cargar los detalles del pedido para la reseña.");
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }, [orderId, client_id, isLoggedIn, navigate]);

    useEffect(() => {
        fetchOrderData();
    }, [fetchOrderData]);
    // Opciones de productos comprados en esta orden
    // CORRECCIÓN: Ahora se itera sobre order.order_details para obtener los productos.
    const purchasedProducts = useMemo(() => {
        // order.order_details contiene los detalles de la orden (cantidad, precio, product_id)
        // Y ASUMIMOS que anida la información completa del producto (product: {id_key, name})
        return order?.order_details?.map(detail => ({
            id: detail.product_id,
            // Usamos detail.product.name si está anidado, o fallback al product_id

            name: detail.product?.name || `Producto ID: ${detail.product_id}`
        })) || [];
    }, [order]);
    // =========================================================================
    // II. HANDLERS Y SUBMISSION
    // =========================================================================

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'rating' ? parseFloat(value) : value }));
    };
    const handleRatingChange = (newRating) => {
        setFormData(prev => ({ ...prev, rating: newRating }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        // 1. Validar que se haya seleccionado un producto
        if (!formData.product_id) {
            setError('Debe seleccionar un producto para reseñar.');
            setIsSubmitting(false);
            return;
        }

        // 2. Validar longitud mínima del comentario (10 caracteres)
        if (formData.comment.length > 0 && formData.comment.length < 10) {
            setError('El comentario debe tener al menos 10 caracteres si decides escribir uno.');
            setIsSubmitting(false);
            return;
        }

        // CORRECCIÓN: Si el producto tiene un ID inválido, no enviar
        if (isNaN(formData.product_id)) {
            setError('Error de producto: ID inválido.');
            setIsSubmitting(false);
            return;
        }

        const payload = {
            ...formData,
            // Aseguramos que los IDs sean números
            rating: formData.rating,
            product_id: parseInt(formData.product_id, 10),
            client_id: parseInt(client_id, 10),
        };
        try {
            // Asumimos el endpoint POST /reviews existe y acepta {product_id, client_id, rating, comment}
            await axios.post(`/reviews`, payload);
            alert(`✅ Reseña publicada con éxito para el Producto ID ${formData.product_id}.`);
            // Redirigir al detalle del pedido
            navigate(`/orders/${orderId}`);
        } catch (err) {
            console.error("Error al publicar reseña:", err);
            let message = "Error al publicar la reseña.";
            if (err.response?.status === 409) {
                message = "ERROR: Ya has publicado una reseña para este producto. No se permiten duplicados.";
            } else if (err.response?.status === 400 && err.response.data?.detail) {
                message = `Error de la API: ${err.response.data.detail}`;
            }
            setError(message); // <-- Usamos setError
        } finally {
            setIsSubmitting(false);
        }
    };
    // =========================================================================
    // III. RENDERIZADO (Mercado Fake Style)
    // =========================================================================

    const styles = {
        container: {
            maxWidth: '700px',
            margin: '40px auto',
            padding: '30px',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#1e1e1e', // Fondo de tarjeta principal
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
            color: '#e0e0e0'
        },
        header: {
            fontSize: '2rem',
            fontWeight: 'bold',
            borderBottom: '2px solid #ff5722', // Rojo Primario
            paddingBottom: '10px',
            marginBottom: '20px',
            color: '#ff5722' // Rojo Primario
        },
        backButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '20px',
            backgroundColor: '#2e2e2e', // Fondo de botón oscuro
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
            border: '1px solid #424242',
            backgroundColor: '#2e2e2e'
        },
        formGroup: { marginBottom: '20px' },
        label: {
            display: 'block',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#bdbdbd', // Etiqueta gris claro
            marginBottom: '8px'
        },
        select: {
            width: '100%',
            padding: '10px',
            border: '1px solid #424242',
            borderRadius: '5px',
            backgroundColor: '#1e1e1e', // Fondo de input/select
            color: '#e0e0e0',
        },
        textarea: {
            width: '100%',
            padding: '10px',
            border: '1px solid #424242',
            borderRadius: '5px',
            minHeight: '100px',
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
        },
        submitButton: {
            padding: '12px 25px',
            backgroundColor: '#ff5722', // Rojo Primario
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            transition: 'background-color 0.2s'
        },
        errorBox: { padding: '12px', backgroundColor: '#401818', color: '#ef4444', borderRadius: '8px', marginBottom: '15px', border: '1px solid #dc2626' },
        loadingText: { textAlign: 'center', color: '#ff5722', fontSize: '1.2rem', margin: '40px 0' },

        // Estilos para el Selector de Estrellas (ML-style)
        starContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '10px 0',
        },
        star: (filled) => ({
            color: filled ?
                '#ff5722' : '#424242', // Rojo Primario vs Gris Oscuro
            transition: 'color 0.1s',
            cursor: 'pointer',
        }),
        currentRatingText: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#ff5722'
        },
        charCount: {
            textAlign: 'right',
            fontSize: '0.8rem',
            color: formData.comment.length < 10 && formData.comment.length > 0 ? '#ff5722' : '#bdbdbd'
        }
    };
    if (loading) {
        return <div style={styles.container}><p style={styles.loadingText}>Cargando validación del pedido...</p></div>;
    }

    if (error) {
        return <div style={styles.container}>
            <p style={styles.errorBox}>{error}</p>
            <button
                style={styles.backButton}
                onClick={() => navigate(`/orders/${orderId}`)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#383838'}
                onMouseLeave={(e) => e.target.style.backgroundColor = styles.backButton.backgroundColor}
            >

                <IoChevronBackCircle size={20} />
                Volver al Pedido
            </button>
        </div>;
    }

    return (
        <div style={styles.container}>
            <button
                style={styles.backButton}
                onClick={() => navigate(`/orders/${orderId}`)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#383838'}
                onMouseLeave={(e) => e.target.style.backgroundColor = styles.backButton.backgroundColor}
            >
                <IoChevronBackCircle size={20} />

                Volver al Pedido #{orderId}
            </button>

            <h1 style={styles.header}>Tu Opinión es Importante</h1>
            <p style={{ color: '#bdbdbd', marginBottom: '25px' }}>Califica tu experiencia con el producto de tu Pedido **#{orderId}**.</p>

            {error && <div style={styles.errorBox}>{error}</div>} {/* <-- Uso de 'error' corregido */}


            <form onSubmit={handleSubmit} style={styles.form}>

                {/* 1. Selección de Producto */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Producto a Reseñar</label>

                    <select
                        name="product_id"
                        value={formData.product_id}
                        onChange={handleChange}

                        required
                        // Si hay más de un producto, el select no debe estar deshabilitado
                        disabled={isSubmitting || purchasedProducts.length === 0}
                        style={styles.select}
                    >
                        {purchasedProducts.length === 0 ?
                            (
                                <option value="">No se encontraron productos en esta orden</option>
                            ) : (
                                purchasedProducts.map(p => (

                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>

                                ))
                            )}

                    </select>

                </div>

                {/* 2. Calificación (Estrellas ML-Style) */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Calificación (1.0 a 5.0)</label>
                    <input
                        type="number"
                        name="rating"
                        value={formData.rating}
                        onChange={handleChange}
                        min="1.0"
                        max="5.0"
                        step="0.5" // Permite decimales de 0.5
                        required
                        disabled={isSubmitting}
                        style={styles.select} // Reutilizamos el estilo del select
                    />
                </div>


                {/* 3. Comentario */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Comentario (Mínimo 10 caracteres)</label>
                    <textarea
                        name="comment"

                        value={formData.comment}
                        onChange={handleChange}
                        placeholder="Describe tu experiencia de manera objetiva..."
                        disabled={isSubmitting}

                        style={styles.textarea}
                        maxLength={500}
                    />
                    <p style={styles.charCount}>
                        {formData.comment.length} / 500
                    </p>
                </div>

                <button

                    type="submit"
                    // Deshabilitar si no hay productos o si el comentario es < 10 caracteres y no está vacío
                    disabled={isSubmitting || purchasedProducts.length === 0 || (formData.comment.length > 0 && formData.comment.length < 10)}
                    style={styles.submitButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e64a19'}

                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.submitButton.backgroundColor}
                >
                    {isSubmitting ?
                        'Publicando...' : 'Publicar Reseña'}
                </button>
            </form>
        </div>
    );
};

export default ReviewFormScreen;