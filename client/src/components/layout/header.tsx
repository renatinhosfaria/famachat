import { useState } from "react";
import { Bell, Menu, AlignJustify } from "lucide-react";

type HeaderProps = {
  title: string;
  onToggleSidebar: () => void;
  sidebarCollapsed?: boolean;
};

export default function Header({ title, onToggleSidebar, sidebarCollapsed = false }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="md:hidden mr-4 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Toggle sidebar"
            >
              <AlignJustify className="h-6 w-6" />
            </button>
            <div className="md:hidden">
              <h1 className="text-lg font-bold text-primary">
                Fama<span className="text-gray-800"> Imóveis</span>
              </h1>
            </div>
            {title && (
              <h1 className={`hidden md:block text-2xl font-bold text-gray-800 ${sidebarCollapsed ? 'ml-2' : ''}`}>
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
