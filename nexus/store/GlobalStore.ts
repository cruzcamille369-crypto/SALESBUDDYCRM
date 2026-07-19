/**
 * Module: GlobalStateEngine | File: /nexus/store/GlobalStore.ts
 * 
 * Enterprise-grade unified Zustand State Store for Braveheart CRM OS.
 * Centralizes all CRM entities (sales, customers, users, config, communications, workflows)
 * with robust, type-safe setters, O(1) lookups, optimistic transitions, and automatic cleanup.
 */
import { create } from 'zustand';
import { 
    Customer, Sale, User, Account, Note, Task, ProductConfig, 
    AuditEntry, AttendanceRecord, TacticalDirective, ChatMessage, 
    ChatChannel, AppNotification, ScriptItem, Presence, SystemConfig, 
    SystemHealth, IncentiveSettings 
} from '../../types';
import { INITIAL_PRODUCT_CONFIG } from '../../constants';

// Initial state configurations
const DEFAULT_SYSTEM_CONFIG: SystemConfig = { 
    shiftStart: "08:00", shiftEnd: "17:00", cutoffDay1: 15, cutoffDay2: 0,
    rbacMatrix: {
        admin: { viewLeads: true, editLeads: true, deleteLeads: true, exportLeads: true, processSales: true, viewReports: true },
        agent: { viewLeads: true, editLeads: true, deleteLeads: false, exportLeads: false, processSales: true, viewReports: false }
    },
    customFieldsConfig: [
        { id: 'supp_primaryFocus', label: 'Primary Health Focus', type: 'select', options: ['Weight Loss', 'Muscle Gain', 'Joint Health', 'General Wellness', 'Heart Health', 'Brain Health'] },
        { id: 'supp_currentMeds', label: 'Taking Other Medications', type: 'boolean' },
        { id: 'supp_allergies', label: 'Allergies', type: 'text' },
        { id: 'supp_preferredForm', label: 'Preferred Supplement Form', type: 'select', options: ['Capsules', 'Gummies', 'Powders', 'Liquid'] },
        { id: 'supp_activityLevel', label: 'Activity Level', type: 'select', options: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'] },
        { id: 'supp_reorderCycleDays', label: 'Reorder Cycle (Days)', type: 'number' },
    ],
    baseCommission: 15, breakDurationMinutes: 60, ecoMode: false, telephonyEnabled: false,
    customDialerEnabled: false, customDialerType: 'PROTOCOL_URI', customDialerUrlTemplate: 'https://dialer.yourcompany.com/?phone={phone_clean}'
};

const DEFAULT_SYSTEM_HEALTH: SystemHealth = {
    cloudSync: 'STABLE', encryption: 'AES-256', storageUsage: 0,
    sessionIntegrity: 'SECURE', latency: 42, lastDiagnostic: Date.now()
};

export interface GlobalCRMState {
    // State properties
    sales: Sale[];
    users: User[];
    customers: Customer[];
    activeCustomersMap: Record<string, Customer>; // O(1) high-performance lookup
    accounts: Account[];
    notes: Note[];
    tasks: Task[];
    productConfig: ProductConfig;
    auditLogs: AuditEntry[];
    attendance: AttendanceRecord[];
    directives: TacticalDirective[];
    messages: ChatMessage[];
    channels: ChatChannel[];
    notifications: AppNotification[];
    callLogs: any[];
    scripts: ScriptItem[];
    customSheets: any[];
    presence: Presence[];
    dataHealthReports: any[];
    dialerLists: any[];
    systemConfig: SystemConfig;
    incentiveSettings: IncentiveSettings | null;
    health: SystemHealth;
    isSyncing: boolean;
    lastSyncTimestamp: number;

    // Direct state setters
    setSales: (sales: Sale[]) => void;
    setUsers: (users: User[]) => void;
    setCustomers: (customers: Customer[]) => void;
    addCustomerOptimistic: (customer: Customer) => void;
    updateCustomerOptimistic: (id: string, partial: Partial<Customer>) => void;
    setAccounts: (accounts: Account[]) => void;
    setNotes: (notes: Note[]) => void;
    setTasks: (tasks: Task[]) => void;
    setProductConfig: (config: ProductConfig) => void;
    setAuditLogs: (logs: AuditEntry[]) => void;
    setAttendance: (attendance: AttendanceRecord[]) => void;
    setDirectives: (directives: TacticalDirective[]) => void;
    setMessages: (messages: ChatMessage[]) => void;
    setChannels: (channels: ChatChannel[]) => void;
    setNotifications: (notifications: AppNotification[]) => void;
    addNotification: (notification: AppNotification) => void;
    dismissNotification: (id: string) => void;
    setCallLogs: (callLogs: any[]) => void;
    setScripts: (scripts: ScriptItem[]) => void;
    setCustomSheets: (customSheets: any[]) => void;
    setPresence: (presence: Presence[]) => void;
    setDataHealthReports: (reports: any[]) => void;
    setDialerLists: (lists: any[]) => void;
    setSystemConfig: (config: SystemConfig) => void;
    setIncentiveSettings: (config: IncentiveSettings | null) => void;
    setHealth: (health: SystemHealth) => void;
    setSyncState: (isSyncing: boolean) => void;
    
    // Core actions
    resetStore: () => void;
}

export const useGlobalStore = create<GlobalCRMState>((set, _get) => ({
    // Initial State values
    sales: [],
    users: [],
    customers: [],
    activeCustomersMap: {},
    accounts: [],
    notes: [],
    tasks: [],
    productConfig: INITIAL_PRODUCT_CONFIG,
    auditLogs: [],
    attendance: [],
    directives: [],
    messages: [],
    channels: [],
    notifications: [],
    callLogs: [],
    scripts: [],
    customSheets: [],
    presence: [],
    dataHealthReports: [],
    dialerLists: [],
    systemConfig: DEFAULT_SYSTEM_CONFIG,
    incentiveSettings: null,
    health: DEFAULT_SYSTEM_HEALTH,
    isSyncing: false,
    lastSyncTimestamp: 0,

    // Actions & Setters
    setSales: (sales) => set({ sales }),
    
    setUsers: (users) => set({ users }),
    
    setCustomers: (customers) => {
        const map: Record<string, Customer> = {};
        for(const c of customers) { map[c.id] = c; }
        set({ customers, activeCustomersMap: map, lastSyncTimestamp: Date.now() });
    },

    addCustomerOptimistic: (customer) => set((state) => {
        const newMap = { ...state.activeCustomersMap, [customer.id]: customer };
        return { 
            customers: [customer, ...state.customers],
            activeCustomersMap: newMap
        };
    }),

    updateCustomerOptimistic: (id, partial) => set((state) => {
        const existing = state.activeCustomersMap[id];
        if (!existing) return state;

        const updated = { ...existing, ...partial };
        const newMap = { ...state.activeCustomersMap, [id]: updated };
        
        return {
            activeCustomersMap: newMap,
            customers: state.customers.map(c => c.id === id ? updated : c)
        };
    }),

    setAccounts: (accounts) => set({ accounts }),
    
    setNotes: (notes) => set({ notes }),
    
    setTasks: (tasks) => set({ tasks }),
    
    setProductConfig: (productConfig) => set({ productConfig }),
    
    setAuditLogs: (auditLogs) => set({ auditLogs }),
    
    setAttendance: (attendance) => set({ attendance }),
    
    setDirectives: (directives) => set({ directives }),
    
    setMessages: (messages) => set({ messages }),
    
    setChannels: (channels) => set({ channels }),
    
    setNotifications: (notifications) => set({ notifications }),

    addNotification: (notif) => set((state) => ({ 
        notifications: [notif, ...state.notifications] 
    })),

    dismissNotification: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true, reminderDismissed: true } : n)
    })),

    setCallLogs: (callLogs) => set({ callLogs }),
    
    setScripts: (scripts) => set({ scripts }),
    
    setCustomSheets: (customSheets) => set({ customSheets }),
    
    setPresence: (presence) => set({ presence }),
    
    setDataHealthReports: (dataHealthReports) => set({ dataHealthReports }),
    
    setDialerLists: (dialerLists) => set({ dialerLists }),
    
    setSystemConfig: (systemConfig) => set({ systemConfig }),
    
    setIncentiveSettings: (incentiveSettings) => set({ incentiveSettings }),
    
    setHealth: (health) => set({ health }),
    
    setSyncState: (isSyncing) => set({ isSyncing, lastSyncTimestamp: Date.now() }),

    resetStore: () => set({
        sales: [],
        users: [],
        customers: [],
        activeCustomersMap: {},
        accounts: [],
        notes: [],
        tasks: [],
        productConfig: INITIAL_PRODUCT_CONFIG,
        auditLogs: [],
        attendance: [],
        directives: [],
        messages: [],
        channels: [],
        notifications: [],
        callLogs: [],
        scripts: [],
        customSheets: [],
        presence: [],
        dataHealthReports: [],
        dialerLists: [],
        systemConfig: DEFAULT_SYSTEM_CONFIG,
        incentiveSettings: null,
        health: DEFAULT_SYSTEM_HEALTH,
        isSyncing: false,
        lastSyncTimestamp: 0
    })
}));
