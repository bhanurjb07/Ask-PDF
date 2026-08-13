import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar.jsx';
import ToastViewport from '../common/Toast.jsx';
import { useAppContext } from '../../context/AppContext.jsx';

export default function AppLayout() {
  const { darkMode } = useAppContext();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
      <ToastViewport />
    </div>
  );
}
