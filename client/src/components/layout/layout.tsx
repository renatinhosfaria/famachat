import { useState, ReactNode } from "react";
import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";
import MobileNavigation from "./mobile-navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [location] = useLocation();
  
  const pageTitles: Record<string, string> = {
    "/": "",
    "/reports": "",
    "/agenda": "",
    "/leads": "",
  };
  
  const toggleMobileSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      <div className={`hidden md:flex flex-col relative transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar className="flex-1" collapsed={sidebarCollapsed} />
        
        {/* Toggle button */}
        <button 
          onClick={toggleSidebarCollapse}
          className="absolute right-0 top-20 transform translate-x-1/2 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:bg-gray-50 focus:outline-none"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      
      {/* Mobile sidebar */}
      <div
        className={`sidebar md:hidden fixed z-40 inset-y-0 left-0 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar collapsed={false} />
      </div>
      
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={pageTitles[location] || ""} 
          onToggleSidebar={toggleMobileSidebar} 
          sidebarCollapsed={sidebarCollapsed}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background-light p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {children}
        </main>
        
        {/* Mobile navigation */}
        <MobileNavigation />
      </div>
    </div>
  );
}
