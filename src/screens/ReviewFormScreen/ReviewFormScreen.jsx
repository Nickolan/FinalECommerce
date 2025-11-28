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
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estado del formulario de la reseña
    const [formData, setFormData] = useState({
        product_id: '', // ID del producto a reseñar
        rating: 5,      // Calificación de 1 a 5
        comment: '',    // Comentario del usuario
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
            // ESTA PARTE FUE CORREGIDA: Asignar un valor inicial al product_id si existen detalles
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
        setFormData(prev => ({ ...prev, [name]: name === 'rating' ? parseInt(value, 10) : value }));
    };
    
    const handleRatingChange = (newRating) => {
        setFormData(prev => ({ ...prev, rating: newRating }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (!formData.product_id) {
            setError('Debe seleccionar un producto para reseñar.');
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
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // =========================================================================
    // III. RENDERIZADO
    // =========================================================================

    const styles = {
        container: { maxWidth: '700px', margin: '40px auto', padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' },
        header: { fontSize: '2rem', fontWeight: 'bold', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px', marginBottom: '20px', color: '#f59e0b' },
        backButton: { display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', backgroundColor: '#f3f4f6', color: '#1f2937', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', border: '1px solid #e5e7eb', fontWeight: '600' },
        form: { padding: '25px', borderRadius: '10px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '8px' },
        select: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: 'white' },
        textarea: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', minHeight: '100px' },
        submitButton: { padding: '12px 25px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'background-color 0.2s' },
        errorBox: { padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '15px', border: '1px solid #f5c6cb' },
        loadingText: { textAlign: 'center', color: '#3b82f6', fontSize: '1.2rem', margin: '40px 0' },
        
        // Estilos para el Selector de Estrellas
        starContainer: { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' },
        star: (filled) => ({
            color: filled ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.1s',
        })
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
            >
                <IoChevronBackCircle size={20} />
                Volver al Pedido #{orderId}
            </button>
            
            <h1 style={styles.header}>Dejar Reseña (Pedido #{orderId})</h1>
            <p style={{ color: '#6b7280', marginBottom: '25px' }}>Selecciona el producto que deseas calificar y comparte tu experiencia.</p>

            {error && <div style={styles.errorBox}>{error}</div>}

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
                        {purchasedProducts.length === 0 ? (
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

                {/* 2. Calificación (Estrellas) */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Calificación ({formData.rating} de 5)</label>
                    <div style={styles.starContainer}>
                        {[1, 2, 3, 4, 5].map((starValue) => (
                            <IoStar 
                                key={starValue}
                                size={32}
                                style={styles.star(starValue <= formData.rating)}
                                onClick={() => handleRatingChange(starValue)}
                                onMouseEnter={(e) => e.currentTarget.style.color = starValue <= formData.rating ? '#d97706' : '#9ca3af'}
                                onMouseLeave={(e) => e.currentTarget.style.color = starValue <= formData.rating ? '#f59e0b' : '#d1d5db'}
                            />
                        ))}
                    </div>
                </div>

                {/* 3. Comentario */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Comentario (Opcional)</label>
                    <textarea
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        placeholder="Comparte tu opinión sobre el producto y la experiencia de compra..."
                        disabled={isSubmitting}
                        style={styles.textarea}
                        maxLength={500}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    style={styles.submitButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d97706'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.submitButton.backgroundColor}
                >
                    {isSubmitting ? 'Publicando...' : 'Publicar Reseña'}
                </button>
            </form>
        </div>
    );
};

export default ReviewFormScreen;