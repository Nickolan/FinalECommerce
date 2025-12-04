import React from 'react';
// Importación de librerías externas de Redux
import { useSelector, useDispatch } from 'react-redux';
// Rutas corregidas asumiendo que Navbar está dentro de 'src/components'
import { logout } from '../../redux/slices/authSlice';
import { clearCart } from '../../redux/slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import { CiLogout, CiShoppingCart, CiUser } from "react-icons/ci";
import HorizontalLogo from '../../assets/logo2.png'

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
    // Estilos CSS estándar (ACTUALIZADOS PARA FONDO ROJO PRIMARIO)
    const styles = {
        nav: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 20px',
            backgroundColor: '#ff5722', // **Fondo: Rojo Primario**

            color: 'white', // Texto principal blanco
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
            fontFamily: 'Arial, sans-serif',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
        },
        logoArea: { // Nuevo contenedor para manejar el click y la imagen
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
        },
        logoImage: {
            // Ajustar el tamaño de la imagen para que sea visible en la barra
            height: '50px',
            width: 'auto',
            //filter: 'brightness(0) invert(1)', // Opcional: Si el logo es oscuro, lo invertimos a blanco
            marginRight: '5px'
        },
        logoText: {

            fontSize: '1.8rem', // Tamaño del logo más grande
            fontWeight: '900',
            color: 'white', // **Logo: Blanco (para contrastar con el fondo rojo)**
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
            color: 'white',
        },
        button: {

            padding: '8px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
            border: 'none',
            color: '#1e1e1e', // Texto oscuro en botones (para contraste)
        },
        loginButton: {

            backgroundColor: 'white', // **Botón Login: Blanco**
            color: '#1e1e1e',
        },
        ordersButton: {
            backgroundColor: '#1e1e1e', // **Botón Órdenes: Fondo oscuro**
            color: 'white',
        },
        logoutButton: {
            backgroundColor: '#dc2626', // Rojo de peligro

            color: 'white',
        },
        cartButton: {
            backgroundColor: '#1e1e1e', // **Botón Carrito: Fondo oscuro**
            color: 'white',
        },
        iconButton: {
            backgroundColor: 'transparent',
            padding: '8px',
            color: 'white', // Icono de usuario blanco
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: "transparent"
        },
        iconButtonHover: {
            backgroundColor: '#e64a19', // Rojo oscuro en hover
            borderColor: 'white',
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
                        style={{ ...styles.button, ...styles.iconButton, color: 'white' }} // Icono en blanco
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = styles.iconButtonHover.backgroundColor;
                            e.target.style.borderColor = styles.iconButtonHover.borderColor;
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = styles.iconButton.backgroundColor;
                            e.target.style.borderColor = 'transparent';
                        }}
                    >
                        <CiUser size={20} color='white' />
                    </button>

                    {/* Botón Mis Pedidos */}

                    <button
                        style={{ ...styles.button, ...styles.ordersButton }}
                        onClick={() => navigate('/orders')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#424242'}

                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.ordersButton.backgroundColor}
                    >
                        Mis Pedidos
                    </button>


                    {/* Botón Carrito */}
                    <button
                        style={{ ...styles.button, ...styles.cartButton }}
                        onClick={() => navigate('/checkout')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#424242'}

                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.cartButton.backgroundColor}
                    >
                        <CiShoppingCart size={20} />
                    </button>


                    {/* Botón Cerrar Sesión */}
                    <button
                        style={{ ...styles.button, ...styles.logoutButton }}
                        onClick={handleLogout}

                        onMouseEnter={(e) => e.target.style.backgroundColor = '#ef4444'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = styles.logoutButton.backgroundColor}
                    >
                        <CiLogout size={20} />
                    </button>

                </div>
            );
        } else {
            // Usuario No Loggeado: Muestra solo el botón de Login
            return (
                <div style={styles.leftSection}>
                    <button
                        style={{
                            ...styles.button,
                            ...styles.loginButton
                        }}
                        onClick={() => navigate('/login')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e0e0e0'}
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
            {/* Sección Derecha: Logo e Imagen */}
            <div style={styles.logoArea} onClick={() => navigate('/')}>
                {/* 1. Imagen del Logo */}
                <img src={HorizontalLogo} alt="Logo Mercado Fake" style={styles.logoImage} />

                {/* 2. Texto del Logo */}
                <span style={styles.logoText}>
                    Mercado Fake
                </span>
            </div>

            {/* Sección Izquierda: Estado del Usuario y Pedidos */}

            {renderUserSection()}
        </nav>
    );
};

export default Navbar;