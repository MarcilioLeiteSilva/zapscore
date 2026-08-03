import React from 'react';
import Sidebar2 from './components/Sidebar2';
import Navbar2 from './components/Navbar2';

export default function AdminLayout2({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#020205] min-h-screen text-slate-100 flex font-sans antialiased">
      {/* Sidebar Retrátil */}
      <Sidebar2 />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar2 />
        <main className="flex-1 w-[92%] mx-auto py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
