
import { 
  Zap, Banknote, Settings
} from 'lucide-react';
import { TabList, TabTrigger } from '../../components/ui/Tabs';

interface AgentSidebarProps {
  isAllowed: (id: string) => boolean;
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({ isAllowed }) => {
  return (
    <TabList isCollapsed={true} className="flex flex-col gap-2 w-full border-none mt-2 pb-2 px-0 items-center">
      {isAllowed('action') && <TabTrigger value="action" icon={<Zap size={22}/>}>Action</TabTrigger>}
      {isAllowed('money') && <TabTrigger value="money" icon={<Banknote size={22}/>}>Money</TabTrigger>}
      <TabTrigger value="settings" icon={<Settings size={22}/>}>Settings</TabTrigger>
    </TabList>
  );
};


