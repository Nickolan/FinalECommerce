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
    
    const CATEGORY_LIMIT = 100; // Límite de categorías a cargar

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
        e.stopPropagation(); // Previene la acción de la fila (si existiera)
        navigate(`/admin/categories/edit/${categoryId}`);
    };
    
    // Elimina una categoría
    const handleDelete = async (categoryId, e) => {
        e.stopPropagation(); // Previene la acción de la fila
        
        const confirmation = window.confirm(`¿Estás seguro de que quieres eliminar la Categoría ID ${categoryId}? Esta acción es irreversible y podría afectar a los productos asociados.`);
        
        if (confirmation) {
            try {
                // DELETE /categories/{id}
                await axios.delete(`/categories/${categoryId}`);
                alert(`Categoría ID ${categoryId} eliminada con éxito.`);
                fetchCategories(); // Recargar la lista
            } catch (err) {
                console.error("Error al eliminar categoría:", err);
                let message = "Error al eliminar la categoría.";
                if (err.response?.status === 400 && err.response.data?.detail?.includes('ForeignKey violation')) {
                    message = "ERROR: No se puede eliminar la categoría porque hay productos asociados. Elimine los productos primero.";
                }
                alert(message);
                setError(message);
            }
        }
    };


    // Estilos CSS estándar
    const styles = {
        container: { padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
        header: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px', color: '#1f2937' },
        controls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
        searchContainer: { display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', flexGrow: 1, marginRight: '15px' },
        searchInput: { flexGrow: 1, padding: '5px 10px', border: 'none', fontSize: '1rem', background: 'transparent' },
        createButton: { display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
        tableContainer: { overflowX: 'auto', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', borderRadius: '8px' },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' },
        th: { padding: '12px 15px', textAlign: 'left', backgroundColor: '#e5e7eb', borderBottom: '2px solid #d1d5db', color: '#374151', fontSize: '0.9rem', textTransform: 'uppercase' },
        td: { padding: '12px 15px', borderBottom: '1px solid #f3f4f6', fontSize: '1rem', color: '#4b5563' },
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
        loadingText: { textAlign: 'center', color: '#3b82f6', fontSize: '1.2rem', margin: '40px 0' },
        errorText: { textAlign: 'center', color: '#ef4444', fontSize: '1.2rem', margin: '40px 0' },
    };

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
                    <CiSearch size={20} style={{ color: '#6b7280' }} />
                    <input
                        type="text"
                        placeholder="Buscar por ID o Nombre de Categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                <button 
                    onClick={handleCreate} 
                    style={styles.createButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.createButton.backgroundColor}
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
                            <th style={styles.th}><CiShoppingCart size={18} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Nombre</th>
                            <th style={{...styles.th, ...styles.tdActions}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                                <tr key={category.id_key}>
                                    <td style={styles.td}>{category.id_key}</td>
                                    <td style={styles.td}>{category.name}</td>
                                    <td style={styles.tdActions}>
                                        {/* Botón Editar */}
                                        <button
                                            onClick={(e) => handleEdit(category.id_key, e)}
                                            style={styles.actionButton('#3b82f6')}
                                            title="Editar Categoría"
                                            onMouseEnter={(e) => e.target.style.opacity = 0.8}
                                            onMouseLeave={(e) => e.target.style.opacity = 1}
                                        >
                                            <CiEdit size={18} />
                                        </button>
                                        
                                        {/* Botón Eliminar */}
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
                                <td colSpan="3" style={{ ...styles.td, textAlign: 'center' }}>
                                    No se encontraron categorías.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {categories.length > CATEGORY_LIMIT && (
                <p style={{ marginTop: '20px', color: '#ef4444', fontWeight: 'bold' }}>
                    Solo se muestran las primeras {CATEGORY_LIMIT} categorías (Límite de la API).
                </p>
            )}
        </div>
    );
};

export default CategoriesListScreen;