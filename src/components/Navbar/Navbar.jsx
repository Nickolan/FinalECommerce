import React from 'react';
// Importación de librerías externas de Redux
import { useSelector, useDispatch } from 'react-redux'; 
// Rutas corregidas asumiendo que Navbar está dentro de 'src/components'
import { logout } from '../../redux/slices/authSlice'; 
import { clearCart } from '../../redux/slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import { CiLogout, CiShoppingCart, CiUser } from "react-icons/ci";

const Navbar = () => {
    // Obtener el estado global de autenticación desde Redux
    // Usamos client_email para mostrar el nombre del usuario
    const { isLoggedIn, client_email, client_name } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    

    // Función para manejar el cierre de sesión
    const handleLogout = () => {
        // 1. Limpiar la sesión en Redux/LocalStorage
        dispatch(logout()); 
        // 2. Opcional: Limpiar el carrito también
        dispatch(clearCart());
        
        // 3. Redirigir a la pantalla de Login
        navigate('/login');
    };

    // Estilos CSS estándar
    const styles = {
        nav: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 20px',
            backgroundColor: '#1f2937', // Fondo oscuro
            color: 'white',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            fontFamily: 'Arial, sans-serif',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
        },
        logo: {
            fontSize: '1.5rem',
            fontWeight: '900', // Más grueso
            color: '#10b981', // Verde brillante
            cursor: 'pointer',
            textDecoration: 'none',
        },
        leftSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
        },
        userInfo: {
            fontWeight: '600',
            fontSize: '1rem',
            color: '#d1d5db', // Gris claro
        },
        button: {
            padding: '8px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
            border: 'none',
        },
        loginButton: {
            backgroundColor: '#3b82f6', // Azul
            color: 'white',
        },
        ordersButton: {
            backgroundColor: '#4b5563', // Gris medio
            color: 'white',
        },
        logoutButton: {
            backgroundColor: '#ef4444', // Rojo para logout
            color: 'white',
        },
        cartButton: {
            backgroundColor: '#3b82f6',
            color: "white"
        }
    };

    // Lógica para mostrar la sección izquierda
    const renderUserSection = () => {
        if (isLoggedIn) {
            // Usuario Loggeado: Muestra el email y el botón de Logout
            return (
                <div style={styles.leftSection}>
                    <button onClick={() => navigate('/profile')} style={{...styles.button, ...styles.userInfo}}>
                        <CiUser color='blue'/>
                    </button>
                    
                    {/* Botón Mis Pedidos */}
                    <button 
                        style={{ ...styles.button, ...styles.ordersButton }}
                        onClick={() => navigate('/orders')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#6b7280'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.ordersButton.backgroundColor}
                    >
                        Mis Pedidos
                    </button>

                    <button 
                        style={{ ...styles.button, ...styles.cartButton }}
                        onClick={() => navigate('/checkout')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#3e26dcff'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.cartButton.backgroundColor}
                    >
                        <CiShoppingCart/>
                    </button>

                    {/* Botón Cerrar Sesión */}
                    <button 
                        style={{ ...styles.button, ...styles.logoutButton }}
                        onClick={handleLogout}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.logoutButton.backgroundColor}
                    >
                        <CiLogout/>
                    </button>
                </div>
            );
        } else {
            // Usuario No Loggeado: Muestra solo el botón de Login
            return (
                <div style={styles.leftSection}>
                    <button 
                        style={{ ...styles.button, ...styles.loginButton }}
                        onClick={() => navigate('/login')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.loginButton.backgroundColor}
                    >
                        Iniciar Sesión
                    </button>
                </div>
            );
        }
    };

    return (
        <nav style={styles.nav}>
            {/* Sección Derecha: Nombre de la Plataforma */}
            <span style={styles.logo} onClick={() => navigate('/')}>
                FinalCommerce
            </span>

            {/* Sección Izquierda: Estado del Usuario y Pedidos */}
            {renderUserSection()}
        </nav>
    );
};

export default Navbar;