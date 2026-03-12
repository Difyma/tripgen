import { Outlet } from 'react-router-dom';
import { CreatorDashboardSidebar } from './CreatorDashboardSidebar';
import { cn } from '@/lib/utils';

interface CreatorDashboardLayoutProps {
  className?: string;
}

export function CreatorDashboardLayout({ className }: CreatorDashboardLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <CreatorDashboardSidebar />
      <main className="lg:ml-[260px] transition-all duration-300">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
