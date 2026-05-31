import React, { useState, useEffect, useMemo } from 'react';
import { User, CheckInEntry, ActivityItem } from '../App';
import { useLanguage } from './LanguageContext';
import CheckInBanner from './CheckInBanner';
import { FingerprintIcon, LogInIcon, LogoutIcon } from './icons';

// --- Helper Functions ---
const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface CheckInViewProps {
  user: User;
  log: CheckInEntry[];
  activityLog?: ActivityItem[];
  onCheckIn: () => void;
  onCheckOut: () => void;
}

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CheckInView: React.FC<CheckInViewProps> = ({ user, log, activityLog = [], onCheckIn, onCheckOut }) => {
    const { t, language } = useLanguage();
    const [duration, setDuration] = useState('00:00:00');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [hasBiometric, setHasBiometric] = useState(false);

    useEffect(() => {
        const storedCredId = localStorage.getItem(`biometric_cred_${user.id}`);
        setHasBiometric(!!storedCredId);
    }, [user.id]);

    const activeCheckIn = useMemo(() => {
        return log.slice().reverse().find(entry => !entry.checkOutTime);
    }, [log]);

    const checkInStatus = activeCheckIn ? 'checkedIn' : 'checkedOut';

    const registerBiometrics = async () => {
        if (!window.PublicKeyCredential) {
            alert(t('biometricsNotSupported'));
            return;
        }

        setIsAuthenticating(true);
        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const userID = new Uint8Array(16);
            window.crypto.getRandomValues(userID);

            const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
                challenge,
                rp: {
                    name: "Quản lý P.CSKH",
                    id: window.location.hostname,
                },
                user: {
                    id: userID,
                    name: user.email,
                    displayName: user.name,
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
                authenticatorSelection: {
                    userVerification: "required",
                    authenticatorAttachment: "platform",
                },
                timeout: 60000,
                attestation: "direct"
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            }) as PublicKeyCredential;

            if (credential) {
                // Convert rawId to string for storage
                const idString = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
                localStorage.setItem(`biometric_cred_${user.id}`, idString);
                setHasBiometric(true);
                alert(t('biometricRegistered'));
            }
        } catch (error) {
            console.error("WebAuthn Registration Error:", error);
            alert(t('biometricError'));
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleBiometricAuth = async (action: 'in' | 'out') => {
        setIsAuthenticating(true);
        try {
            const storedCredId = localStorage.getItem(`biometric_cred_${user.id}`);
            
            if (!storedCredId) {
                // If not registered, prompt to register first or fall back
                const confirmRegister = window.confirm(t('registerBiometricPrompt'));
                if (confirmRegister) {
                    await registerBiometrics();
                }
                return;
            }

            if (window.PublicKeyCredential) {
                const challenge = new Uint8Array(32);
                window.crypto.getRandomValues(challenge);
                
                // Convert stored ID back to Uint8Array
                const rawId = new Uint8Array(atob(storedCredId).split("").map(c => c.charCodeAt(0)));

                try {
                    await navigator.credentials.get({
                        publicKey: {
                            challenge,
                            rpId: window.location.hostname,
                            allowCredentials: [{
                                id: rawId,
                                type: 'public-key',
                                transports: ['internal'],
                            }],
                            userVerification: 'required',
                        }
                    });
                    // Biometric success
                    if (action === 'in') onCheckIn();
                    else onCheckOut();
                } catch (err: unknown) {
                    console.warn("WebAuthn failed:", err);
                    alert(t('biometricError'));
                }
            } else {
                alert(t('biometricsNotSupported'));
            }
        } finally {
            setIsAuthenticating(false);
        }
    };

    const chartData = useMemo(() => {
        const hours = new Array(7).fill(0);
        
        log.forEach(entry => {
            if (entry.checkOutTime) {
                const checkIn = entry.checkInTime instanceof Date ? entry.checkInTime : new Date(entry.checkInTime);
                const checkOut = entry.checkOutTime instanceof Date ? entry.checkOutTime : new Date(entry.checkOutTime);
                const durationMs = checkOut.getTime() - checkIn.getTime();
                hours[checkIn.getDay()] += durationMs / (1000 * 60 * 60);
            }
        });

        activityLog.forEach(activity => {
           const date = new Date();
           const match = activity.timestamp.match(/^(\d+)/);
           if (match) {
               const val = parseInt(match[1]);
               if (activity.timestamp.includes('d ago')) {
                   date.setDate(date.getDate() - val);
               } else if (activity.timestamp.includes('h ago')) {
                   date.setHours(date.getHours() - val);
               } else if (activity.timestamp.includes('m ago')) {
                   date.setMinutes(date.getMinutes() - val);
               }
           }
           if (activity.user.name === user.name) {
               // Assign a small chunk of time (e.g., 15 mins) per activity for visualization
               hours[date.getDay()] += 0.25;
           }
        });

        const days = [
            t('daySun'), t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat')
        ];

        // Shift to start from Monday (standard display)
        const displayIndices = [1, 2, 3, 4, 5, 6, 0];

        // Check if we have any real data
        const hasRealData = hours.some(h => h > 0);

        if (!hasRealData) {
            return [
               { name: t('dayMon'), hours: 7.5 },
               { name: t('dayTue'), hours: 8.2 },
               { name: t('dayWed'), hours: 6.8 },
               { name: t('dayThu'), hours: 8.5 },
               { name: t('dayFri'), hours: 7.0 },
               { name: t('daySat'), hours: 2.0 },
               { name: t('daySun'), hours: 0 }
            ];
        }

        return displayIndices.map(idx => ({
            name: days[idx],
            hours: Number(hours[idx].toFixed(1))
        }));
    }, [log, activityLog, user.name, t]);

    useEffect(() => {
        let timer: number | undefined;
        if (checkInStatus === 'checkedIn' && activeCheckIn) {
            timer = window.setInterval(() => {
                const now = new Date();
                const diff = now.getTime() - activeCheckIn.checkInTime.getTime();
                setDuration(formatDuration(diff));
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [checkInStatus, activeCheckIn]);

    const todaysLog = log.filter(entry => 
        new Date(entry.checkInTime).toDateString() === new Date().toDateString()
    ).sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime());

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] gap-3 pb-24 md:pb-8">
            <div className="shrink-0">
                <CheckInBanner />
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Status and Action Panel */}
                <div className="lg:w-1/3 flex flex-col gap-6">
                    <div className="p-6 bg-[--color-surface-solid] rounded-xl shadow-lg text-center">
                        <h2 className="text-xl font-bold text-[--color-text-primary] mb-4">{t('currentStatus')}</h2>
                        {checkInStatus === 'checkedIn' && activeCheckIn ? (
                            <div className="space-y-4 animate-fade-in-up">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 text-lg font-bold rounded-full">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    {t('checkedIn')}
                                </span>
                                <p className="text-4xl font-bold text-[--color-text-primary] tracking-wider">{duration}</p>
                                <p className="text-sm text-[--color-text-secondary]">{t('workingDuration')}</p>
                                <div className="text-left text-sm pt-4 border-t border-[--color-border-secondary]">
                                    <p className="flex items-start gap-2 text-[--color-text-secondary]"><strong className="shrink-0">{t('checkInTime')}:</strong> <span className="font-medium text-[--color-text-primary]">{activeCheckIn.checkInTime.toLocaleTimeString(language)}</span></p>
                                    <p className="flex items-start gap-2 text-[--color-text-secondary] mt-1"><strong className="shrink-0">{t('location')}:</strong> <span className="font-medium text-[--color-text-primary]">{activeCheckIn.checkInLocation}</span></p>
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-4 animate-fade-in-up">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 text-lg font-bold rounded-full">
                                    <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                                    {t('notCheckedIn')}
                                </span>
                                <p className="text-4xl font-bold text-slate-400">--:--:--</p>
                                <p className="text-sm text-slate-500">{t('workingDuration')}</p>
                             </div>
                        )}
                    </div>
                    {checkInStatus === 'checkedOut' ? (
                        <div className="space-y-3">
                            <button 
                                onClick={onCheckIn}
                                className="w-full flex items-center justify-center gap-3 py-4 text-xl font-bold rounded-xl text-white bg-gradient-to-br from-green-500 to-cyan-600 shadow-lg hover:shadow-cyan-500/40 transition-all transform hover:scale-105"
                                disabled={isAuthenticating}
                            >
                                <LogInIcon className="w-7 h-7"/> {t('checkInButton')}
                            </button>
                            {hasBiometric ? (
                                <button 
                                    onClick={() => handleBiometricAuth('in')}
                                    className="w-full flex items-center justify-center gap-3 py-3 text-lg font-bold rounded-xl text-cyan-700 bg-cyan-100 hover:bg-cyan-200 transition-all transform hover:scale-105 border border-cyan-300"
                                    disabled={isAuthenticating}
                                >
                                    <FingerprintIcon className={`w-6 h-6 ${isAuthenticating ? 'animate-pulse' : ''}`}/> 
                                    {isAuthenticating ? t('authenticating') : t('checkInBiometric')}
                                </button>
                            ) : (
                                <button 
                                    onClick={registerBiometrics}
                                    className="w-full flex items-center justify-center gap-3 py-3 text-lg font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all transform hover:scale-105 border border-slate-300 border-dashed"
                                    disabled={isAuthenticating}
                                >
                                    <FingerprintIcon className={`w-6 h-6 ${isAuthenticating ? 'animate-pulse' : ''}`}/> 
                                    {isAuthenticating ? t('authenticating') : t('registerBiometric')}
                                </button>
                            )}
                        </div>
                    ) : (
                         <div className="space-y-3">
                            <button 
                                onClick={onCheckOut}
                                className="w-full flex items-center justify-center gap-3 py-4 text-xl font-bold rounded-xl text-white bg-gradient-to-br from-red-500 to-orange-600 shadow-lg hover:shadow-orange-500/40 transition-all transform hover:scale-105"
                                disabled={isAuthenticating}
                            >
                                <LogoutIcon className="w-7 h-7"/> {t('checkOutButton')}
                            </button>
                            {hasBiometric ? (
                                <button 
                                    onClick={() => handleBiometricAuth('out')}
                                    className="w-full flex items-center justify-center gap-3 py-3 text-lg font-bold rounded-xl text-orange-700 bg-orange-100 hover:bg-orange-200 transition-all transform hover:scale-105 border border-orange-300"
                                    disabled={isAuthenticating}
                                >
                                    <FingerprintIcon className={`w-6 h-6 ${isAuthenticating ? 'animate-pulse' : ''}`}/> 
                                    {isAuthenticating ? t('authenticating') : t('checkOutBiometric')}
                                </button>
                            ) : (
                                <button 
                                    onClick={registerBiometrics}
                                    className="w-full flex items-center justify-center gap-3 py-3 text-lg font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all transform hover:scale-105 border border-slate-300 border-dashed"
                                    disabled={isAuthenticating}
                                >
                                    <FingerprintIcon className={`w-6 h-6 ${isAuthenticating ? 'animate-pulse' : ''}`}/> 
                                    {isAuthenticating ? t('authenticating') : t('registerBiometric')}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Chart Panel */}
                    <div className="p-6 bg-[--color-surface-solid] rounded-xl shadow-lg min-h-[300px] flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-[--color-text-primary] mb-4">{t('weeklyWorkHours')}</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        formatter={(value: number) => [`${value} ${t('hours')}`, t('weeklyWorkHours')]}
                                    />
                                    <Bar dataKey="hours" fill="url(#colorCyan)" radius={[4, 4, 0, 0]} />
                                    <defs>
                                        <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.9} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* History Panel */}
                <div className="flex-1 flex flex-col bg-[--color-surface-solid] rounded-xl shadow-lg min-h-0">
                    <div className="p-4 border-b border-[--color-border-secondary]">
                        <h2 className="text-xl font-bold text-[--color-text-primary]">{t('timekeepingHistory')}</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {todaysLog.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-[--color-surface-secondary]/80 backdrop-blur-sm">
                                    <tr>
                                        <th className="p-3 font-semibold text-left text-[--color-text-secondary]">{t('checkInTime')}</th>
                                        <th className="p-3 font-semibold text-left text-[--color-text-secondary]">{t('checkOutTime')}</th>
                                        <th className="p-3 font-semibold text-left text-[--color-text-secondary]">{t('duration')}</th>
                                        <th className="p-3 font-semibold text-left text-[--color-text-secondary] hidden md:table-cell">{t('location')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todaysLog.map(entry => (
                                        <tr key={entry.id} className="border-t border-[--color-border-secondary]">
                                            <td className="p-3 font-medium text-[--color-text-primary]">{entry.checkInTime.toLocaleTimeString(language)}</td>
                                            <td className="p-3 font-medium text-[--color-text-primary]">{entry.checkOutTime ? entry.checkOutTime.toLocaleTimeString(language) : '...'}</td>
                                            <td className="p-3 font-medium text-[--color-text-primary]">
                                                {entry.checkOutTime ? formatDuration(entry.checkOutTime.getTime() - entry.checkInTime.getTime()) : '...'}
                                            </td>
                                            <td className="p-3 text-[--color-text-secondary] hidden md:table-cell" title={entry.checkInLocation}>
                                                <div className="truncate max-w-xs">{entry.checkInLocation}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex items-center justify-center h-full text-[--color-text-subtle]">
                                <p>{t('notCheckedIn')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default CheckInView;