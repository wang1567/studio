
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type TabValue = 'details' | 'live';

interface TabsContextType {
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabsContext must be used within a TabsContextProvider');
  }
  return context;
};

interface TabsContextProviderProps {
  children: ReactNode;
  initialTab: TabValue;
}

export const TabsContextProvider: React.FC<TabsContextProviderProps> = ({ children, initialTab }) => {
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  const value = { activeTab, setActiveTab };

  // This is a bit of a workaround to lift the state from the shadcn Tabs component.
  // We find the real Tabs component in the children and inject our onValueChange handler.
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child) && (child.type as any) === Tabs) {
      return React.cloneElement(child, {
        onValueChange: (value: string) => {
          setActiveTab(value as TabValue);
          // Also call original handler if it exists
          if (child.props.onValueChange) {
            child.props.onValueChange(value);
          }
        },
      } as React.HTMLAttributes<HTMLElement>);
    }
    return child;
  });

  return (
    <TabsContext.Provider value={value}>
      {enhancedChildren}
    </TabsContext.Provider>
  );
};
