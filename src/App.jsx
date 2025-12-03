import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
//import './App.css'
import { Route, Routes } from 'react-router-dom'
import SignupScreen from './screens/Signup/SignupScreen'
import LoginScreen from './screens/Login/LoginScreen'
import Navbar from './components/Navbar/Navbar'
import HomeScreen from './screens/Home/HomeScreen'
import ProductDetailsScreen from './screens/ProductDetails/ProductDetailsScreen'
import CheckoutScreen from './screens/Checkout/CheckoutScreen'
import MyOrdersScreen from './screens/MyOrders/MyOrdersScreen'
import ProfileScreen from './screens/Profile/ProfileScreen'
import UpdateProfileScreen from './screens/ProfileUpdate/UpdateProfileScreen'

// --- Nuevas Importaciones para el Panel Admin ---
import AdminLayout from './screens/AdminDashboard/AdminLayout'
import DashboardScreen from './screens/AdminDashboard/DashboardScreen'
import ClientsListScreen from './screens/AdminDashboard/ListsScreens/ClientsListScreen'
import ClientDetailsScreen from './screens/AdminDashboard/DetailsScreens/ClientDetailsScreen'
import OrdersListScreen from './screens/AdminDashboard/ListsScreens/OrdersListScreen'
import OrderDetailsScreen from './screens/AdminDashboard/DetailsScreens/OrderDetailsScreen'
import CategoriesListScreen from './screens/AdminDashboard/ListsScreens/CategoriesListScreen'
import CategoryFormScreen from './screens/AdminDashboard/FormsScreens/CategoryFormScreen'
import ProductsListScreen from './screens/AdminDashboard/ListsScreens/ProductsListScreen'
import ProductFormScreen from './screens/AdminDashboard/FormsScreens/ProductFormScreen'
import BillsListScreen from './screens/AdminDashboard/ListsScreens/BillsListScreen'
import BillDetailsScreen from './screens/AdminDashboard/DetailsScreens/BillDetailsScreen'
import OrderDetailsClientScreen from './screens/OrderDetails/OrderDetailsClientScreen'
import ReviewFormScreen from './screens/ReviewFormScreen/ReviewFormScreen'
import SystemHealthScreen from './screens/AdminDashboard/SystemHealthScreen'


function App() {

  return (
    <div>
      <Routes>
        {/* Rutas Públicas/Clientes */}
        <Route path="/" element={<> <Navbar/> <HomeScreen/> </>}  />
        <Route path="/signup" element={<> <SignupScreen/> </>}  />
        <Route path="/login" element={<> <LoginScreen/> </>}  />
        <Route path="/products/:productId" element={<> <Navbar/> <ProductDetailsScreen/> </>}  />
        <Route path="/checkout" element={<> <Navbar/> <CheckoutScreen/> </>}  />
        <Route path="/orders" element={<> <Navbar/> <MyOrdersScreen/> </>}  />
        <Route path="/orders/:orderId" element={<> <Navbar/> <OrderDetailsClientScreen/> </>}  />
        <Route path="/orders/:orderId/review" element={<> <Navbar/> <ReviewFormScreen/> </>}  />
        <Route path="/profile" element={<> <Navbar/> <ProfileScreen/> </>}  />
        <Route path="/profile/update" element={<> <Navbar/> <UpdateProfileScreen/> </>}  />
        
        {/* Rutas de Administración */}
        <Route path="/admin" element={<AdminLayout/>}>
            <Route index element={<DashboardScreen />} />
            <Route path="clients" element={<ClientsListScreen />} />
            <Route path="clients/:clientId" element={<ClientDetailsScreen />}/>
            <Route path="orders" element={<OrdersListScreen />} />
            <Route path="orders/:orderId" element={<OrderDetailsScreen />}/>
            <Route path="categories" element={<CategoriesListScreen />} />
            <Route path="categories/new" element={<CategoryFormScreen />} />
            <Route path="categories/edit/:categoryId" element={<CategoryFormScreen />} />
            <Route path="products" element={<ProductsListScreen />} />
            <Route path="products/new" element={<ProductFormScreen />} />
            <Route path="products/edit/:productId" element={<ProductFormScreen />} />
            <Route path="bills" element={<BillsListScreen />} />
            <Route path="bills/:billId" element={<BillDetailsScreen />}/>
            <Route path="health" element={<SystemHealthScreen />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App