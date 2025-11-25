import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // [{ product_id: 1, name: 'Laptop', quantity: 2, price: 999.99 }]
  totalQuantity: 0,
  totalAmount: 0,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Acción para añadir o incrementar un producto en el carrito
    addItemToCart: (state, action) => {
      const newItem = action.payload; // Debe contener id, name, price, quantity
      const existingItem = state.items.find(item => item.product_id === newItem.product_id);
      
      state.totalQuantity++;

      if (!existingItem) {
        // Si el producto no existe, lo añade al array
        state.items.push({
          product_id: newItem.product_id,
          name: newItem.name,
          price: newItem.price,
          quantity: 1,
        });
      } else {
        // Si ya existe, solo incrementa la cantidad
        existingItem.quantity++;
      }
      state.totalAmount = state.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    },

    // Acción para remover o decrementar un producto
    removeItemFromCart: (state, action) => {
        const id = action.payload.product_id;
        const existingItem = state.items.find(item => item.product_id === id);

        if (existingItem) {
            state.totalQuantity--;
            state.totalAmount -= existingItem.price;

            if (existingItem.quantity === 1) {
                // Si solo queda 1, remueve el item del array
                state.items = state.items.filter(item => item.product_id !== id);
            } else {
                // Decrementa la cantidad
                existingItem.quantity--;
            }
        }
    },

    // Acción para limpiar completamente el carrito (útil al finalizar la compra o cerrar sesión)
    clearCart: (state) => {
        state.items = [];
        state.totalQuantity = 0;
        state.totalAmount = 0;
    }
  },
});

export const { addItemToCart, removeItemFromCart, clearCart } = cartSlice.actions;

export default cartSlice.reducer;