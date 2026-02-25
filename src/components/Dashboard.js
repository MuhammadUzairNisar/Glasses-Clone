import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardOverview from './DashboardOverview';
import OpticsForm from './OpticsForm';
import CustomerList from './CustomerList';
import Invoice from './Invoice';
import Stock from './Stock';
import CategoryManagement from './CategoryManagement';
import ItemManagement from './ItemManagement';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'form', 'list', 'invoice', 'stock', 'category', or 'item'
  const [savedCustomerId, setSavedCustomerId] = useState(null); // Store saved customer ID for invoice

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-md sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold">Haji Nawab Din Optical Service - Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm sm:text-base">Welcome, {user?.email}</span>
              <button 
                onClick={handleLogout} 
                className="bg-white/20 hover:bg-white/30 border-2 border-white px-4 sm:px-5 py-2 rounded-md text-sm sm:text-base font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-500 shadow-2xl border-r border-purple-400 flex-shrink-0 hidden lg:block animate-slideInLeft">
          <nav className="p-4 space-y-3 h-full">
            <div className="mb-6 pt-4 animate-fadeInUp">
              <h2 className="text-white text-lg font-bold text-center px-2 py-2 bg-white/20 rounded-lg backdrop-blur-sm animate-pulse-slow">
                Navigation Menu
              </h2>
            </div>
            
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:translate-x-2 animate-fadeInUp ${
                activeView === 'overview'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50 border-l-4 border-cyan-300 font-semibold animate-glow'
                  : 'text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm hover:shadow-lg'
              }`}
              style={{ animationDelay: '0.1s' }}
              onClick={() => setActiveView('overview')}
            >
              <span className="text-xl transition-transform duration-300 hover:scale-125 hover:rotate-12">📊</span>
              <span>Dashboard</span>
            </button>
            
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:translate-x-2 animate-fadeInUp ${
                activeView === 'form'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50 border-l-4 border-emerald-300 font-semibold animate-glow'
                  : 'text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm hover:shadow-lg'
              }`}
              style={{ animationDelay: '0.2s' }}
              onClick={() => setActiveView('form')}
            >
              <span className="text-xl transition-transform duration-300 hover:scale-125 hover:rotate-12">➕</span>
              <span>Add Customer</span>
            </button>
            
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:translate-x-2 animate-fadeInUp ${
                activeView === 'list'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/50 border-l-4 border-amber-300 font-semibold animate-glow'
                  : 'text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm hover:shadow-lg'
              }`}
              style={{ animationDelay: '0.3s' }}
              onClick={() => setActiveView('list')}
            >
              <span className="text-xl transition-transform duration-300 hover:scale-125 hover:rotate-12">📋</span>
              <span>View Records</span>
            </button>
            
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:translate-x-2 animate-fadeInUp ${
                activeView === 'invoice'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/50 border-l-4 border-rose-300 font-semibold animate-glow'
                  : 'text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm hover:shadow-lg'
              }`}
              style={{ animationDelay: '0.4s' }}
              onClick={() => setActiveView('invoice')}
            >
              <span className="text-xl transition-transform duration-300 hover:scale-125 hover:rotate-12">🧾</span>
              <span>Invoice</span>
            </button>
            
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:translate-x-2 animate-fadeInUp ${
                activeView === 'stock'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/50 border-l-4 border-cyan-300 font-semibold animate-glow'
                  : 'text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm hover:shadow-lg'
              }`}
              style={{ animationDelay: '0.5s' }}
              onClick={() => setActiveView('stock')}
            >
              <span className="text-xl transition-transform duration-300 hover:scale-125 hover:rotate-12">📦</span>
              <span>Stock</span>
            </button>
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:translate-x-2 animate-fadeInUp ${
                activeView === 'category'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/50 border-l-4 border-purple-300 font-semibold animate-glow'
                  : 'text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm hover:shadow-lg'
              }`}
              style={{ animationDelay: '0.6s' }}
              onClick={() => setActiveView('category')}
            >
              <span className="text-xl transition-transform duration-300 hover:scale-125 hover:rotate-12">🏷️</span>
              <span>Category</span>
            </button>
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:translate-x-2 animate-fadeInUp ${
                activeView === 'item'
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/50 border-l-4 border-blue-300 font-semibold animate-glow'
                  : 'text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm hover:shadow-lg'
              }`}
              style={{ animationDelay: '0.7s' }}
              onClick={() => setActiveView('item')}
            >
              <span className="text-xl transition-transform duration-300 hover:scale-125 hover:rotate-12">📝</span>
              <span>Item</span>
            </button>
          </nav>
        </aside>

        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40 animate-bounce-slow">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-xl shadow-2xl border-2 border-purple-300 p-2 space-y-2 min-w-[160px] backdrop-blur-sm animate-fadeIn">
            <div className="text-white text-xs font-bold text-center px-2 py-1 bg-white/20 rounded-lg mb-1 animate-pulse-slow">
              Menu
            </div>
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-110 ${
                activeView === 'overview'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg animate-glow'
                  : 'text-white/90 hover:bg-white/20'
              }`}
              onClick={() => setActiveView('overview')}
            >
              <span className="transition-transform duration-300 hover:rotate-12">📊</span>
              <span>Dashboard</span>
            </button>
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-110 ${
                activeView === 'form'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg animate-glow'
                  : 'text-white/90 hover:bg-white/20'
              }`}
              onClick={() => setActiveView('form')}
            >
              <span className="transition-transform duration-300 hover:rotate-12">➕</span>
              <span>Create</span>
            </button>
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-110 ${
                activeView === 'list'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg animate-glow'
                  : 'text-white/90 hover:bg-white/20'
              }`}
              onClick={() => setActiveView('list')}
            >
              <span className="transition-transform duration-300 hover:rotate-12">📋</span>
              <span>View</span>
            </button>
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-110 ${
                activeView === 'invoice'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg animate-glow'
                  : 'text-white/90 hover:bg-white/20'
              }`}
              onClick={() => setActiveView('invoice')}
            >
              <span className="transition-transform duration-300 hover:rotate-12">🧾</span>
              <span>Invoice</span>
            </button>
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-110 ${
                activeView === 'stock'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg animate-glow'
                  : 'text-white/90 hover:bg-white/20'
              }`}
              onClick={() => setActiveView('stock')}
            >
              <span className="transition-transform duration-300 hover:rotate-12">📦</span>
              <span>Stock</span>
            </button>
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-110 ${
                activeView === 'category'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg animate-glow'
                  : 'text-white/90 hover:bg-white/20'
              }`}
              onClick={() => setActiveView('category')}
            >
              <span className="transition-transform duration-300 hover:rotate-12">🏷️</span>
              <span>Category</span>
            </button>
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-110 ${
                activeView === 'item'
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg animate-glow'
                  : 'text-white/90 hover:bg-white/20'
              }`}
              onClick={() => setActiveView('item')}
            >
              <span className="transition-transform duration-300 hover:rotate-12">📝</span>
              <span>Item</span>
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {activeView === 'overview' && <DashboardOverview />}
          {activeView === 'form' && <OpticsForm onSaveSuccess={(savedCustomer) => {
            // Navigate to invoice view with the saved customer
            if (savedCustomer && savedCustomer._id) {
              setSavedCustomerId(savedCustomer._id);
            }
            setActiveView('invoice');
          }} />}
          {activeView === 'list' && <CustomerList />}
          {activeView === 'invoice' && <Invoice initialCustomerId={savedCustomerId} />}
          {activeView === 'stock' && <Stock />}
          {activeView === 'category' && <CategoryManagement />}
          {activeView === 'item' && <ItemManagement />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

