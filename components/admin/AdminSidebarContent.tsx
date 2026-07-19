import React from 'react';
import { 
    Zap, Banknote, Home, LineChart, 
    Package, Shield, Settings 
} from 'lucide-react';
import { TabTrigger, TabList } from '../ui/Tabs';

interface AdminSidebarContentProps {
    isAllowed: (id: string) => boolean;
}

export const AdminSidebarContent: React.FC<AdminSidebarContentProps> = ({ isAllowed }) => (
    <div className="pb-4 pt-2">
        <TabList isCollapsed={true} className="flex flex-col gap-2 w-full border-none mb-3 px-0 items-center">
            {isAllowed('action') && (
                <TabTrigger value="action" icon={<Zap size={20}/>}>Action Hub</TabTrigger>
            )}
            {isAllowed('money') && (
                <TabTrigger value="money" icon={<Banknote size={20}/>}>Incentive Hub</TabTrigger>
            )}
            {isAllowed('operations') && (
                <TabTrigger value="operations" icon={<Home size={20}/>}>Operations Dept</TabTrigger>
            )}
            {isAllowed('intelligence') && (
                <TabTrigger value="intelligence" icon={<LineChart size={20}/>}>Intelligence Dept</TabTrigger>
            )}
            {isAllowed('logistics') && (
                <TabTrigger value="logistics" icon={<Package size={20}/>}>Logistics Dept</TabTrigger>
            )}
            {isAllowed('compliance') && (
                <TabTrigger value="compliance" icon={<Shield size={20}/>}>Compliance Dept</TabTrigger>
            )}
            {isAllowed('system_admin') && (
                <TabTrigger value="system_admin" icon={<Settings size={20}/>}>System Admin</TabTrigger>
            )}
        </TabList>
    </div>
);

