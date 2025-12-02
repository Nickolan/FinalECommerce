import React, { useMemo } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { 
    IoSpeedometerOutline, IoCubeOutline, IoReceiptOutline, 
    IoPeopleOutline, IoChatbubblesOutline, IoLogOutOutline, IoSettingsOutline 
} from "react-icons/io5";
import { RiBillLine } from "react-icons/ri";
import { BiCategory } from "react-icons/bi";

// =========================================================================
// I. CONFIGURACIÓN Y LINKS
// =========================================================================

const adminNavLinks = [
    { name: 'Dashboard', path: '/admin', icon: IoSpeedometerOutline },
    { name: 'Clientes', path: '/admin/clients', icon: IoPeopleOutline },
    { name: 'Categorias', path: '/admin/categories', icon: BiCategory },
    { name: 'Productos', path: '/admin/products', icon: IoCubeOutline },
    { name: 'Facturas', path: '/admin/bills', icon: RiBillLine },
    { name: 'Órdenes', path: '/admin/orders', icon: IoReceiptOutline },
];

const AdminLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    // Handler para cerrar sesión
    const handleLogout = () => {
        if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            dispatch(logout());
            navigate('/login'); // Redirigir a la pantalla de login
        }
    };
    
    // Ancho de la barra lateral
    const SIDEBAR_WIDTH = '250px';
    
    // =========================================================================
    // III. ESTILOS (Mercado Fake Admin Style) - CORRECCIÓN DE LAYOUT
    // =========================================================================
    
    const styles = useMemo(() => ({
        // Layout Principal
        container: { display: 'flex', minHeight: '100vh', backgroundColor: '#121212', color: '#e0e0e0', fontFamily: 'Arial, sans-serif' },
        
        // Sidebar Fijo
        sidebar: { 
            backgroundColor: '#1e1e1e', // Fondo de la barra lateral
            padding: '20px', 
            boxShadow: '4px 0 10px rgba(0, 0, 0, 0.5)', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'fixed', // Mantiene la barra fija
            top: 0,
            bottom: 0,
            overflowY: 'auto',
            zIndex: 100 // Asegura que esté por encima del contenido
        },
        logo: { 
            fontSize: '1.8rem', 
            fontWeight: 'bold', 
            color: '#ff5722', 
            marginBottom: '30px', 
            textAlign: 'center',
            borderBottom: '2px solid #424242',
            paddingBottom: '15px'
        },
        navGroup: { flexGrow: 1 },
        
        // Estilos de NavLink
        navItem: {
            display: 'flex', 
            alignItems: 'center', 
            padding: '12px 15px', 
            borderRadius: '6px', 
            marginBottom: '10px',
            textDecoration: 'none', 
            color: '#bdbdbd', 
            transition: 'all 0.2s',
            fontWeight: '600'
        },
        navItemActive: {
            backgroundColor: '#ff5722', 
            color: '#ffffff', 
            fontWeight: '700',
            boxShadow: '0 2px 5px rgba(255, 87, 34, 0.4)'
        },
        navItemHover: { 
            backgroundColor: '#2e2e2e', 
            color: '#ff5722' 
        },
        iconStyle: { marginRight: '10px', fontSize: '1.2rem' },
        
        // Botón de Logout
        logoutButton: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '20px',
            padding: '12px 15px',
            backgroundColor: '#424242', 
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'background-color 0.2s',
        },
        logoutButtonHover: {
            backgroundColor: '#dc2626', 
        },
        
        // Contenido Principal (CORRECCIÓN APLICADA AQUÍ)
        mainContent: { 
            flexGrow: 1, 
            padding: '30px',
            // Añade un margen a la izquierda para empujar el contenido más allá del sidebar fijo
            marginLeft: SIDEBAR_WIDTH, 
            width: `calc(100% - ${SIDEBAR_WIDTH})`, // Opcional, asegura el ancho
            boxSizing: 'border-box', // Asegura que el padding no desborde el width
        },
        mainHeader: { 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#ff5722', 
            marginBottom: '30px', 
            borderBottom: '2px solid #424242', 
            paddingBottom: '10px' 
        },
    }), []);

    // Función para combinar estilos de NavLink
    const getNavLinkStyle = ({ isActive }) => {
        const baseStyle = styles.navItem;
        const activeStyle = isActive ? styles.navItemActive : {};
        
        return {
            ...baseStyle,
            ...activeStyle,
            // Agregar un handler onMouseEnter/onMouseLeave para simular el :hover
            onMouseEnter: (e) => {
                if (!isActive) {
                    Object.assign(e.currentTarget.style, styles.navItemHover);
                }
            },
            onMouseLeave: (e) => {
                 if (!isActive) {
                    Object.assign(e.currentTarget.style, styles.navItem);
                }
            }
        };
    };

    // Determinar el título de la página actual
    const currentPageTitle = useMemo(() => {
        const activeLink = adminNavLinks.find(link => location.pathname === link.path);
        return activeLink ? activeLink.name : 'Panel de Administración';
    }, [location.pathname]);

    return (
        <div style={styles.container}>
            {/* Sidebar Fijo */}
            <nav style={styles.sidebar}>
                <div style={styles.logo}>
                    MERCADO FAKE <br/><span style={{fontSize: '0.8rem', color: '#bdbdbd'}}>ADMIN</span>
                </div>
                
                <div style={styles.navGroup}>
                    {adminNavLinks.map(({ name, path, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            style={getNavLinkStyle}
                            end={path === '/admin'} 
                        >
                            <Icon style={styles.iconStyle} />
                            {name}
                        </NavLink>
                    ))}
                </div>

                {/* Botón de Logout */}
                <button 
                    onClick={handleLogout} 
                    style={styles.logoutButton}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.logoutButton, styles.logoutButtonHover)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.logoutButton)}
                >
                    <IoLogOutOutline style={styles.iconStyle} />
                    Cerrar Sesión
                </button>
            </nav>

            {/* Contenido Principal */}
            <main style={styles.mainContent}>
                 <h1 style={styles.mainHeader}>{currentPageTitle}</h1>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;