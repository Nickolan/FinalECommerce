// src/screens/AdminDashboard/DashboardScreen.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Importación de iconos
import { CiUser, CiShoppingCart, CiBoxList, CiMoneyBill, CiDeliveryTruck, CiGrid41 } from "react-icons/ci";

// --- FUNCIÓN DE UTILIDAD: Obtener el recuento a través de GET List ---
const fetchCount = async (endpoint) => {
    try {
        // Workaround: Usamos un límite alto para obtener la mayoría de las entidades
        // ya que el servidor no tiene un endpoint de conteo dedicado.
        const response = await axios.get(`${endpoint}?skip=0&limit=10000`); 
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

    // Definición de los 5 cuadros
    const cardsData = [
        { title: "Clientes", countKey: 'clients', icon: <CiUser size={28} />, bgColor: '#2563eb', path: 'clients' }, // Blue
        { title: "Pedidos", countKey: 'orders', icon: <CiDeliveryTruck size={28} />, bgColor: '#f59e0b', path: 'orders' }, // Orange
        { title: "Productos", countKey: 'products', icon: <CiBoxList size={28} />, bgColor: '#10b981', path: 'products' }, // Green
        { title: "Categorías", countKey: 'categories', icon: <CiShoppingCart size={28} />, bgColor: '#ef4444', path: 'categories' }, // Red
        { title: "Facturas", countKey: 'bills', icon: <CiMoneyBill size={28} />, bgColor: '#6b7280', path: 'bills' }, // Gray
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

    // Estilos internos
    const dashboardStyles = {
        header: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '30px', color: '#1f2937' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
        card: (bgColor) => ({
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            backgroundColor: 'white',
            borderLeft: `8px solid ${bgColor}`,
        }),
        cardHover: {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 15px rgba(0, 0, 0, 0.15)',
        },
        cardTitle: { fontSize: '1rem', color: '#6b7280', fontWeight: '500', marginBottom: '10px' },
        cardCount: { fontSize: '2.5rem', fontWeight: '800', color: '#1f2937' },
        cardIcon: (color) => ({
            color: color,
            padding: '10px',
            borderRadius: '50%',
            backgroundColor: `${color}1A`, // 10% de opacidad
            marginBottom: '10px',
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
            <h2 style={dashboardStyles.header}>Resumen General</h2>
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
                                <span style={{fontSize: '1.5rem', color: '#6b7280'}}>Cargando...</span> 
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