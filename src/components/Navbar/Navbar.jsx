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
// Estilos CSS estándar (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE)
    const styles = {
        nav: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 20px',
            backgroundColor: '#1e1e1e', // Fondo oscuro de la Navbar
            
            color: '#e0e0e0',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
            fontFamily: 'Arial, sans-serif',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
        },
        logo: {
          
            fontSize: '1.8rem', // Tamaño del logo más grande
            fontWeight: '900',
            color: '#ff5722', // Rojo Primario (Mercado Fake)
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
            color: '#e0e0e0', // Texto claro
        },
        button: {
       
            padding: '8px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
            border: 'none',
            color: 'white', // Texto blanco por defecto en los botones
        },
        loginButton: {
          
            backgroundColor: '#ff5722', // Rojo Primario
            color: 'white',
        },
        ordersButton: {
            backgroundColor: '#424242', // Gris oscuro para botones secundarios
            color: 'white',
        },
        logoutButton: {
            backgroundColor: '#ef4444', // Rojo estándar para acciones peligrosas
  
            color: 'white',
        },
        cartButton: {
            backgroundColor: '#ff5722', // Rojo Primario para el carrito
            color: "white"
        },
        iconButton: {
            backgroundColor: 'transparent',
            padding: '8px',
            border: '1px solid transparent',
            color: '#ff5722', // Icono de usuario en Rojo Primario
        },
        iconButtonHover: {
            backgroundColor: '#333333',
            borderColor: '#ff5722',
        }
    };
// Lógica para mostrar la sección izquierda
    const renderUserSection = () => {
        if (isLoggedIn) {
            // Usuario Loggeado: Muestra el email y el botón de Logout
            return (
                <div style={styles.leftSection}>
                    {/* Botón Perfil (solo icono) */}
                    <button 
                        onClick={() => navigate('/profile')} 
                        style={{...styles.button, ...styles.iconButton, color: '#e0e0e0'}} // Mantener blanco para el icono de perfil
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = styles.iconButtonHover.backgroundColor;
                            e.target.style.borderColor = styles.iconButtonHover.borderColor;
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = styles.iconButton.backgroundColor;
                            e.target.style.borderColor = 'transparent';
                        }}
                    >
                        <CiUser size={20} color='#e0e0e0'/>
                    </button>
                    
                    {/* Botón Mis Pedidos */}
         
                    <button 
                        style={{ ...styles.button, ...styles.ordersButton }}
                        onClick={() => navigate('/orders')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#616161'} // Gris más claro en hover
       
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.ordersButton.backgroundColor}
                    >
                        Mis Pedidos
                    </button>

              
                    {/* Botón Carrito */}
                    <button 
                        style={{ ...styles.button, ...styles.cartButton }}
                        onClick={() => navigate('/checkout')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e64a19'} // Rojo oscuro en hover
            
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.cartButton.backgroundColor}
                    >
                        <CiShoppingCart size={20}/>
                    </button>

                    
{/* Botón Cerrar Sesión */}
                    <button 
                        style={{ ...styles.button, ...styles.logoutButton }}
                        onClick={handleLogout}
                        
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.logoutButton.backgroundColor}
                    >
                        <CiLogout size={20}/>
                    </button>
    
                </div>
            );
        } else {
            // Usuario No Loggeado: Muestra solo el botón de Login
            return (
                <div style={styles.leftSection}>
                    <button 
                        style={{ ...styles.button, 
                            ...styles.loginButton }}
                        onClick={() => navigate('/login')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e64a19'} // Rojo oscuro en hover
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
                Mercado Fake
            </span>

            {/* Sección Izquierda: Estado del Usuario y Pedidos */}
  
            {renderUserSection()}
        </nav>
    );
};

export default Navbar;