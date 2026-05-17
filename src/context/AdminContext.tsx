'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AdminContextType {
  unsavedPaths: Record<string, boolean>;
  setUnsavedPath: (path: string, isUnsaved: boolean) => void;
  isViewMode: boolean;
  setViewMode: (v: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [unsavedPaths, setUnsavedPaths] = useState<Record<string, boolean>>({});
  const [isViewMode, setViewMode] = useState(false);

  const setUnsavedPath = (path: string, isUnsaved: boolean) => {
    setUnsavedPaths((prev) => {
      if (prev[path] === isUnsaved) return prev;
      return { ...prev, [path]: isUnsaved };
    });
  };

  return (
    <AdminContext.Provider value={{ unsavedPaths, setUnsavedPath, isViewMode, setViewMode }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
}