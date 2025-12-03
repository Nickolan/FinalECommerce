import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [], // Lista de productos actual
  categories: [], // Lista de categorías para el Select
  
  // Estado de filtros y paginación
  currentPage: 1,
  productsPerPage: 20, // Límite de la API
  totalProducts: 0, 
  
  // Filtros de la UI
  currentSearchTerm: '',
  selectedCategoryId: '', // Para el filtro Select
};

export const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    // 1. Guarda los productos y el total de la API
    setProducts: (state, action) => {
      state.products = action.payload.products;
      state.totalProducts = action.payload.total; // Necesitamos este total para el paginado
      state.currentPage = action.payload.currentPage;
    },
    
    // 2. Guarda las categorías disponibles para el Select
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    
    // 3. Maneja el cambio de página
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    
    // 4. Maneja el cambio de categoría seleccionada (Select)
    setSelectedCategory: (state, action) => {
      state.selectedCategoryId = action.payload;
      state.currentPage = 1; // Resetear la página al cambiar el filtro
    },

    // 5. Maneja el cambio de texto en la Search Bar (filtro local)
    setSearchTerm: (state, action) => {
      state.currentSearchTerm = action.payload;
      state.currentPage = 1; // Resetear la página al buscar
    }
  },
});

export const { 
  setProducts, 
  setCategories, 
  setCurrentPage, 
  setSelectedCategory, 
  setSearchTerm 
} = catalogSlice.actions;

export default catalogSlice.reducer;