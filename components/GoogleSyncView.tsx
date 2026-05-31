import React from 'react';
import { User, ServiceState, ServiceName } from '../App';
import GoogleSyncBanner from './GoogleSyncBanner';
import { useLanguage } from './LanguageContext';
import { GoogleIcon, SettingsIcon } from './icons';

// --- Sub-Components ---
const ToggleSwitch: React.FC<{
  id: string;
  isEnabled: boolean;
  onToggle: () => void;
}> = ({ id, isEnabled, onToggle }) => {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer">
      <div className="relative">
        <input type="checkbox" id={id} className="sr-only" checked={isEnabled} onChange={onToggle} />
        <div className={`block w-12 h-6 rounded-full transition-colors ${isEnabled ? 'bg-[--color-accent-500]' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
      </div>
    </label>
  );
};

const ServiceCard: React.FC<{
  service: ServiceState;
  onToggleSync: (id: ServiceName) => void;
  onToggleConnection: (id: ServiceName) => void;
}> = ({ service, onToggleSync, onToggleConnection }) => {
    const { t } = useLanguage();
    return (
        <div className="p-5 bg-[--color-surface-secondary] rounded-xl ring-1 ring-[--color-border-primary] shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[--color-surface-solid] rounded-lg">{React.cloneElement(service.icon, { className: "w-6 h-6 text-[--color-accent-600]" })}</div>
                    <h3 className="font-bold text-lg text-[--color-text-primary]">{service.name}</h3>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${service.isConnected ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                    {service.isConnected ? t('connected') : t('notConnected')}
                </span>
            </div>
            <div className="mt-4 pt-4 border-t border-[--color-border-secondary] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ToggleSwitch id={`toggle-${service.id}`} isEnabled={service.isSyncEnabled && service.isConnected} onToggle={() => service.isConnected && onToggleSync(service.id)} />
                    <span className={`text-sm font-medium ${service.isConnected ? 'text-[--color-text-secondary]' : 'text-slate-400'}`}>{t('sync')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button disabled={!service.isConnected} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"><SettingsIcon className="w-5 h-5 text-[--color-text-subtle]"/></button>
                    <button
                        onClick={() => onToggleConnection(service.id)}
                        className={`text-sm font-semibold py-1.5 px-4 rounded-lg transition-colors ${service.isConnected ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                        {service.isConnected ? t('disconnect') : t('connect')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main View ---

interface AccountSyncViewProps {
    user: User;
    services: ServiceState[];
    onToggleSync: (id: ServiceName) => void;
    onToggleConnection: (id: ServiceName) => void;
}

const AccountSyncView: React.FC<AccountSyncViewProps> = ({ user, services, onToggleSync, onToggleConnection }) => {
    const { t } = useLanguage();

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-6 gap-6">
            <div className="shrink-0">
                <GoogleSyncBanner />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pr-2 -mr-2">
                 {/* Main Account Connection */}
                 <div className="mb-8 p-6 bg-[--color-surface-secondary] rounded-xl ring-1 ring-[--color-border-primary] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <GoogleIcon className="w-12 h-12 shrink-0"/>
                        <div>
                            <h2 className="text-xl font-bold text-[--color-text-primary]">{t('connectGoogleAccount')}</h2>
                            <p className="text-sm text-[--color-text-secondary]">{t('connectedAs')}: <span className="font-semibold">{user.email}</span></p>
                        </div>
                    </div>
                    <button className="w-full sm:w-auto py-2 px-5 rounded-lg text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition-colors">
                        {t('disconnect')}
                    </button>
                 </div>

                 {/* Services Grid */}
                <h2 className="text-2xl font-bold text-[--color-text-primary] mb-4">{t('syncStatus')}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {services.map(service => (
                        <ServiceCard key={service.id} service={service} onToggleSync={onToggleSync} onToggleConnection={onToggleConnection} />
                    ))}
                </div>
            </div>
        </main>
    );
};

export default AccountSyncView;