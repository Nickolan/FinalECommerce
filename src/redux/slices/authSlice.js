import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Inicializamos el estado de la sesión verificando el localStorage (para persistencia)
  client_id: localStorage.getItem('client_id') || null, 
  client_email: null,
  client_name: null,
  isLoggedIn: !!localStorage.getItem('client_id'), // Está loggeado si hay ID en localStorage
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Acción para manejar el inicio de sesión exitoso
    setCredentials: (state, action) => {
      const { id_key, email, name } = action.payload;
      state.client_id = id_key;
      state.client_email = email;
      state.client_name = name;
      state.isLoggedIn = true;
      // Persistencia: Guardar el ID en localStorage (recuerda que este ID es la clave de sesión insegura)
      localStorage.setItem('client_id', id_key); 
    },
    
    // Acción para manejar el cierre de sesión
    logout: (state) => {
      state.client_id = null;
      state.client_email = null;
      state.client_name = null;
      state.isLoggedIn = false;
      // Remover la persistencia
      localStorage.removeItem('client_id');
      // Asegurar que el carrito también se limpia al cerrar sesión
      // NOTA: La limpieza del carrito se manejaría en otro slice si fuera necesario
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;