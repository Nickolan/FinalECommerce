import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // [{ product_id: 1, name: 'Laptop', quantity: 2, price: 999.99 }]
  totalQuantity: 0,
  totalAmount: 0,
};

// Función de utilidad para recalcular el total
const calculateTotals = (items) => {
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    return { totalAmount, totalQuantity };
}

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Acción para añadir o incrementar un producto en el carrito
    addItemToCart: (state, action) => {
      const { product_id, name, price, quantity: quantityToAdd } = action.payload; // Recibe la cantidad
      
      const existingItem = state.items.find(item => item.product_id === product_id);
      
      if (!existingItem) {
        // Si el producto no existe, lo añade al array con la cantidad especificada
        state.items.push({
          product_id,
          name,
          price,
          quantity: quantityToAdd,
        });
      } else {
        // Si ya existe, incrementa la cantidad existente
        existingItem.quantity += quantityToAdd;
      }
      
      // Recalcular totales
      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
    },

    // Acción para remover o decrementar un producto
    // Nota: Esta acción solo quita UNA unidad a la vez, manteniendo la lógica original.
    removeItemFromCart: (state, action) => {
        const id = action.payload.product_id;
        const existingItem = state.items.find(item => item.product_id === id);

        if (existingItem) {
            if (existingItem.quantity === 1) {
                // Si solo queda 1, remueve el item del array
                state.items = state.items.filter(item => item.product_id !== id);
            } else {
                // Decrementa la cantidad
                existingItem.quantity--;
            }
        }
        
        // Recalcular totales
        const totals = calculateTotals(state.items);
        state.totalQuantity = totals.totalQuantity;
        state.totalAmount = totals.totalAmount;
    },

    // Acción para limpiar completamente el carrito
    clearCart: (state) => {
        state.items = [];
        state.totalQuantity = 0;
        state.totalAmount = 0;
    }
  },
});

export const { addItemToCart, removeItemFromCart, clearCart } = cartSlice.actions;

export default cartSlice.reducer;