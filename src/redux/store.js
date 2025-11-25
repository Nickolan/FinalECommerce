import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import catalogReducer from './slices/catalogSlice';

// Configura el store de Redux. Aquí se combinan todos los 'slices' (reducers).
export const store = configureStore({
  reducer: {
    // Estado para manejar la sesión del usuario (ID, email, isLogged)
    auth: authReducer,
    
    // Estado para manejar los productos en el carrito
    cart: cartReducer,

    catalog: catalogReducer
    
    // Puedes agregar más estados globales aquí (ej: catalog, ui)
  },
  // Opciones de configuración adicionales (ej: middleware)
});

// Tipos para facilitar el uso de selectores y dispatch en React
// (Esto es especialmente útil si usas TypeScript, pero es buena práctica en JS también)
export const RootState = store.getState;
export const AppDispatch = store.dispatch;