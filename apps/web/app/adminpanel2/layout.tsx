import React from 'react';
import Sidebar2 from './components/Sidebar2';
import Navbar2 from './components/Navbar2';

export default function AdminLayout2({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#0b0f19] min-h-screen text-gray-100 flex font-sans antialiased">
      {/* Sidebar Retrátil */}
      <Sidebar2 />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar2 />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
