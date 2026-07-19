
import React, { createContext, useContext, useState } from 'react';
import { sfx } from '../../lib/soundService';
import { motion } from 'motion/react';

type TabsContextType = {
  activeTab: string;
  setActiveTab: (id: string) => void;
  orientation: 'horizontal' | 'vertical';
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue, value, onValueChange, children, className = "", orientation = 'horizontal' }) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultValue || '');

  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalActiveTab;

  const setActiveTab = (id: string) => {
    if (onValueChange) {
      onValueChange(id);
    }
    if (!isControlled) {
      setInternalActiveTab(id);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, orientation }}>
      <div className={`w-full h-full ${orientation === 'vertical' ? 'flex flex-row' : 'flex flex-col'} ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabListProps {
  children?: React.ReactNode;
  className?: string;
  isCollapsed?: boolean;
}

export const TabList: React.FC<TabListProps> = ({ children, className = "", isCollapsed }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabList must be used within Tabs");

  const baseStyle = context.orientation === 'vertical' 
    ? "flex flex-col space-y-2 w-full" 
    : "flex items-center space-x-2 border-b border-border-subtle w-full";

  return (
    <div className={`${baseStyle} ${className}`}>
      {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
             // Avoid passing non-DOM props to HTML elements
             if (typeof child.type === 'string') {
                 return child;
             }
             return React.cloneElement(child as React.ReactElement<any>, { isCollapsed });
          }
          return child;
      })}
    </div>
  );
};

interface TabTriggerProps {
  value: string;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  isCollapsed?: boolean; 
  colorHint?: string; // e.g. text-purple-400
}

export const TabTrigger: React.FC<TabTriggerProps> = ({ value, children, className = "", icon, title, isCollapsed, colorHint }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabTrigger must be used within Tabs");

  const isActive = context.activeTab === value;
  
  const verticalStyles = `w-full ${isCollapsed ? 'py-3 px-3 h-12 w-12 flex-col justify-center' : 'py-3 px-3 flex-row justify-start'} flex items-center gap-3 transition-all duration-300 outline-none group relative overflow-hidden w-full ${
    isActive 
      ? 'sidebar-tab-trigger-active border shadow-sm' 
      : 'sidebar-tab-trigger-inactive border'
  }`;

  const horizontalStyles = `px-5 py-3.5 flex items-center gap-2.5 text-[15px] font-extrabold tracking-wide transition-all duration-300 border-b-2 outline-none ${
    isActive 
      ? 'horizontal-tab-trigger-active' 
      : 'border-transparent text-text-secondary hover:text-accent-primary hover:border-border-subtle hover:bg-surface-alt/50'
  }`;

  const handleClick = () => {
      sfx.playClick();
      context.setActiveTab(value);
  };

  // Enhance icon size
  const enhancedIcon = icon && React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
      size: context.orientation === 'vertical' ? (isCollapsed ? 22 : 32) : 18 
  }) : icon;

  const getIconColorClass = () => {
      if (colorHint) return colorHint;
      if (context.orientation === 'vertical') {
          return isActive 
              ? 'text-[var(--sidebar-accent)]' 
              : 'text-[var(--sidebar-text-muted)] group-hover:text-[var(--sidebar-text)]';
      }
      return isActive ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary';
  };

  return (
    <motion.button 
      onClick={handleClick}
      onMouseEnter={() => sfx.playHover()}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={`${context.orientation === 'vertical' ? verticalStyles : horizontalStyles} ${className} outline-none group relative`}
      title={title || (typeof children === 'string' ? children : '')}
    >
      {/* Background glow when active (vertical only) */}
      {isActive && context.orientation === 'vertical' && (
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-current blur-2xl rounded-full" />
          </div>
      )}

      {enhancedIcon && (
          <motion.span 
              initial={false}
              animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive && context.orientation === 'vertical' ? -2 : 0,
                  filter: isActive ? 'drop-shadow(0 0 8px currentColor)' : 'drop-shadow(0 0 0px transparent)'
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={`${getIconColorClass()} transition-colors shrink-0 relative z-10`}
          >
              {enhancedIcon}
          </motion.span>
      )}
      {!isCollapsed && (
          <motion.span 
              initial={false}
              animate={{
                  scale: isActive ? 1.05 : 1,
                  
              }}
              className={`${context.orientation === 'vertical' ? 'text-sm font-semibold text-center whitespace-normal leading-tight opacity-100 mt-1 max-w-full px-0.5' : 'whitespace-nowrap'} overflow-hidden transition-colors duration-200 tracking-wide relative z-10`}
          >
              {children}
          </motion.span>
      )}
    </motion.button>
  );
};

interface TabContentProps {
  value: string;
  children?: React.ReactNode;
  className?: string;
}

export const TabContent: React.FC<TabContentProps> = ({ value, children, className = "" }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabContent must be used within Tabs");

  if (context.activeTab !== value) return null;

  return (
    <div className={`w-full ${className} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {children}
    </div>
  );
};
