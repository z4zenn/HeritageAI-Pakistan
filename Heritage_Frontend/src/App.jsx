import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import SiteDetail from './pages/SiteDetail';
import Recommend from './pages/Recommend';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import MyBookings from './pages/MyBookings';
import Checkout from './pages/Checkout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
      <div className="min-h-screen flex flex-col bg-[#F5F2ED] dark:bg-[#141618] text-[#1A1E21] dark:text-[#EDE9DF] transition-colors duration-300">
         
         {/* Sticky gold themed header */}
         <Navbar />
 
         {/* Dynamic Route Content */}
         <main className="flex-1 flex flex-col">
           <Routes>
             <Route path="/" element={<Home />} />
             <Route path="/explore" element={<Explore />} />
             <Route path="/site/:id" element={<SiteDetail />} />
             <Route path="/recommend" element={<Recommend />} />
             <Route path="/login" element={<Login />} />
             <Route path="/register" element={<Register />} />
             <Route path="/auth/callback" element={<AuthCallback />} />
             <Route path="/dashboard" element={
               <ProtectedRoute>
                 <Dashboard />
               </ProtectedRoute>
             } />
             <Route path="/my-bookings" element={
               <ProtectedRoute>
                 <MyBookings />
               </ProtectedRoute>
             } />
             <Route path="/admin/dashboard" element={
               <ProtectedRoute>
                 <AdminDashboard />
               </ProtectedRoute>
             } />
             <Route path="/checkout/:siteSlug" element={
               <ProtectedRoute>
                 <Checkout />
               </ProtectedRoute>
             } />
             <Route path="/about" element={<About />} />
           </Routes>
         </main>

        {/* Dark brown footer attributions */}
        <Footer />

      </div>
    </Router>
    </AuthProvider>
  );
}
