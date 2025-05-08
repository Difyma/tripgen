import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 relative">
        <Outlet />
      </main>
    </div>
  );
} 