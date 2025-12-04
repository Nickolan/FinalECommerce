// --- INICIO DEL ARCHIVO: src\screens\AdminDashboard\ListsScreens\CategoriesListScreen.jsx ---

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CiSearch, CiSquarePlus, CiEdit, CiTrash, CiShoppingCart } from "react-icons/ci";
const CategoriesListScreen = () => {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const CATEGORY_LIMIT = 100;
    // Límite de categorías a cargar

    // =========================================================================
    // I. CARGA DE DATOS
    // =========================================================================

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Llama al endpoint de listado de categorías

            const url = `/categories?skip=0&limit=${CATEGORY_LIMIT}`;
            const response = await axios.get(url);

            // Ordenar por ID para consistencia
            const sortedCategories = response.data.sort((a, b) => a.id_key - b.id_key);
            setCategories(sortedCategories);


        } catch (err) {
            console.error("Error fetching categories:", err);
            setError("Error al cargar la lista de categorías. Verifique la conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);
    // =========================================================================
    // II. LÓGICA DE FILTRADO (Lado del Cliente)
    // =========================================================================

    // Filtrado local por ID o nombre
    const filteredCategories = categories.filter(category => {
        const term = searchTerm.toLowerCase();
        return (
            category.name?.toLowerCase().includes(term) ||
            String(category.id_key).includes(term)
        );
    });
    // =========================================================================
    // III. HANDLERS DE ACCIONES CRUD
    // =========================================================================

    // Redirige al formulario de creación
    const handleCreate = () => {
        navigate('/admin/categories/new');
    };

    // Redirige al formulario de edición
    const handleEdit = (categoryId, e) => {
        e.stopPropagation();
        // Previene la acción de la fila (si existiera)
        navigate(`/admin/categories/edit/${categoryId}`);
    };
    // Elimina una categoría
    const handleDelete = async (categoryId, e) => {
        e.stopPropagation();
        // Previene la acción de la fila
        
        // Validar que no tenga productos

        try {
            const {data} = await axios.get(`/categories/${categoryId}`)
            console.log(data);
            
            if (data.products.length > 0) {
                alert('Esta categoria no puede ser eliminada ya que tiene productos asociados')
                return;
            }

        } catch (error) {
            
        }

        const confirmation = window.confirm(`¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE la Categoría ID ${categoryId}?.`);
        if (confirmation) {
            try {
                // DELETE /categories/{id}
                await axios.delete(`/categories/${categoryId}`);
                alert(`✅ Categoría ID ${categoryId} eliminada con éxito.`);
                fetchCategories(); // Recargar la lista
            } catch (err) {
                console.error("Error al eliminar categoría:", err);
                let message = "Error al eliminar la categoría.";

                // MITIGACIÓN: Usar el error de la API como indicador de productos asociados
                if (err.response?.status === 400 && err.response.data?.detail?.includes('ForeignKey violation')) {
                    message = "ERROR: No se puede eliminar la categoría porque hay productos asociados. Elimine los productos primero.";
                }

                alert(message);
                setError(message);
            }
        }
    };
    // Estilos CSS estándar (ACTUALIZADOS PARA DARK MODE / MERCADO FAKE)
    const styles = {
        container: { padding: '0 10px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
        header: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px', color: '#ff5722' },
        controls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
        searchContainer: {

            alignItems: 'center',
            padding: '10px',
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#424242',
            flexGrow: 1,
            marginRight: '15px'

        },

        searchInput: {
            flexGrow: 1,
            padding: '5px 10px',
            border: 'none',
            fontSize: '1rem',
            background: 'transparent',

            color: '#e0e0e0'
        },
        createButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '10px 15px',
            backgroundColor: '#ff5722', // Rojo Primario

            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
        },
        tableContainer: {
            overflowX: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)', borderRadius: '8px'
        },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#1e1e1e' },
        th: {
            padding: '12px 15px',
            textAlign: 'left',
            backgroundColor: '#2e2e2e',
            borderBottom: '2px solid #424242',

            color: '#bdbdbd',
            fontSize: '0.9rem',
            textTransform: 'uppercase'
        },
        td: {
            padding: '12px 15px',
            borderBottom: '1px solid #424242',
            fontSize: '1rem',

            color: '#e0e0e0'
        },
        tdActions: { width: '100px', textAlign: 'center' },
        actionButton: (color) => ({
            backgroundColor: color,
            color: 'white',
            border: 'none',


            padding: '8px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginLeft: '5px',
            transition: 'opacity 0.15s'
        }),
        loadingText: { textAlign: 'center', color: '#ff5722', fontSize: '1.2rem', margin: '40px 0' },
        errorText: {
            textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin:
                '40px 0'
        },
    };

    // Funciones para hover/focus
    const handleButtonHover = (e, hover, baseColor, hoverColor) => {
        e.currentTarget.style.backgroundColor = hover ?
            hoverColor : baseColor;
    };
    const handleInputFocus = (e) => { e.target.style.borderColor = '#ff5722'; };
    const handleInputBlur = (e) => { e.target.style.borderColor = '#424242'; };
    if (loading) {
        return <div style={styles.container}><p style={styles.loadingText}>Cargando lista de categorías...</p></div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Gestión de Categorías ({categories.length} Total)</h1>

            {error && <p style={styles.errorText}>Error: {error}</p>}

            {/* Controles de Búsqueda y Creación */}
            <div style={styles.controls}>


                <div style={styles.searchContainer}>
                    <CiSearch size={20} style={{ color: '#bdbdbd' }} />
                    <input
                        type="text"

                        placeholder="Buscar por ID o Nombre de Categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}

                        style={styles.searchInput}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}


                    />
                </div>
                <button
                    onClick={handleCreate}
                    style={styles.createButton}
                    onMouseEnter={(e) => handleButtonHover(e, true, styles.createButton.backgroundColor,
                        '#e64a19')}

                    onMouseLeave={(e) => handleButtonHover(e, false, styles.createButton.backgroundColor, '#e64a19')}
                >
                    <CiSquarePlus size={20} />
                    Crear Nueva

                </button>

            </div>

            {/* Tabla de Categorías */}
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>


                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}><CiShoppingCart size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Nombre</th>

                            <th style={{ ...styles.th, ...styles.tdActions }}>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredCategories.length > 0 ?
                            (
                                filteredCategories.map((category) => (
                                    <tr
                                        key={category.id_key}

                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.searchContainer.backgroundColor}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.table.backgroundColor}

                                    >
                                        <td
                                            style={{ ...styles.td, color: '#ff5722', fontWeight: 'bold' }}

                                        >
                                            {category.id_key}

                                        </td>
                                        <td style={styles.td}>{category.name}</td>
                                        <td style={styles.tdActions}>

                                            {/* Botón Editar (Azul) */}
                                            <button

                                                onClick={(e) => handleEdit(category.id_key, e)}

                                                style={styles.actionButton('#3b82f6')}
                                                title="Editar Categoría"


                                                onMouseEnter={(e) => e.target.style.opacity = 0.8}
                                                onMouseLeave={(e) => e.target.style.opacity = 1}


                                            >
                                                <CiEdit size={18} />


                                            </button>


                                            {/* Botón Eliminar (Rojo Peligro) */}

                                            <button

                                                onClick={(e) => handleDelete(category.id_key, e)}

                                                style={styles.actionButton('#ef4444')}

                                                title="Eliminar Categoría"

                                                onMouseEnter={(e) => e.target.style.opacity = 0.8}

                                                onMouseLeave={(e) => e.target.style.opacity = 1}


                                            >
                                                <CiTrash size={18} />
                                            </button>


                                        </td>
                                    </tr>
                                ))


                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ ...styles.td, textAlign: 'center', color: '#bdbdbd' }}>

                                        No se encontraron categorías.
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>


            </div>

            {categories.length > CATEGORY_LIMIT && (
                <p style={{ marginTop: '20px', color: '#ff5722', fontWeight: 'bold' }}>
                    Solo se muestran las primeras {CATEGORY_LIMIT} categorías (Límite de la API).
                </p>

            )}

        </div>
    );
};

export default CategoriesListScreen;

// --- FIN DEL ARCHIVO: src\screens\AdminDashboard\ListsScreens\CategoriesListScreen.jsx ---