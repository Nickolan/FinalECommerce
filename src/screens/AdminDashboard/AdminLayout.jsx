// src/screens/AdminDashboard/AdminLayout.jsx

import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { CiGrid41, CiUser, CiShoppingCart, CiBoxList, CiMoneyBill, CiDeliveryTruck, CiLogout } from "react-icons/ci";
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { clearCart } from '../../redux/slices/cartSlice';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    // Lista de enlaces de la barra lateral (Sidebar)
    const navLinks = [
        { name: "Dashboard", path: "/admin", icon: <CiGrid41 size={20} /> },
        { name: "Clientes", path: "/admin/clients", icon: <CiUser size={20} /> },
        { name: "Pedidos", path: "/admin/orders", icon: <CiDeliveryTruck size={20} /> },
        { name: "Productos", path: "/admin/products", icon: <CiBoxList size={20} /> },
        { name: "Categorías", path: "/admin/categories", icon: <CiShoppingCart size={20} /> },
        { name: "Facturas", path: "/admin/bills", icon: <CiMoneyBill size={20} /> },
    ];
    
    // Función para manejar el cierre de sesión del administrador
    const handleLogout = () => {
        dispatch(logout()); 
        dispatch(clearCart()); 
        navigate('/login'); 
    };

    // Estilos CSS estándar
    const styles = {
        mainContainer: {
            display: 'flex',
            minHeight: '100vh',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f4f4f9', 
        },
        sidebar: {
            width: '250px',
            backgroundColor: '#1f2937', // Fondo negro/gris oscuro
            color: 'white',
            padding: '20px 0',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
            boxShadow: '2px 0 5px rgba(0, 0, 0, 0.2)',
        },
        logo: {
            fontSize: '1.8rem',
            fontWeight: '900',
            color: '#10b981', // Verde brillante
            textAlign: 'center',
            marginBottom: '30px',
            padding: '0 20px',
            cursor: 'pointer',
        },
        nav: {
            flexGrow: 1,
            padding: '0 10px',
        },
        navLink: (isActive) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 15px',
            margin: '5px 0',
            borderRadius: '6px',
            textDecoration: 'none',
            color: 'white',
            backgroundColor: isActive ? '#3b82f6' : 'transparent', // Azul para activo
            fontWeight: isActive ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'background-color 0.15s, transform 0.1s',
        }),
        content: {
            flexGrow: 1,
            backgroundColor: 'white', // Fondo principal blanco
            color: 'black',
            padding: '30px',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
        },
        logoutButton: {
            marginTop: 'auto', 
            padding: '15px 20px',
            backgroundColor: '#ef4444', 
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'background-color 0.2s',
        }
    };

    const handleLinkHover = (e, isActive) => {
        if (!isActive) {
            e.currentTarget.style.backgroundColor = '#374151'; 
        }
    };
    
    return (
        <div style={styles.mainContainer}>
            {/* Sidebar Negro */}
            <div style={styles.sidebar}>
                <div style={styles.logo} onClick={() => navigate('/admin')}>
                    Admin Panel
                </div>
                
                <nav style={styles.nav}>
                    {navLinks.map(link => {
                        // Resalta el enlace activo
                        const isActive = location.pathname === link.path || (link.path === '/admin' && location.pathname === '/admin/');
                        return (
                            <div 
                                key={link.name}
                                style={styles.navLink(isActive)} 
                                onClick={() => navigate(link.path)}
                                onMouseEnter={(e) => handleLinkHover(e, isActive)}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.navLink(isActive).backgroundColor}
                            >
                                {link.icon}
                                {link.name}
                            </div>
                        );
                    })}
                </nav>
                
                {/* Botón de Logout en la base */}
                <button 
                    style={styles.logoutButton} 
                    onClick={handleLogout}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.logoutButton.backgroundColor}
                >
                    <CiLogout size={20} />
                    Cerrar Sesión
                </button>
            </div>
            
            {/* Contenido Principal Blanco */}
            <div style={styles.content}>
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;