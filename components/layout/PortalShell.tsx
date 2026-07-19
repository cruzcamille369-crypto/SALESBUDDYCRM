import { getStorageItem, setStorageItem } from '../../lib/storage';
import React, { useState, useEffect } from 'react';
import { 
  Sun, Moon, LogOut, Bell, Coffee, Play, Server, ChevronDown, X as CloseIcon, LayoutGrid, Palette, Check
} from 'lucide-react';
import { User, AppNotification } from '../../types';
import { useAuth, useTimer } from '../../hooks/useAuth';
import { usePerformance } from '../../hooks/usePerformance';
import { useSystem } from '../../hooks/useSystem';
import { useCRM } from '../../hooks/useCRM';
import { sfx } from '../../lib/soundService';
import { formatTimer } from '../../views/utils/crmLogic';
import { NotificationPanel } from '../widgets/NotificationPanel';
import { ShiftOverlay } from './ShiftOverlay';
import { BreakOverlay } from './BreakOverlay';
import { AgentTimeSheet } from '../modals/AgentTimeSheet';
import { BreakControlModal } from '../modals/BreakControlModal';
import { UserSettingsModal } from './UserSettingsModal';
import { motion, AnimatePresence } from 'motion/react';

interface PortalShellProps {
    user: User;
    title: string;
    sidebarContent: React.ReactNode;
    headerContent?: React.ReactNode;
    children: React.ReactNode;
    notifications?: AppNotification[]; 
    clearNotification?: (id: string) => void;
}

// Utility to calculate relative luminance of a hex color
function getLuminance(hex: string): number {
    if (!hex) return 1;
    let clean = hex.trim().replace('#', '');
    if (clean.length === 3) {
        clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    if (clean.length < 6) return 1;
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    
    const [rl, gl, bl] = [r, g, b].map(v => 
        v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export const PortalShell: React.FC<PortalShellProps> = ({
    title, sidebarContent, headerContent, children,
    notifications = [], clearNotification
}) => {
    const { currentUser: user, logout } = useAuth();
    const { isOnBreak, onToggleBreak, workTimeSeconds, isOffline, isAfk } = useTimer();
    const { isClockedIn, clockIn, clockOut } = usePerformance();
    const { theme, toggleTheme, activeServer, serverList, switchServer, setToast, uiZoom, setUiZoom } = useSystem();
    const { attendance, sales } = useCRM();

    const [_isSidebarCollapsed, _setIsSidebarCollapsed] = useState(true);
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const [isTimeSheetOpen, setIsTimeSheetOpen] = useState(false);
    const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
    const [isServerSwitcherOpen, setIsServerSwitcherOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // User Settings Modal state
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [settingsInitialTab, setSettingsInitialTab] = useState<'profile' | 'preferences' | 'support'>('profile');

    const _openSettings = (tab: 'profile' | 'preferences' | 'support') => {
        setSettingsInitialTab(tab);
        setIsSettingsModalOpen(true);
    };
    
    // Zoom-like Theme Selector
    const [appThemePalette, setAppThemePalette] = useState(() => getStorageItem('appThemePalette') || 'Classic');
    const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);

    useEffect(() => {
        setStorageItem('appThemePalette', appThemePalette);
    }, [appThemePalette]);

    const themeVars: Record<string, React.CSSProperties> = {
        Classic: (theme === 'dark' ? {
            // DARK MODE (Classic) -> Deep Dark Violet workspace, completely black/dark charcoal sidebar & header
            '--sidebar-bg': '#0a0a0a',
            '--sidebar-border': '#1e1e1e',
            '--sidebar-text': '#0F1D35',
            '--sidebar-text-muted': '#6B7A99',
            '--sidebar-accent': '#f3f4f6',
            '--header-bg': '#0a0a0a',
            '--header-border': '#1e1e1e',
            '--header-text': '#ffffff',
            '--header-accent': '#f3f4f6',
            
            // Main workspace canvas (Dark)
            '--color-surface-canvas': '265 45% 6%',
            '--color-surface-widget': '265 25% 9%',
            '--color-surface-main': '265 25% 12%',
            '--color-surface-alt': '265 25% 16%',
            '--color-surface-highlight': '265 50% 20%',
            '--color-text-primary': '0 0% 100%',
            '--color-text-secondary': '218 14% 83%',
            '--color-text-muted': '218 11% 65%',
            '--color-border-subtle': '265 20% 18%',
            '--color-border-strong': '265 20% 28%',
            '--color-accent-primary': '250 85% 70%', 
            '--color-accent-secondary': '330 80% 70%',
        } : {
            // LIGHT MODE (Classic) -> Cool Alabaster workspace, completely black/dark charcoal sidebar & header (static panel)
            '--sidebar-bg': '#0a0a0a',
            '--sidebar-border': '#1e1e1e',
            '--sidebar-text': '#0F1D35',
            '--sidebar-text-muted': '#6B7A99',
            '--sidebar-accent': '#f3f4f6',
            '--header-bg': '#0a0a0a',
            '--header-border': '#1e1e1e',
            '--header-text': '#ffffff',
            '--header-accent': '#f3f4f6',
            
            // Main workspace canvas (Light)
            '--color-surface-canvas': '220 14% 96%',
            '--color-surface-widget': '0 0% 100%',
            '--color-surface-main': '0 0% 100%',
            '--color-surface-alt': '210 30% 97%',
            '--color-surface-highlight': '210 30% 95%',
            '--color-text-primary': '0 0% 0%',
            '--color-text-secondary': '215 14% 34%',
            '--color-text-muted': '215 14% 45%',
            '--color-border-subtle': '214 32% 91%',
            '--color-border-strong': '214 32% 82%',
            '--color-accent-primary': '250 85% 60%', 
            '--color-accent-secondary': '330 80% 60%',
        }) as React.CSSProperties,

        Bloom: (theme === 'dark' ? {
            // Bloom Dark Mode: Royal blue sidebar and header with white text/icons. Dark workspace canvas.
            '--sidebar-bg': '#2563eb',
            '--sidebar-border': 'rgba(255, 255, 255, 0.15)',
            '--sidebar-text': '#0F1D35',
            '--sidebar-text-muted': 'rgba(255, 255, 255, 0.7)',
            '--sidebar-accent': '#ffffff',
            '--sidebar-accent-contrast': '#2563eb',
            '--header-bg': '#2563eb',
            '--header-border': 'rgba(255, 255, 255, 0.15)',
            '--header-text': '#ffffff',
            '--header-accent': '#ffffff',
            // HSL overrides for workspace
            '--color-surface-canvas': '215 15% 4%',
            '--color-surface-widget': '215 12% 8%',
            '--color-surface-main': '215 12% 10%',
            '--color-surface-alt': '215 12% 14%',
            '--color-surface-highlight': '221 83% 20%',
            '--color-text-primary': '0 0% 100%', // Enhanced Contrast
            '--color-text-secondary': '210 20% 75%',
            '--color-text-muted': '210 15% 55%',
            '--color-border-subtle': '215 12% 15%',
            '--color-border-strong': '215 12% 24%',
            '--color-accent-primary': '221 83% 53%', // Royal Blue for CTAs/Stages
            '--color-accent-secondary': '239 84% 66%', // Indigo-violet accent
        } : {
            // Bloom Light Mode: Royal blue sidebar and header with white text/icons. Light workspace canvas.
            '--sidebar-bg': '#2563eb',
            '--sidebar-border': 'rgba(255, 255, 255, 0.15)',
            '--sidebar-text': '#0F1D35',
            '--sidebar-text-muted': 'rgba(255, 255, 255, 0.7)',
            '--sidebar-accent': '#ffffff',
            '--sidebar-accent-contrast': '#2563eb',
            '--header-bg': '#2563eb',
            '--header-border': 'rgba(255, 255, 255, 0.15)',
            '--header-text': '#ffffff',
            '--header-accent': '#ffffff',
            // HSL overrides for workspace
            '--color-surface-canvas': '210 40% 96%',
            '--color-surface-widget': '0 0% 100%',
            '--color-surface-main': '0 0% 100%',
            '--color-surface-alt': '210 30% 97%',
            '--color-surface-highlight': '210 30% 95%',
            '--color-text-primary': '215 25% 15%',
            '--color-text-secondary': '215 15% 45%',
            '--color-text-muted': '215 15% 65%',
            '--color-border-subtle': '214 32% 91%',
            '--color-border-strong': '214 32% 82%',
            '--color-accent-primary': '221 83% 53%', // Royal Blue
            '--color-accent-secondary': '239 84% 66%', // Indigo-violet
        }) as React.CSSProperties,

        HubSpot: (theme === 'dark' ? {
            // HubSpot Dark Mode: HubSpot Charcoal panel with HubSpot Orange accents, dark canvas
            '--sidebar-bg': '#2d3e50',
            '--sidebar-border': 'rgba(255, 255, 255, 0.12)',
            '--sidebar-text': '#0F1D35',
            '--sidebar-text-muted': 'rgba(255, 255, 255, 0.65)',
            '--sidebar-accent': '#ff7a59',
            '--sidebar-accent-contrast': '#ffffff',
            '--header-bg': '#2d3e50',
            '--header-border': 'rgba(255, 255, 255, 0.12)',
            '--header-text': '#ffffff',
            '--header-accent': '#ff7a59',
            // HSL overrides for workspace
            '--color-surface-canvas': '215 15% 4%',
            '--color-surface-widget': '215 12% 8%',
            '--color-surface-main': '215 12% 10%',
            '--color-surface-alt': '215 12% 14%',
            '--color-surface-highlight': '24 100% 20%',
            '--color-text-primary': '210 40% 98%',
            '--color-text-secondary': '210 20% 75%',
            '--color-text-muted': '210 15% 55%',
            '--color-border-subtle': '215 12% 15%',
            '--color-border-strong': '215 12% 24%',
            '--color-accent-primary': '24 100% 67%', // HubSpot Orange HSL
            '--color-accent-secondary': '215 12% 14%',
        } : {
            // HubSpot Light Mode: HubSpot Charcoal panel with HubSpot Orange accents, light canvas
            '--sidebar-bg': '#2d3e50',
            '--sidebar-border': 'rgba(255, 255, 255, 0.12)',
            '--sidebar-text': '#0F1D35',
            '--sidebar-text-muted': 'rgba(255, 255, 255, 0.65)',
            '--sidebar-accent': '#ff7a59',
            '--sidebar-accent-contrast': '#ffffff',
            '--header-bg': '#2d3e50',
            '--header-border': 'rgba(255, 255, 255, 0.12)',
            '--header-text': '#ffffff',
            '--header-accent': '#ff7a59',
            // HSL overrides for workspace
            '--color-surface-canvas': '210 40% 98%',
            '--color-surface-widget': '0 0% 100%',
            '--color-surface-main': '0 0% 100%',
            '--color-surface-alt': '210 30% 97%',
            '--color-surface-highlight': '210 30% 95%',
            '--color-text-primary': '215 25% 15%',
            '--color-text-secondary': '215 15% 45%',
            '--color-text-muted': '215 15% 65%',
            '--color-border-subtle': '214 32% 91%',
            '--color-border-strong': '214 32% 82%',
            '--color-accent-primary': '24 100% 67%', // HubSpot Orange HSL
            '--color-accent-secondary': '210 30% 95%',
        }) as React.CSSProperties,

        Rose: (theme === 'dark' ? {
            // Rose Dark Mode: Bright Rose-500 panel with white text, deep plum dark canvas
            '--sidebar-bg': '#f43f5e',
            '--sidebar-border': 'rgba(255, 255, 255, 0.2)',
            '--sidebar-text': '#0F1D35',
            '--sidebar-text-muted': 'rgba(255, 255, 255, 0.75)',
            '--sidebar-accent': '#ffffff',
            '--sidebar-accent-contrast': '#f43f5e',
            '--header-bg': '#f43f5e',
            '--header-border': 'rgba(255, 255, 255, 0.2)',
            '--header-text': '#ffffff',
            '--header-accent': '#ffffff',
            // HSL overrides for workspace
            '--color-surface-canvas': '320 40% 6%',
            '--color-surface-widget': '320 30% 10%',
            '--color-surface-main': '320 30% 12%',
            '--color-surface-alt': '320 25% 15%',
            '--color-surface-highlight': '320 30% 20%',
            '--color-text-primary': '340 40% 98%',
            '--color-text-secondary': '340 20% 75%',
            '--color-text-muted': '340 15% 55%',
            '--color-border-subtle': '351 90% 15%',
            '--color-border-strong': '351 90% 25%',
            '--color-accent-primary': '351 90% 65%', // Pink-rose
            '--color-accent-secondary': '320 30% 15%',
        } : {
            // Rose Light Mode: Bright Rose-500 panel with white text, soft blush light canvas
            '--sidebar-bg': '#f43f5e',
            '--sidebar-border': 'rgba(255, 255, 255, 0.2)',
            '--sidebar-text': '#0F1D35',
            '--sidebar-text-muted': 'rgba(255, 255, 255, 0.75)',
            '--sidebar-accent': '#ffffff',
            '--sidebar-accent-contrast': '#f43f5e',
            '--header-bg': '#f43f5e',
            '--header-border': 'rgba(255, 255, 255, 0.2)',
            '--header-text': '#ffffff',
            '--header-accent': '#ffffff',
            // HSL overrides for workspace
            '--color-surface-canvas': '340 40% 98%',
            '--color-surface-widget': '340 70% 99%',
            '--color-surface-main': '340 70% 99%',
            '--color-surface-alt': '340 50% 95%',
            '--color-surface-highlight': '340 50% 92%',
            '--color-text-primary': '345 50% 12%',
            '--color-text-secondary': '345 30% 40%',
            '--color-text-muted': '345 20% 60%',
            '--color-border-subtle': '340 40% 93%',
            '--color-border-strong': '340 40% 86%',
            '--color-accent-primary': '351 90% 60%', // Playful pink highlights
            '--color-accent-secondary': '340 70% 95%',
        }) as React.CSSProperties,

        Navy: (theme === 'dark' ? {
            // Navy Dark Mode: Midnight Navy panel, dark canvas
            '--sidebar-bg': '#0a1128',
            '--sidebar-border': 'rgba(59, 130, 246, 0.15)',
            '--sidebar-text': '#f1f5f9',
            '--sidebar-text-muted': '#6B7A99',
            '--sidebar-accent': '#06b6d4',
            '--header-bg': '#0a1128',
            '--header-border': 'rgba(59, 130, 246, 0.15)',
            '--header-text': '#f1f5f9',
            '--header-accent': '#06b6d4',
            // HSL overrides for workspace
            '--color-surface-canvas': '220 50% 5%',
            '--color-surface-widget': '220 40% 9%',
            '--color-surface-main': '220 40% 11%',
            '--color-surface-alt': '220 30% 15%',
            '--color-surface-highlight': '220 30% 20%',
            '--color-text-primary': '220 20% 96%',
            '--color-text-secondary': '220 15% 75%',
            '--color-text-muted': '220 10% 55%',
            '--color-border-subtle': '217 60% 15%',
            '--color-border-strong': '217 60% 25%',
            '--color-accent-primary': '172 66% 50%', // Bright teal
            '--color-accent-secondary': '217 60% 15%',
        } : {
            // Navy Light Mode: Midnight Navy panel, white canvas
            '--sidebar-bg': '#0a1128',
            '--sidebar-border': 'rgba(255, 255, 255, 0.12)',
            '--sidebar-text': '#f1f5f9',
            '--sidebar-text-muted': '#6B7A99',
            '--sidebar-accent': '#3b82f6',
            '--header-bg': '#0a1128',
            '--header-border': 'rgba(255, 255, 255, 0.12)',
            '--header-text': '#f1f5f9',
            '--header-accent': '#3b82f6',
            // HSL overrides for workspace
            '--color-surface-canvas': '210 40% 98%',
            '--color-surface-widget': '210 60% 98%',
            '--color-surface-main': '210 60% 98%',
            '--color-surface-alt': '210 40% 94%',
            '--color-surface-highlight': '210 45% 90%',
            '--color-text-primary': '217 60% 15%',
            '--color-text-secondary': '217 20% 45%',
            '--color-text-muted': '217 15% 65%',
            '--color-border-subtle': '210 40% 90%',
            '--color-border-strong': '210 40% 82%',
            '--color-accent-primary': '217 91% 60%',
            '--color-accent-secondary': '210 60% 98%',
        }) as React.CSSProperties,

                Fresh: (theme === 'dark' ? {
            // Fresh Dark Mode: Deep Navy sidebar, very dark gray/blue workspace
            '--sidebar-bg': '#0f172a',
            '--sidebar-border': '#E1E6EF',
            '--sidebar-text': '#0F1D35',
            '--sidebar-text-muted': '#6B7A99',
            '--sidebar-accent': '#2D6AFF',
            '--sidebar-accent-contrast': '#ffffff',
            '--header-bg': '#0A1628',
            '--header-border': '#1E3459',
            '--header-text': '#FFFFFF',
            '--header-accent': '#10b981',
            // HSL overrides for workspace
            '--color-surface-canvas': '220 26% 14%',
            '--color-surface-widget': '215 28% 17%',
            '--color-surface-main': '220 26% 14%',
            '--color-surface-alt': '215 28% 20%',
            '--color-surface-highlight': '215 28% 25%',
            '--color-text-primary': '210 40% 98%',
            '--color-text-secondary': '210 20% 84%', // Enhanced Contrast
            '--color-text-muted': '210 20% 65%', // Enhanced Contrast
            '--color-border-subtle': '215 28% 25%',
            '--color-border-strong': '215 28% 35%',
            '--color-accent-primary': '160 84% 39%', // Emerald Green
            '--color-accent-secondary': '217 91% 60%', // Bright Blue
        } : {
            // Fresh Light Mode: Deep Navy sidebar, stark white header, light gray workspace
            '--sidebar-bg': '#FFFFFF',
            '--sidebar-border': '#E1E6EF',
            '--sidebar-text': '#0F1D35',
            '--sidebar-text-muted': '#6B7A99',
            '--sidebar-accent': '#2D6AFF',
            '--sidebar-accent-contrast': '#ffffff',
            '--header-bg': '#0A1628',
            '--header-border': '#1E3459',
            '--header-text': '#FFFFFF',
            '--header-accent': '#10b981',
            // HSL overrides for workspace
            '--color-surface-canvas': '220 33% 97%', // Soft cool light-gray / off-white
            '--color-surface-widget': '0 0% 100%',
            '--color-surface-main': '0 0% 100%',
            '--color-surface-alt': '210 20% 96%',
            '--color-surface-highlight': '210 20% 92%',
            '--color-text-primary': '215 28% 11%', // #111827 Enhanced Contrast
            '--color-text-secondary': '215 16% 27%', // #374151 Enhanced Contrast
            '--color-text-muted': '215 16% 46%', // Enhanced Contrast
            '--color-border-subtle': '210 20% 90%', // #E5E7EB equivalent
            '--color-border-strong': '210 20% 80%',
            '--color-accent-primary': '160 84% 39%', // Emerald Green
            '--color-accent-secondary': '217 91% 60%', // Bright Blue
        }) as React.CSSProperties,
        grass: (theme === 'dark' ? {
            // grass Dark Mode: Green panel, dark canvas
            '--sidebar-bg': '#16a34a',
            '--sidebar-border': 'rgba(255, 255, 255, 0.15)',
            '--sidebar-text': '#0F1D35',
            '--sidebar-text-muted': 'rgba(255, 255, 255, 0.7)',
            '--sidebar-accent': '#ffffff',
            '--sidebar-accent-contrast': '#16a34a',
            '--header-bg': '#16a34a',
            '--header-border': 'rgba(255, 255, 255, 0.15)',
            '--header-text': '#ffffff',
            '--header-accent': '#ffffff',
            // HSL overrides for workspace
            '--color-surface-canvas': '215 25% 6%',
            '--color-surface-widget': '215 20% 11%',
            '--color-surface-main': '215 20% 13%',
            '--color-surface-alt': '215 15% 18%',
            '--color-surface-highlight': '215 15% 22%',
            '--color-text-primary': '142 50% 96%',
            '--color-text-secondary': '142 30% 75%',
            '--color-text-muted': '142 20% 55%',
            '--color-border-subtle': '142 70% 15%',
            '--color-border-strong': '142 70% 25%',
            '--color-accent-primary': '142 70% 45%', // green
            '--color-accent-secondary': '215 20% 13%',
        } : {
            // grass Light Mode: Green panel, white canvas
            '--sidebar-bg': '#16a34a',
            '--sidebar-border': 'rgba(255, 255, 255, 0.15)',
            '--sidebar-text': '#0F1D35',
            '--sidebar-text-muted': 'rgba(255, 255, 255, 0.7)',
            '--sidebar-accent': '#ffffff',
            '--sidebar-accent-contrast': '#16a34a',
            '--header-bg': '#16a34a',
            '--header-border': 'rgba(255, 255, 255, 0.15)',
            '--header-text': '#ffffff',
            '--header-accent': '#ffffff',
            // HSL overrides for workspace
            '--color-surface-canvas': '142 10% 98%',
            '--color-surface-widget': '0 0% 100%',
            '--color-surface-main': '0 0% 100%',
            '--color-surface-alt': '142 30% 96%',
            '--color-surface-highlight': '142 30% 92%',
            '--color-text-primary': '142 60% 12%',
            '--color-text-secondary': '142 40% 35%',
            '--color-text-muted': '142 30% 55%',
            '--color-border-subtle': '#bbf7d0',
            '--color-border-strong': '#86efac',
            '--color-accent-primary': '142 76% 36%',
            '--color-accent-secondary': '142 70% 80%',
        }) as React.CSSProperties,
    };

    const rawThemeStyle = themeVars[appThemePalette === 'Agave' ? 'HubSpot' : appThemePalette] || themeVars.Classic;

    // Dynamically calculate luminance of panel backgrounds to set dynamic foreground text and icon contrast
    const sidebarBg = (rawThemeStyle['--sidebar-bg'] as string) || '#ffffff';
    const headerBg = (rawThemeStyle['--header-bg'] as string) || '#ffffff';
    const sidebarAccentBg = (rawThemeStyle['--sidebar-accent'] as string) || '#6366f1';

    const sidebarLuminance = getLuminance(sidebarBg);
    const headerLuminance = getLuminance(headerBg);
    const sidebarAccentLuminance = getLuminance(sidebarAccentBg);

    const calculatedSidebarText = (rawThemeStyle['--sidebar-text'] as string) || (sidebarLuminance > 0.45 ? '#0f172a' : '#ffffff');
    const calculatedSidebarTextMuted = (rawThemeStyle['--sidebar-text-muted'] as string) || (sidebarLuminance > 0.45 ? '#4b5563' : 'rgba(255, 255, 255, 0.7)');
    const calculatedSidebarBorder = (rawThemeStyle['--sidebar-border'] as string) || (sidebarLuminance > 0.45 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)');
    
    const calculatedHeaderText = (rawThemeStyle['--header-text'] as string) || (headerLuminance > 0.45 ? '#0f172a' : '#ffffff');
    const calculatedHeaderBorder = (rawThemeStyle['--header-border'] as string) || (headerLuminance > 0.45 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)');

    // Contrast for icons placed inside raw highlighted accent blocks (e.g. Logo wrapper)
    const calculatedSidebarAccentText = (rawThemeStyle['--sidebar-accent-contrast'] as string) || (sidebarAccentLuminance > 0.45 ? '#0f172a' : '#ffffff');

    const currentThemeStyle = {
        ...rawThemeStyle,
        '--sidebar-text': calculatedSidebarText,
        '--sidebar-text-muted': calculatedSidebarTextMuted,
        '--sidebar-border': calculatedSidebarBorder,
        '--sidebar-accent-contrast': calculatedSidebarAccentText,
        '--header-text': calculatedHeaderText,
        '--header-border': calculatedHeaderBorder,
    } as React.CSSProperties;

    useEffect(() => {
        const handleDlpAlert = (e: any) => {
            if ((user?.level || user?.accessLevel || 0) >= 10 && e.detail?.type === 'EXCESSIVE_REVEAL') {
                setToast({
                    title: 'DLP Alert',
                    message: `${e.detail.user} revealed > 20 records in an hour.`,
                    type: 'error'
                });
                sfx.playError();
            }
        };

        window.addEventListener('DLP_ALERT', handleDlpAlert);
        return () => window.removeEventListener('DLP_ALERT', handleDlpAlert);
    }, [user, setToast]);

    const handleClockIn = () => {
        clockIn();
    };

    const handleLogout = () => {
        if (isClockedIn) {
            clockOut();
        }
        logout();
    };

    const handleSwitchServer = (serverId: string) => {
        sfx.playSubmit();
        switchServer(serverId);
        setIsServerSwitcherOpen(false);
    };

    if (!user) return null;

    return (
        <div 
            className="h-full w-full flex flex-row bg-surface-canvas text-text-primary transition-all duration-500 relative font-sans overflow-hidden p-0 gap-0"
            style={currentThemeStyle}
        >
            
            {/* OVERLAYS */}
            {isOffline && (
                <div className="absolute top-0 left-0 right-0 h-10 bg-rose-500/90 text-white z-[500] flex items-center justify-center font-bold text-sm tracking-widest uppercase animate-pulse">
                    ⚠️ Offline Sync Mode Active — Pending Connection Restoration ⚠️
                </div>
            )}
            {isAfk && !isOffline && (
                <div className="absolute top-0 left-0 right-0 h-10 bg-amber-500/90 text-white z-[500] flex items-center justify-center font-bold text-sm tracking-widest uppercase animate-pulse">
                    ⚠️ INACTIVITY WARNING: NO ACTION DETECTED FOR 10 MINUTES ⚠️
                </div>
            )}
            {!isClockedIn && user.role === 'agent' && <ShiftOverlay />}
            {isOnBreak && <BreakOverlay />}
            
            <AgentTimeSheet 
                isOpen={isTimeSheetOpen}
                onClose={() => setIsTimeSheetOpen(false)}
                currentUser={user}
                attendance={attendance}
                sales={sales}
            />

            <BreakControlModal 
                isOpen={isBreakModalOpen}
                onClose={() => setIsBreakModalOpen(false)}
            />

            {/* MOBILE SIDEBAR OVERLAY */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 z-[150] bg-surface-alt  lg:hidden"
                        />
                        <motion.aside 
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`fixed inset-y-0 left-0 z-[160] w-56 bg-sidebar-bg border-r border-sidebar-border text-sidebar-text flex flex-col lg:hidden`}
                            style={currentThemeStyle}
                        >
                            <div className="h-[48px] flex items-center justify-between px-4 border-b border-sidebar-border bg-transparent">
                                <div className="flex items-center gap-3 shrink-0 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-[var(--sidebar-accent-contrast)]">
                                        <LayoutGrid size={16} fill="currentColor" />
                                    </div>
                                    <span className="font-medium tracking-tighter text-sidebar-text">Workspace</span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-accent/10 rounded-lg transition-all duration-200 hover:rotate-90">
                                    <CloseIcon size={20} />
                                </button>
                            </div>
                            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar bg-transparent">
                                {sidebarContent}
                            </nav>
                            <div className="p-4 border-t border-sidebar-border flex flex-col gap-2 bg-transparent">
                                <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-sidebar-border bg-sidebar-accent/10 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                        {(user.name || user.id || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-sidebar-text truncate">{user.name || user.id}</span>
                                        <span className="text-xs text-sidebar-text-muted capitalize truncate">{user.role}</span>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className="w-full p-3 flex items-center gap-4 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl font-bold mt-2">
                                    <LogOut size={20} />
                                    <span>Log Out Session</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* DESKTOP SIDEBAR - SAAS DESIGN (aligned as full-height column on the left) */}
            <aside 
                className={`
                    hidden lg:flex transition-all duration-300 ease-out flex-col shrink-0 h-full
                    bg-sidebar-bg border-r border-sidebar-border text-sidebar-text
                    w-[64px] items-center z-20 hover:shadow-xl hover:border-sidebar-accent/30 group/sidebar
                `}
                style={currentThemeStyle}
            >
                {/* Visual combined anchor logo wrapper aligned perfectly with the 48px header */}
                <div className="h-[56px] w-full flex items-center justify-center border-b border-sidebar-border shrink-0 bg-transparent group cursor-pointer hover:bg-sidebar-accent/10 transition-colors">
                    <button 
                        onClick={() => setIsTimeSheetOpen(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-sidebar-accent text-[var(--sidebar-accent-contrast)] cursor-pointer hover:opacity-100 hover:scale-105 hover:shadow-md hover:shadow-sidebar-accent/20 active:scale-95 transition-all duration-200 shrink-0"
                        title="View Timesheet"
                    >
                        <LayoutGrid size={18} strokeWidth={2} />
                    </button>
                    {/* <span className="font-bold text-sm tracking-wide text-sidebar-text truncate">Braveheart</span> */}
                </div>

                <nav className="flex-1 w-full px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar relative z-10 bg-transparent flex flex-col items-center">
                    {sidebarContent}
                </nav>

                <div className="py-4 border-t border-sidebar-border bg-transparent w-full flex flex-col items-center justify-center gap-3">
                    {/* User initial only */}
                    <div 
                        className="w-10 h-10 rounded-full bg-sidebar-accent/20 flex items-center justify-center text-sidebar-accent font-bold shrink-0 shadow-sm"
                        title={user.name || user.id}
                    >
                        {(user.name || user.id || 'U').charAt(0).toUpperCase()}
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className="w-10 h-10 flex items-center justify-center text-sidebar-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all rounded-xl group shrink-0"
                        title="Log Out"
                    >
                        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </aside>

            {/* RIGHT WORKSPACE SECTION: HEADER + MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                
                {/* UNIFIED TOP HEADER PANEL */}
                <header 
                    className="h-[56px] px-4 sm:px-6 flex items-center justify-between bg-header-bg border-b border-header-border text-header-text shrink-0 z-[50] transition-all duration-300 hover:shadow-sm hover:border-border-strong group/header"
                    style={currentThemeStyle}
                >
                    {/* LEFT: TITLE & SERVER */}
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink w-1/4">
                        {/* Mobile Menu Toggle (visible only on mobile) */}
                        <div className="lg:hidden w-[36px] flex items-center justify-start shrink-0">
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)} 
                                className="w-8 h-8 flex items-center justify-center rounded-md bg-sidebar-accent text-[var(--sidebar-accent-contrast)] cursor-pointer hover:opacity-90 transition-all shadow-sm"
                                title="Open Menu"
                            >
                                <LayoutGrid size={18} strokeWidth={2} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 min-w-0 shrink">
                            <h1 className="text-2xl sm:text-3xl font-black text-header-text tracking-tighter whitespace-nowrap truncate">{title}</h1>
                        </div>
                        
                        {activeServer && (
                            <div className="relative ml-2 shrink-0">
                                <button 
                                    onClick={() => user.accessLevel >= 10 && setIsServerSwitcherOpen(!isServerSwitcherOpen)}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 bg-header-text/5 hover:bg-header-text/10 border border-header-border rounded-lg transition-all ${user.accessLevel >= 10 ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    <Server size={14} className="text-header-accent" />
                                    <span className="text-xs font-bold text-header-text font-mono tracking-wider hidden sm:inline">{activeServer.name}</span>
                                    {user.accessLevel >= 10 && <ChevronDown size={14} className={`text-header-text/60 transition-transform duration-200 ${isServerSwitcherOpen ? 'rotate-180' : ''}`} />}
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm animate-pulse"></div>
                                </button>

                                <AnimatePresence>
                                    {isServerSwitcherOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsServerSwitcherOpen(false)} />
                                            <motion.div 
                                                initial={{ opacity: 0, y: 5, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 5, scale: 0.98 }}
                                                className="absolute top-full left-0 mt-3 w-64 bg-surface-main border border-border-strong shadow-float rounded-xl z-50 overflow-hidden"
                                            >
                                                <div className="p-3 border-b border-border-subtle bg-surface-alt/50">
                                                    <p className="text-sm font-semibold text-text-muted">Available Servers</p>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                                                    {serverList.map(server => (
                                                        <button
                                                            key={server.id}
                                                            onClick={() => handleSwitchServer(server.id)}
                                                            className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between hover:bg-surface-alt/50 transition-all ${activeServer.id === server.id ? 'bg-indigo-600/10 text-indigo-600 ring-1 ring-accent-primary/30' : 'text-text-secondary'}`}
                                                        >
                                                            <div className="flex items-center gap-3 shrink-0 min-w-0">
                                                                <Server size={14} />
                                                                <span className="text-sm font-bold">{server.name}</span>
                                                            </div>
                                                            {activeServer.id === server.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {headerContent}

                        <div className="flex items-center gap-3 shrink-0 min-w-0">
                            {!isClockedIn ? (
                                <button 
                                    onClick={handleClockIn}
                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-emerald-500/10 text-emerald-500 rounded-lg font-semibold text-xs sm:text-sm transition-all border border-emerald-500/20"
                                >
                                    <Play size={14} fill="currentColor" />
                                    <span className="hidden sm:inline">Clock In</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-1.5 p-1 bg-surface-main border border-border-strong rounded-xl">
                                    <div 
                                        className="px-2.5 py-1 bg-surface-alt border border-border-subtle rounded-lg cursor-pointer hover:bg-surface-alt/50 transition-colors flex flex-col justify-center"
                                        onClick={() => setIsTimeSheetOpen(true)}
                                    >
                                        <span className={`text-[10px] font-semibold mb-0.5 opacity-60 leading-none ${isOnBreak ? 'text-amber-500' : 'text-text-primary'}`}>Duration</span>
                                        <span className={`text-xs md:text-sm font-mono font-bold tracking-tight leading-none ${isOnBreak ? 'text-amber-500' : 'text-text-primary'}`}>
                                            {formatTimer(workTimeSeconds)}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => onToggleBreak()}
                                        title="Toggle Break" 
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all border ${isOnBreak ? 'bg-emerald-500 text-surface-alt border-emerald-500 shadow-md shadow-status-success/20 hover:brightness-110' : 'bg-surface-main text-text-primary border-border-subtle hover:bg-surface-alt/50'}`}
                                    >
                                        {isOnBreak ? (
                                            <>
                                                <Play size={14} fill="currentColor"/>
                                                <span className="hidden sm:inline">Resume</span>
                                            </>
                                        ) : (
                                            <>
                                                <Coffee size={14}/>
                                                <span className="hidden sm:inline">Break</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="hidden md:block w-px h-8 bg-slate-200 opacity-60 mx-1"></div>

                        <div className="flex items-center gap-1 relative">
                            {/* Color Theme Selector */}
                            <div className="relative">
                                <button 
                                    onClick={() => setIsThemeSelectorOpen(!isThemeSelectorOpen)} 
                                    className={`hidden md:flex p-2 items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-alt/50 transition-all rounded-lg border border-transparent hover:border-border-subtle ${isThemeSelectorOpen ? 'bg-surface-alt/50 border-border-subtle text-text-primary' : ''}`}
                                >
                                    <Palette size={18} />
                                </button>
                                
                                {isThemeSelectorOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsThemeSelectorOpen(false)} />
                                        <div className="absolute top-full right-0 mt-3 w-56 bg-surface-main border border-border-strong shadow-float rounded-xl z-50 overflow-hidden isolate">
                                            <div className="p-3 border-b border-border-subtle bg-surface-alt flex flex-col gap-1">
                                                <span className="text-xs font-bold text-text-primary uppercase tracking-wide">Workspace Properties</span>
                                                <span className="text-xs text-text-muted">Personalize your panel layout</span>
                                            </div>
                                            <div className="p-3 border-b border-border-subtle bg-surface-main">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-text-secondary">UI Scale</span>
                                                    <span className="text-xs font-bold text-indigo-600 font-mono">{Math.round((uiZoom || 1) * 100)}%</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => setUiZoom(Math.max(0.6, (uiZoom || 1) - 0.1))}
                                                        className="w-8 h-8 rounded bg-surface-alt hover:bg-surface-alt/50 border border-border-strong text-text-primary flex items-center justify-center font-bold"
                                                    >-</button>
                                                    <input 
                                                        type="range" 
                                                        min="0.6" max="2.0" step="0.1" 
                                                        value={uiZoom || 1}
                                                        onChange={e => setUiZoom(parseFloat(e.target.value))}
                                                        className="flex-1 cursor-pointer accent-accent-primary"
                                                    />
                                                    <button 
                                                        onClick={() => setUiZoom(Math.min(2.0, (uiZoom || 1) + 0.1))}
                                                        className="w-8 h-8 rounded bg-surface-alt hover:bg-surface-alt/50 border border-border-strong text-text-primary flex items-center justify-center font-bold"
                                                    >+</button>
                                                </div>
                                            </div>
                                            <div className="p-2 flex flex-col gap-1 bg-surface-main">
                                                {Object.keys(themeVars).map(t => {
                                                    const previewColors: Record<string, string> = {
                                                        Classic: 'bg-slate-900 border-slate-800',
                                                        Bloom: 'bg-[#2563eb] border-[#2563eb]',
                                                        HubSpot: 'bg-[#ff7a59] border-[#ff7a59]',
                                                        Rose: 'bg-[#f43f5e] border-[#f43f5e]',
                                                        Navy: 'bg-[#0f172a] border-[#0f172a]',
                                                        grass: 'bg-[#16a34a] border-[#16a34a]',
                                                        Fresh: 'bg-[#111827] border-[#10b981]'
                                                    };
                                                    return (
                                                    <button
                                                        key={t}
                                                        onClick={() => {
                                                            setAppThemePalette(t);
                                                            setIsThemeSelectorOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all hover:bg-surface-alt/50 group ${appThemePalette === t ? 'bg-surface-alt/50 text-indigo-600 ring-1 ring-accent-primary/20 shadow-sm' : 'text-text-secondary'}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full border ${previewColors[t] || 'bg-slate-200'}`}></div>
                                                            <span>{t === 'grass' ? 'grass' : t}</span>
                                                        </div>
                                                        {appThemePalette === t && <Check size={14} className="text-indigo-600" />}
                                                    </button>
                                                )})}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button onClick={toggleTheme} className="hidden md:flex p-2 items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-alt/50 transition-all rounded-lg border border-transparent hover:border-border-subtle">
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            
                            <button onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)} className="p-2 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-alt/50 transition-all relative rounded-lg border border-transparent hover:border-border-subtle">
                                <Bell size={18} />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border-2 border-surface-main rounded-full animate-ping"></span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* MAIN CONTENT WORKSPACE */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-canvas relative">
                    {/* WORKSPACE CONTENT */}
                    <div className="flex-1 flex flex-col min-h-0 relative bg-surface-canvas text-text-primary">
                        {children}
                    </div>
                </main>
            </div>

            <UserSettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                initialTab={settingsInitialTab}
                user={user}
            />

            <NotificationPanel 
                isOpen={isNotificationPanelOpen}
                onClose={() => setIsNotificationPanelOpen(false)}
                notifications={notifications}
                onClear={clearNotification!}
            />
        </div>
    );
};