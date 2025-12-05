// src/screens/AdminDashboard/DashboardScreen.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Importación de iconos
import { CiUser, CiShoppingCart, CiBoxList, CiMoneyBill, CiDeliveryTruck, CiGrid41 } from "react-icons/ci";
// --- FUNCIÓN DE UTILIDAD: Obtener el recuento a través de GET List ---
const fetchCount = async (endpoint) => {
    try {
        console.log('Ejecutando endpoint');
        
        // Workaround: Usamos un límite alto para obtener la mayoría de las entidades
        // ya que el servidor no tiene un endpoint de conteo dedicado.
        const response = await axios.get(`${endpoint}?skip=0&limit=10000`); 
        // Asumimos que la API de listado retorna un array para contar su longitud
        return response.data.length; 
    } catch (error) {
        console.error(`Error fetching count for ${endpoint}:`, error);
        return 'Error';
    }
};

const DashboardScreen = () => {
    const navigate = useNavigate();
    const [counts, setCounts] = useState({ clients: '...', orders: '...', categories: '...', products: '...', bills: '...' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
// Definición de los 5 cuadros (Cambiamos colores para el tema Mercado Fake)
    const cardsData = [
        { title: "Clientes", countKey: 'clients', icon: <CiUser size={28} />, bgColor: '#ff5722', path: 'clients' }, // Rojo Primario
        { title: "Pedidos", countKey: 'orders', icon: <CiDeliveryTruck size={28} />, bgColor: '#10b981', path: 'orders' }, // Verde de Éxito
        { title: "Productos", countKey: 'products', icon: <CiBoxList size={28} />, bgColor: '#3b82f6', path: 'products' }, // Azul (Acción/Catálogo)
        { title: "Categorías", countKey: 'categories', icon: <CiShoppingCart size={28} />, bgColor: '#f59e0b', path: 'categories' }, // Naranja (Secundario)
        { title: "Facturas", countKey: 'bills', icon: <CiMoneyBill size={28} />, bgColor: '#bdbdbd', path: 'bills' }, // Gris Claro
    ];
    useEffect(() => {
        const loadCounts = async () => {
            
            setLoading(true);
            setError(null);
            try {
                const results = await Promise.all([
                    fetchCount('/clients'),
       
                    fetchCount('/orders'),
                    fetchCount('/categories'),
                    fetchCount('/products'),
                    fetchCount('/bills'),
                ]);

           
                setCounts({
                    clients: results[0],
                    orders: results[1],
                    categories: results[2],
                    products: results[3],
           
                    bills: results[4],
                });
            } catch (err) {
                setError('Error al cargar todos los resúmenes.');
            } finally {
                setLoading(false);
        
            }
        };

        loadCounts();
    }, []);
// Estilos internos (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE)
    const dashboardStyles = {
        header: { fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '30px', color: '#e0e0e0' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
        card: (bgColor) => ({
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)', // Sombra fuerte
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            backgroundColor: '#1e1e1e', // Fondo de tarjeta oscuro
            borderLeft: `5px solid ${bgColor}`,
            color: '#e0e0e0',
        }),
        cardHover: {
            transform: 'translateY(-5px)',
            
            boxShadow: '0 8px 15px rgba(0, 0, 0, 0.7)',
        },
        cardTitle: { fontSize: '1rem', color: '#bdbdbd', fontWeight: '500', marginBottom: '10px' },
        cardCount: { fontSize: '2.8rem', fontWeight: '900', color: '#e0e0e0' },
        // CORRECCIÓN: Centrado de íconos
        cardIcon: (color) => ({
            color: color,
            padding: '10px',
            borderRadius: '50%',
            backgroundColor: `${color}33`, // 20% de opacidad para el fondo del ícono
            marginBottom: '10px',
            // --- Ajuste para centrar el ícono ---
            width: '50px', // Tamaño fijo para el círculo
            height: '50px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            // --- Fin de ajuste ---
        })
    };
    const handleMouseEnter = (e) => {
        e.currentTarget.style.transform = dashboardStyles.cardHover.transform;
        e.currentTarget.style.boxShadow = dashboardStyles.cardHover.boxShadow;
    };
    const handleMouseLeave = (e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
    };
    if (error) return <div style={{ color: '#ef4444' }}>Error: {error}</div>;

    return (
        <div>
            {/* El H1 del título de la página lo maneja AdminLayout */}
            <h2 style={{...dashboardStyles.header, color: '#bdbdbd', fontSize: '1.5rem'}}>Resumen General de Entidades</h2>
            <div style={dashboardStyles.grid}>
                {cardsData.map((card) => (
                    <div 
                
                        key={card.title} 
                        style={dashboardStyles.card(card.bgColor)}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                   
                        onClick={() => navigate(`/admin/${card.path}`)}
                    >
                        <div style={dashboardStyles.cardIcon(card.bgColor)}>
                            {card.icon}
                    
                        </div>
                        <p style={dashboardStyles.cardTitle}>Total de {card.title}</p>
                        <p style={dashboardStyles.cardCount}>
                            {loading ? 
              
                                  <span style={{fontSize: '1.5rem', color: '#bdbdbd'}}>Cargando...</span> 
                                : counts[card.countKey]
                            }
                
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardScreen;