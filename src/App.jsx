import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
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

function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<> <Navbar/> <HomeScreen/> </>}  />
        <Route path="/signup" element={<> <SignupScreen/> </>}  />
        <Route path="/login" element={<> <LoginScreen/> </>}  />
        <Route path="/products/:productId" element={<> <Navbar/> <ProductDetailsScreen/> </>}  />
        <Route path="/checkout" element={<> <Navbar/> <CheckoutScreen/> </>}  />
        <Route path="/orders" element={<> <Navbar/> <MyOrdersScreen/> </>}  />
        <Route path="/profile" element={<> <Navbar/> <ProfileScreen/> </>}  />
        <Route path="/profile/update" element={<> <Navbar/> <UpdateProfileScreen/> </>}  />
      </Routes>
    </div>
  )
}

export default App
