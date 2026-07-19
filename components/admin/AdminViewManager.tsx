import React from 'react';
import { TabContent, Tabs, TabList, TabTrigger } from '../ui/Tabs';
import { sfx } from '../../lib/soundService';
import { User, Sale, Note, SystemConfig, ProductConfig, SystemHealth, ToastMessage } from '../../types';
import { 
    LayoutDashboard, UserPlus, ShieldAlert, Megaphone, MessageSquare, 
    CircleDollarSign, Database, Users, Home, Shield, LineChart, 
    Trophy, FileText, Package, Settings, Server, GitMerge, Layers
} from 'lucide-react';

// Standard Imports for fast routing
import { AdminDashboard } from './AdminDashboard';
import EnrollmentFormV2 from '../forms/EnrollmentFormV2';
import { PipelineBoard } from '../pipeline/PipelineBoard';
import { RetentionView } from '../../views/RetentionView';
import { SalesLedger } from '../widgets/SalesLedger';
import { PayrollManager } from './dashboard/financials/PayrollManager';
import { OperativeRoster } from './OperativeRoster';
import { AgentLeaderboard } from '../widgets/AgentLeaderboard';
import { MessagingLayout } from '../chat/MessagingLayout';
import { CampaignManager } from './campaigns/CampaignManager';
import { ScriptManager } from '../../views/ScriptManager';
import { ProductManager } from './ProductManager';
import { AdminAnalytics } from '../widgets/AdminAnalytics';
import { PerformanceCenter } from '../widgets/PerformanceCenter';
import { SystemConfigPanel } from './SystemConfigPanel';
import { GodModePanel } from '../widgets/GodModePanel';
import { CRMAuditDashboard } from './CRMAuditDashboard';
import { UniqueSalesPool } from './UniqueSalesPool';
import { WorkflowEngine } from './WorkflowEngine';
import { CrossTenantAnalysis } from './system/CrossTenantAnalysis';

interface AdminViewManagerProps {
    isAllowed: (id: string) => boolean;
    setView: (view: string) => void;
    currentUser: User;
    sales: Sale[];
    users: User[];
    notes: Note[];
    health: SystemHealth;
    productConfig: ProductConfig;
    updateProductConfig: (config: ProductConfig) => void;
    systemConfig: SystemConfig;
    updateSystemConfig: (config: SystemConfig) => Promise<void>;
    updateUser: (id: string, data: Partial<User>) => Promise<void>;
    addUser: (data: User) => Promise<void>;
    importSales: (data: any[]) => Promise<number>;
    sendDirective: (data: { message: string, urgency: 'Routine' | 'Immediate' | 'Flash', senderName: string }) => Promise<void>;
    runDiagnostic: () => void;
    testUplink: () => Promise<boolean>;
    handleLedgerAction: (sale: Sale, action: string, payload?: any) => Promise<void>;
    handleBulkLedgerAction: (ids: string[], action: string, payload?: any) => Promise<void>;
    setToast: (toast: ToastMessage | null) => void;
    onGhostLogin: (userId: string) => void;
    showControls: boolean;
    setShowControls: (show: boolean) => void;
}

export const AdminViewManager: React.FC<AdminViewManagerProps> = ({
    isAllowed, setView, currentUser, sales, users, notes, health, productConfig, updateProductConfig,
    systemConfig, updateSystemConfig, updateUser, addUser, importSales, sendDirective,
    runDiagnostic, testUplink, handleLedgerAction, handleBulkLedgerAction, setToast,
    onGhostLogin, showControls, setShowControls
}) => {
    const [activeActionTab, setActiveActionTab] = React.useState('pipeline');
    const [activeMoneyTab, setActiveMoneyTab] = React.useState('payroll');
    const [activeOperationsTab, setActiveOperationsTab] = React.useState('overview');
    const [activeIntelligenceTab, setActiveIntelligenceTab] = React.useState('intel');
    const [activeLogisticsTab, setActiveLogisticsTab] = React.useState('catalog');
    const [activeComplianceTab, setActiveComplianceTab] = React.useState('audit');
    const [activeSystemAdminTab, setActiveSystemAdminTab] = React.useState('system');

    return (
        <>
            <TabContent value="action" className="w-full h-full flex flex-col flex-1 min-h-0">
                <Tabs value={activeActionTab} onValueChange={setActiveActionTab} className="w-full h-full flex flex-col flex-1 min-h-0" orientation="horizontal">
                    <TabList className="mb-2 shrink-0">
                        <TabTrigger value="pipeline" icon={<LayoutDashboard size={18} />}>Pipeline</TabTrigger>
                        <TabTrigger value="enrollment" icon={<UserPlus size={18} />}>Help a Customer</TabTrigger>
                        <TabTrigger value="retention" icon={<ShieldAlert size={18} />}>Save a Sale</TabTrigger>
                        <TabTrigger value="campaigns" icon={<Megaphone size={18} />}>Drip Campaigns</TabTrigger>
                        <TabTrigger value="comms" icon={<MessageSquare size={18} />}>Chat</TabTrigger>
                    </TabList>
                    
                    <TabContent value="pipeline" className="w-full h-full flex flex-col flex-1 min-h-0">
                        <PipelineBoard sales={sales} />
                    </TabContent>
                    <TabContent value="enrollment" className="w-full h-full flex flex-col flex-1 min-h-0">
                        <EnrollmentFormV2 onSuccess={() => { setView('money'); setActiveMoneyTab('ledger'); }} onCancel={() => { setActiveActionTab('pipeline'); }} />
                    </TabContent>
                    <TabContent value="retention" className="w-full h-full flex flex-col flex-1 min-h-0">
                        <RetentionView sales={sales} />
                    </TabContent>
                    <TabContent value="campaigns" className="w-full h-full flex flex-col flex-1 min-h-0">
                        <CampaignManager />
                    </TabContent>
                    <TabContent value="comms" className="w-full h-full flex flex-col flex-1 min-h-0">
                        <MessagingLayout />
                    </TabContent>
                </Tabs>
            </TabContent>

            <TabContent value="money" className="w-full h-full flex flex-col flex-1 min-h-0">
                <Tabs value={activeMoneyTab} onValueChange={setActiveMoneyTab} className="w-full h-full flex flex-col flex-1 min-h-0" orientation="horizontal">
                    <TabList className="mb-2 shrink-0">
                        <TabTrigger value="payroll" icon={<CircleDollarSign size={18} />}>Team Earnings</TabTrigger>
                        <TabTrigger value="ledger" icon={<Database size={18} />}>All Customers</TabTrigger>
                        <TabTrigger value="sales_pool" icon={<Users size={18} />}>Sales Pool</TabTrigger>
                    </TabList>
                    
                    <TabContent value="payroll" className="w-full h-full flex flex-col flex-1 min-h-0">
                        <PayrollManager />
                    </TabContent>
                    <TabContent value="ledger" className="w-full h-full flex flex-col flex-1 min-h-0">
                        <SalesLedger 
                            sales={sales} 
                            onAction={handleLedgerAction} 
                            onBulkAction={handleBulkLedgerAction}
                            onImport={async (data) => { 
                                try { 
                                    sfx.playConfirm(); 
                                    const count = await importSales(data); 
                                    sfx.playSuccess(); 
                                    return count; 
                                } catch (e) { 
                                    setToast({ title: 'Import Error', message: 'Import Failed', type: 'error' }); 
                                    sfx.playError(); 
                                    throw e;
                                } 
                            }} 
                            allowActions={true} 
                        />
                    </TabContent>
                    <TabContent value="sales_pool" className="w-full h-full flex flex-col flex-1 min-h-0">
                        <UniqueSalesPool />
                    </TabContent>
                </Tabs>
            </TabContent>

            <TabContent value="operations" className="w-full h-full flex flex-col flex-1 min-h-0">
                <Tabs value={activeOperationsTab} onValueChange={setActiveOperationsTab} className="w-full h-full flex flex-col flex-1 min-h-0" orientation="horizontal">
                    <TabList className="mb-2 shrink-0 bg-surface-main/80 backdrop-blur-sm border border-border-subtle p-1.5 rounded-xl gap-1">
                        <TabTrigger value="overview" icon={<Home size={18} />}>Company Home</TabTrigger>
                        <TabTrigger value="roster" icon={<Users size={18} />}>Manage Team</TabTrigger>
                        <TabTrigger value="workflows" icon={<GitMerge size={18} />}>Workflows</TabTrigger>
                    </TabList>
                    
                    <TabContent value="overview" className="w-full h-full flex flex-col flex-1 min-h-0">
                        <AdminDashboard 
                            onToggleControls={() => setShowControls(!showControls)} 
                            areControlsOpen={showControls} 
                            onBroadcast={async (msg, urgency) => { 
                                await sendDirective({ message: msg, urgency, senderName: currentUser?.name || 'Admin' }); 
                                sfx.playSubmit(); 
                                setToast({ title: 'Broadcast', message: 'Message sent to team', type: 'success' }); 
                            }} 
                            health={health} 
                            onRunDiagnostics={runDiagnostic} 
                            onTestUplink={testUplink}
                            onGhostLogin={onGhostLogin}
                        />
                    </TabContent>
                    <TabContent value="roster" className="w-full h-full flex flex-col flex-1 min-h-0 p-4">
                        <div className="w-full h-full bg-surface-main border border-border-subtle rounded-2xl p-6 shadow-sm overflow-y-auto custom-scrollbar">
                            <OperativeRoster users={users} sales={sales} onUpdateUser={updateUser} onAddUser={addUser} onGhostLogin={onGhostLogin}/>
                        </div>
                    </TabContent>
                    <TabContent value="workflows" className="w-full h-full flex flex-col flex-1 min-h-0 p-4">
                        <div className="w-full h-full bg-surface-main border border-border-subtle rounded-2xl p-6 shadow-sm overflow-y-auto custom-scrollbar">
                            <WorkflowEngine />
                        </div>
                    </TabContent>
                </Tabs>
            </TabContent>

            <TabContent value="intelligence" className="w-full h-full flex flex-col flex-1 min-h-0">
                <Tabs value={activeIntelligenceTab} onValueChange={setActiveIntelligenceTab} className="w-full h-full flex flex-col flex-1 min-h-0" orientation="horizontal">
                    <TabList className="mb-2 shrink-0 bg-surface-main/80 backdrop-blur-sm border border-border-subtle p-1.5 rounded-xl gap-1">
                        <TabTrigger value="intel" icon={<LineChart size={18} />}>Insights Matrix</TabTrigger>
                        <TabTrigger value="standings" icon={<Trophy size={18} />}>Agent Standings</TabTrigger>
                    </TabList>
                    
                    <TabContent value="intel" className="w-full h-full flex flex-col flex-1 min-h-0">
                        <div className="w-full h-full flex flex-col min-h-0">
                            <Tabs defaultValue="performance" orientation="horizontal" className="w-full h-full flex flex-col flex-1 min-h-0">
                                <div className="px-6 py-3 border-b border-border-subtle bg-surface-alt/50 shrink-0">
                                    <TabList className="w-full max-w-sm border-none bg-surface-main p-1 rounded-xl shadow-sm">
                                        <TabTrigger value="performance" icon={<Layers size={14}/>} className="rounded-lg py-1.5 text-xs">Performance Matrix</TabTrigger>
                                        <TabTrigger value="analytics" icon={<LineChart size={14}/>} className="rounded-lg py-1.5 text-xs">Data Analytics</TabTrigger>
                                    </TabList>
                                </div>
                                <TabContent value="performance" className="w-full h-full p-6 overflow-y-auto bg-surface-alt/30">
                                    <PerformanceCenter sales={sales} currentUser={currentUser!} attendance={[]} users={users} />
                                </TabContent>
                                <TabContent value="analytics" className="w-full h-full p-6 overflow-y-auto bg-surface-alt/30">
                                    <AdminAnalytics sales={sales} />
                                </TabContent>
                            </Tabs>
                        </div>
                    </TabContent>
                    <TabContent value="standings" className="w-full h-full flex flex-col flex-1 min-h-0 p-4">
                        <div className="w-full h-full bg-surface-main border border-border-subtle rounded-2xl p-6 shadow-sm overflow-y-auto custom-scrollbar">
                            <AgentLeaderboard currentUserName={currentUser?.name || 'Admin'} currentUserRole="admin" currentUserTeam={currentUser.team || 'All'} currentUserLevel={currentUser.level} />
                        </div>
                    </TabContent>
                </Tabs>
            </TabContent>

            <TabContent value="logistics" className="w-full h-full flex flex-col flex-1 min-h-0">
                <Tabs value={activeLogisticsTab} onValueChange={setActiveLogisticsTab} className="w-full h-full flex flex-col flex-1 min-h-0" orientation="horizontal">
                    <TabList className="mb-2 shrink-0 bg-surface-main/80 backdrop-blur-sm border border-border-subtle p-1.5 rounded-xl gap-1">
                        <TabTrigger value="catalog" icon={<Package size={18} />}>Products & SKUs</TabTrigger>
                        <TabTrigger value="scripts" icon={<FileText size={18} />}>Dialogues & Scripts</TabTrigger>
                    </TabList>
                    
                    <TabContent value="catalog" className="w-full h-full flex flex-col flex-1 min-h-0 p-4">
                        <div className="w-full h-full bg-surface-main border border-border-subtle rounded-2xl p-6 shadow-sm overflow-hidden">
                            <ProductManager configForm={productConfig} setConfigForm={updateProductConfig} onSave={updateProductConfig} />
                        </div>
                    </TabContent>
                    <TabContent value="scripts" className="w-full h-full flex flex-col flex-1 min-h-0 p-4">
                        <div className="w-full h-full bg-surface-main border border-border-subtle rounded-2xl p-6 shadow-sm overflow-y-auto custom-scrollbar">
                            <ScriptManager />
                        </div>
                    </TabContent>
                </Tabs>
            </TabContent>

            <TabContent value="compliance" className="w-full h-full flex flex-col flex-1 min-h-0">
                <Tabs value={activeComplianceTab} onValueChange={setActiveComplianceTab} className="w-full h-full flex flex-col flex-1 min-h-0" orientation="horizontal">
                    <TabList className="mb-2 shrink-0 bg-surface-main/80 backdrop-blur-sm border border-border-subtle p-1.5 rounded-xl gap-1">
                        <TabTrigger value="audit" icon={<Shield size={18} />}>Security & Audit</TabTrigger>
                    </TabList>
                    
                    <TabContent value="audit" className="w-full h-full flex flex-col flex-1 min-h-0 p-4">
                        <div className="w-full h-full bg-surface-main border border-border-subtle rounded-2xl p-6 shadow-sm overflow-y-auto custom-scrollbar">
                            <CRMAuditDashboard users={users} sales={sales} notes={notes} />
                        </div>
                    </TabContent>
                </Tabs>
            </TabContent>

            <TabContent value="system_admin" className="w-full h-full flex flex-col flex-1 min-h-0">
                <Tabs value={activeSystemAdminTab} onValueChange={setActiveSystemAdminTab} className="w-full h-full flex flex-col flex-1 min-h-0" orientation="horizontal">
                    <TabList className="mb-2 shrink-0 bg-surface-main/80 backdrop-blur-sm border border-border-subtle p-1.5 rounded-xl gap-1">
                        <TabTrigger value="system" icon={<Settings size={18} />}>Tenant Settings</TabTrigger>
                        <TabTrigger value="cross_tenant" icon={<Layers size={18} />}>Cross-Tenant Links</TabTrigger>
                        <TabTrigger value="nexus" icon={<Server size={18} />}>Nexus Console</TabTrigger>
                    </TabList>
                    
                    <TabContent value="system" className="w-full h-full flex flex-col flex-1 min-h-0">
                        <SystemConfigPanel config={systemConfig} onUpdate={updateSystemConfig} sales={sales} notes={notes} />
                    </TabContent>
                    <TabContent value="cross_tenant" className="w-full h-full flex flex-col flex-1 min-h-0 p-4">
                        <div className="w-full h-full bg-surface-main border border-border-subtle rounded-2xl p-6 shadow-sm overflow-y-auto custom-scrollbar">
                            <CrossTenantAnalysis />
                        </div>
                    </TabContent>
                    <TabContent value="nexus" className="w-full h-full flex flex-col flex-1 min-h-0 p-4">
                        <div className="w-full h-full bg-surface-main border border-border-subtle rounded-2xl p-6 shadow-sm overflow-y-auto custom-scrollbar">
                            <GodModePanel />
                        </div>
                    </TabContent>
                </Tabs>
            </TabContent>
        </>
    );
};

