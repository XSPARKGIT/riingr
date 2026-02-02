import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User } from '../types';
import { 
    SettingsIcon, 
    ArrowLeftIcon,
    MessengerIcon,
    TrashIcon,
    MoreIcon,
    CheckIcon,
    StarIcon,
    MessageIcon,
    GiftIcon,
    HelpIcon,
    CallIcon,
    CopyIcon,
    UsersIcon,
    CloseIcon,
    StickerIcon,
    FolderIcon,
    StoreIcon,
} from '../constants';
import { updateUserProfile } from '../services/firestoreService';

interface SettingsSidebarProps {
    user: User;
    activeCategory: string | null;
    onSelectCategory: (category: string) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ user, activeCategory, onSelectCategory }) => {
    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0 pt-safe">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[17px] font-black text-slate-800 tracking-tight">Settings</h2>
                    <button className="text-[13px] font-bold text-green-600 hover:opacity-70 transition-opacity">Edit</button>
                </div>
                
                <div className="relative mb-4">
                    <input type="text" placeholder="Search" className="w-full bg-slate-100 border-none rounded-xl py-2 px-10 text-sm outline-none" />
                    <div className="absolute left-3 top-2.5 text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div 
                    onClick={() => onSelectCategory('profile')}
                    className={`flex items-center p-2 rounded-2xl border transition-all cursor-pointer group ${
                        activeCategory === 'profile' ? 'bg-green-50 border-green-200 ring-2 ring-green-100' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                >
                    <img src={user.avatar} className="h-12 w-12 rounded-full mr-3 border-2 border-white shadow-sm" alt="" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{user.name}</p>
                        <p className="text-[11px] font-bold text-slate-400">{user.phone || '+27 11 222 3333'}</p>
                    </div>
                    <svg className={`h-4 w-4 transition-colors ${activeCategory === 'profile' ? 'text-green-500' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2 pb-20 min-h-0">
                <MenuSection title="Account">
                    <MenuItem 
                        icon={<MessengerIcon className="h-5 w-5 text-green-500" />} 
                        label="Set Profile Color" 
                        onClick={() => onSelectCategory('profile-color')}
                        active={activeCategory === 'profile-color'}
                    />
                    <MenuItem icon={<MessengerIcon className="h-5 w-5 text-green-500" />} label="Add Account" />
                    <MenuItem icon={<SettingsIcon className="h-5 w-5 text-green-500" />} label="My Profile" chevron onClick={() => onSelectCategory('profile')} active={activeCategory === 'profile'} />
                </MenuSection>

                <MenuSection title="Settings">
                    <MenuItem 
                        icon={<SettingsIcon className="h-5 w-5 text-white" />} 
                        label="General" 
                        iconBg="bg-slate-400" 
                        chevron 
                        onClick={() => onSelectCategory('general')}
                        active={activeCategory === 'general'}
                    />
                    <MenuItem 
                        icon={<MessengerIcon className="h-5 w-5 text-white" />} 
                        label="Notifications" 
                        iconBg="bg-red-500" 
                        badge="1" 
                        chevron 
                        onClick={() => onSelectCategory('notifications')}
                        active={activeCategory === 'notifications'}
                    />
                    <MenuItem 
                        icon={<SettingsIcon className="h-5 w-5 text-white" />} 
                        label="Privacy and Security" 
                        iconBg="bg-blue-500" 
                        chevron 
                        onClick={() => onSelectCategory('privacy')}
                        active={activeCategory === 'privacy'}
                    />
                    <MenuItem 
                        icon={<SettingsIcon className="h-5 w-5 text-white" />} 
                        label="Data and Storage" 
                        iconBg="bg-green-500" 
                        chevron 
                        onClick={() => onSelectCategory('data-storage')}
                        active={activeCategory === 'data-storage'}
                    />
                    <MenuItem 
                        icon={<SettingsIcon className="h-5 w-5 text-white" />} 
                        label="Appearance" 
                        iconBg="bg-sky-400" 
                        chevron 
                        onClick={() => onSelectCategory('appearance')}
                        active={activeCategory === 'appearance'}
                    />
                    <MenuItem 
                        icon={<SettingsIcon className="h-5 w-5 text-white" />} 
                        label="Language" 
                        value="English" 
                        iconBg="bg-purple-500" 
                        chevron 
                        onClick={() => onSelectCategory('language')}
                        active={activeCategory === 'language'}
                    />
                    <MenuItem 
                        icon={<StickerIcon className="h-5 w-5 text-white" />} 
                        label="Stickers and Emoji" 
                        iconBg="bg-orange-500" 
                        chevron 
                        onClick={() => onSelectCategory('stickers-emoji')}
                        active={activeCategory === 'stickers-emoji'}
                    />
                    <MenuItem 
                        icon={<FolderIcon className="h-5 w-5 text-white" />} 
                        label="Chat Folders" 
                        iconBg="bg-pink-400" 
                        chevron 
                        onClick={() => onSelectCategory('chat-folders')}
                        active={activeCategory === 'chat-folders'}
                    />
                </MenuSection>

                <MenuSection title="Premium & Services">
                    <MenuItem 
                        icon={<StarIcon className="h-4 w-4 text-white" />} 
                        label="Ringr Premium" 
                        iconBg="bg-indigo-500" 
                        chevron 
                        onClick={() => onSelectCategory('premium')}
                        active={activeCategory === 'premium'}
                    />
                    <MenuItem 
                        icon={<StarIcon className="h-4 w-4 text-white" />} 
                        label="My Stars" 
                        iconBg="bg-yellow-400" 
                        chevron 
                        onClick={() => onSelectCategory('stars')}
                        active={activeCategory === 'stars'}
                    />
                    <MenuItem 
                        icon={<StoreIcon className="h-5 w-5 text-white" />} 
                        label="Ringr Business" 
                        iconBg="bg-pink-500" 
                        chevron 
                        onClick={() => onSelectCategory('business')}
                        active={activeCategory === 'business'}
                    />
                    <MenuItem 
                        icon={<GiftIcon className="h-5 w-5 text-white" />} 
                        label="Send a Gift" 
                        iconBg="bg-green-400" 
                        chevron 
                        onClick={() => onSelectCategory('gift')}
                        active={activeCategory === 'gift'}
                    />
                </MenuSection>

                <MenuSection title="Support">
                    <MenuItem 
                        icon={<HelpIcon className="h-5 w-5 text-white" />} 
                        label="Ringr FAQ" 
                        iconBg="bg-blue-400" 
                        chevron 
                    />
                    <MenuItem 
                        icon={<MessageIcon className="h-5 w-5 text-white" />} 
                        label="Ask a Question" 
                        iconBg="bg-slate-400" 
                        chevron 
                        onClick={() => onSelectCategory('support-popup')}
                    />
                </MenuSection>
            </div>
        </div>
    );
};

export const EditProfileSection: React.FC<{
    user: User;
    onBack: () => void;
    onLogout: () => void;
    onProfileUpdate?: () => Promise<void>;
}> = ({ user, onBack, onLogout, onProfileUpdate }) => {
    const nameParts = user.name ? user.name.split(' ') : [''];
    const [firstName, setFirstName] = useState(nameParts[0] || '');
    const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
    const [bio, setBio] = useState(user.status || 'A few words about you');
    const [isSaving, setIsSaving] = useState(false);
    
    // Use ref to store original values (doesn't trigger re-renders)
    const originalValuesRef = useRef({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        bio: user.status || 'A few words about you'
    });

    // Check if any changes have been made
    const hasChanges = useMemo(() => {
        return firstName !== originalValuesRef.current.firstName || 
               lastName !== originalValuesRef.current.lastName || 
               bio !== originalValuesRef.current.bio;
    }, [firstName, lastName, bio]);

    // Save changes to Firestore
    const handleSave = async () => {
        if (!hasChanges || isSaving) return;
        
        console.log('💾 [EditProfile] Saving profile changes...');
        console.log('User ID:', user.id);
        console.log('Current user object:', user);
        
        setIsSaving(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
            const updates = {
                name: fullName,
                status: bio.trim(),
            };
            
            console.log('📤 [EditProfile] Sending updates:', updates);
            
            await updateUserProfile(user.id, updates);
            
            console.log('✅ [EditProfile] Profile updated successfully');
            
            // Refresh user profile in parent component
            if (onProfileUpdate) {
                await onProfileUpdate();
            }
            
            // Update original values after successful save
            originalValuesRef.current = {
                firstName,
                lastName,
                bio
            };
            
            // Show success toast
            const toast = document.createElement('div');
            toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl z-[9999] animate-in slide-in-from-top-2 duration-300';
            toast.textContent = 'Profile updated successfully! ✓';
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
            
            // Navigate back after a short delay
            setTimeout(() => onBack(), 500);
        } catch (error) {
            console.error('Error saving profile:', error);
            
            // Show error toast
            const toast = document.createElement('div');
            toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl z-[9999] animate-in slide-in-from-top-2 duration-300';
            toast.textContent = 'Failed to update profile. Please try again.';
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        } finally {
            setIsSaving(false);
        }
    };

    // Update form fields when user prop changes
    useEffect(() => {
        const nameParts = user.name ? user.name.split(' ') : [''];
        const newFirstName = nameParts[0] || '';
        const newLastName = nameParts.slice(1).join(' ') || '';
        const newBio = user.status || 'A few words about you';
        
        setFirstName(newFirstName);
        setLastName(newLastName);
        setBio(newBio);
        
        // Update ref without causing re-render
        originalValuesRef.current = {
            firstName: newFirstName,
            lastName: newLastName,
            bio: newBio
        };
    }, [user.id, user.name, user.status]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden min-h-0">
            <div className="min-h-16 px-6 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
                <button onClick={onBack} className="flex items-center text-green-600 font-bold hover:opacity-70 transition-all text-[15px]">
                    <ArrowLeftIcon className="h-6 w-6 mr-1" />
                    <span>Back</span>
                </button>
                <h3 className="text-[15px] font-black text-slate-800 leading-tight">Edit Profile</h3>
                <button 
                    onClick={hasChanges ? handleSave : onBack}
                    disabled={isSaving}
                    className={`font-black text-[15px] transition-all ${
                        hasChanges 
                            ? 'bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 shadow-md disabled:opacity-50' 
                            : 'text-green-600 hover:opacity-70'
                    }`}
                >
                    {isSaving ? 'Saving...' : hasChanges ? 'Save' : 'Done'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto touch-pan-y p-6 md:p-10 pb-20 min-h-0">
                <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-center mb-10">
                        <div className="relative group cursor-pointer shadow-2xl rounded-full">
                            <img src={user.avatar} className="h-28 w-28 rounded-full border-4 border-white object-cover" alt="" />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="relative flex items-center bg-slate-100 rounded-2xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-green-500 focus-within:bg-white transition-all overflow-hidden">
                            <input 
                                type="text" 
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First Name"
                                className="flex-1 bg-transparent border-none py-2 text-[15px] font-bold focus:outline-none text-slate-800"
                            />
                        </div>
                        <div className="relative flex items-center bg-slate-100 rounded-2xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-green-500 focus-within:bg-white transition-all overflow-hidden">
                            <input 
                                type="text" 
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last Name"
                                className="flex-1 bg-transparent border-none py-2 text-[15px] font-bold focus:outline-none text-slate-800"
                            />
                        </div>
                        <p className="px-5 text-[12px] text-slate-400 font-semibold tracking-wide">Enter your name and add a profile photo.</p>
                    </div>

                    <div>
                        <h4 className="px-5 mb-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">Bio</h4>
                        <div className="relative flex items-center bg-slate-100 rounded-2xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-green-500 focus-within:bg-white transition-all overflow-hidden">
                            <textarea 
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={2}
                                className="flex-1 bg-transparent border-none py-2 text-[15px] font-bold focus:outline-none resize-none text-slate-800"
                            />
                        </div>
                        <p className="px-5 mt-2 text-[12px] text-slate-400 font-semibold leading-relaxed">Any details such as age, occupation or city.<br/>Example: 23 y.o. designer from San Francisco</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                        <SettingDetailRow label="Birthday" value={user.birthday || "Add"} chevron />
                        <SettingDetailRow label="Username" value={user.username || (user.email ? user.email.split('@')[0] : '')} chevron />
                        <SettingDetailRow label="Email" value={user.email || ''} chevron />
                        <SettingDetailRow label="Change Number" value={user.phone || '+27 11 222 3333'} chevron />
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 mb-10">
                        <button className="w-full px-5 py-4 text-left text-[15px] font-black text-green-600 hover:bg-green-50 transition-colors">Add Account</button>
                        <button
                            type="button"
                            onClick={onLogout}
                            className="w-full px-5 py-4 text-left text-[15px] font-black text-red-500 hover:bg-red-50 transition-colors"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const GeneralSettingsView: React.FC<{onBack: () => void}> = ({ onBack }) => (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden min-h-0">
        <div className="min-h-16 px-6 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
            <button onClick={onBack} className="flex items-center text-green-600 font-bold hover:opacity-70 transition-all text-[15px]">
                <ArrowLeftIcon className="h-6 w-6 mr-1" />
                <span>Back</span>
            </button>
            <h3 className="text-[15px] font-black text-slate-800 leading-tight">General Settings</h3>
            <button onClick={onBack} className="text-green-600 font-black text-[15px] hover:opacity-70">Done</button>
        </div>

        <div className="flex-1 overflow-y-auto touch-pan-y p-6 md:p-10 pb-20 space-y-8 min-h-0">
            <div className="max-w-xl mx-auto space-y-8">
                <div>
                    <h4 className="px-5 mb-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">Emoji</h4>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                        <ToggleRow label="Show Sticker Sidebar" defaultChecked={false} />
                        <ToggleRow label="Replace Emoji Automatically" defaultChecked={true} />
                        <ToggleRow label="Large Emoji" defaultChecked={true} />
                    </div>
                </div>
                <div>
                    <h4 className="px-5 mb-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">Interface</h4>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                        <ToggleRow label="Show Calls Tab" defaultChecked={true} />
                        <ToggleRow label="Show Icon in Menu Bar" defaultChecked={true} />
                        <ToggleRow label="Preview Chats" defaultChecked={false} />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const NotificationsSettingsView: React.FC<{onBack: () => void}> = ({ onBack }) => (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden min-h-0">
        <div className="min-h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
            <button onClick={onBack} className="flex items-center text-green-600 font-bold"><ArrowLeftIcon className="h-6 w-6 mr-1" /><span>Back</span></button>
            <h3 className="text-[15px] font-black text-slate-800">Notifications</h3>
            <button onClick={onBack} className="text-green-600 font-black">Done</button>
        </div>
        <div className="flex-1 overflow-y-auto touch-pan-y p-6 pb-20 min-h-0">
            <div className="max-w-xl mx-auto space-y-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                    <ToggleRow label="Notifications" defaultChecked={true} />
                    <ToggleRow label="Message Preview" defaultChecked={true} />
                    <SettingDetailRow label="Notification Tone" value="Default" chevron />
                </div>
            </div>
        </div>
    </div>
);

export const PrivacySettingsView: React.FC<{onBack: () => void}> = ({ onBack }) => (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden min-h-0">
        <div className="min-h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
            <button onClick={onBack} className="flex items-center text-green-600 font-bold"><ArrowLeftIcon className="h-6 w-6 mr-1" /><span>Back</span></button>
            <h3 className="text-[15px] font-black text-slate-800">Privacy and Security</h3>
            <button onClick={onBack} className="text-green-600 font-black">Done</button>
        </div>
        <div className="flex-1 overflow-y-auto touch-pan-y p-6 pb-20 min-h-0">
            <div className="max-w-xl mx-auto space-y-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                    <SettingDetailRow label="Phone Number" value="My Contacts" chevron />
                    <SettingDetailRow label="Last Seen & Online" value="Nobody" chevron />
                    <SettingDetailRow label="Blocked Users" value="1" chevron />
                </div>
            </div>
        </div>
    </div>
);

export const DataStorageSettingsView: React.FC<{onBack: () => void}> = ({ onBack }) => (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden min-h-0">
        <div className="min-h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
            <button onClick={onBack} className="flex items-center text-green-600 font-bold"><ArrowLeftIcon className="h-6 w-6 mr-1" /><span>Back</span></button>
            <h3 className="text-[15px] font-black text-slate-800">Data and Storage</h3>
            <button onClick={onBack} className="text-green-600 font-black">Done</button>
        </div>
        <div className="flex-1 overflow-y-auto touch-pan-y p-6 pb-20 min-h-0">
            <div className="max-w-xl mx-auto space-y-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                    <SettingDetailRow label="Storage Usage" value="7.5 GB" chevron />
                    <SettingDetailRow label="Data Usage" value="8.2 GB" chevron />
                </div>
            </div>
        </div>
    </div>
);

export const AppearanceSettingsView: React.FC<{onBack: () => void}> = ({ onBack }) => {
    const themes = [
        { name: 'Day Classic', bg: 'bg-[#e7ebee]' },
        { name: 'Day', bg: 'bg-[#f4f4f4]' },
        { name: 'Night Accent', bg: 'bg-[#1c242f]', isDark: true },
        { name: 'System', bg: 'bg-slate-200' },
    ];
    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden min-h-0">
            <div className="min-h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
                <button onClick={onBack} className="flex items-center text-green-600 font-bold"><ArrowLeftIcon className="h-6 w-6 mr-1" /><span>Back</span></button>
                <h3 className="text-[15px] font-black text-slate-800">Appearance</h3>
                <button onClick={onBack} className="text-green-600 font-black">Done</button>
            </div>
            <div className="flex-1 overflow-y-auto touch-pan-y p-6 pb-20 min-h-0">
                <div className="max-w-xl mx-auto grid grid-cols-2 gap-4">
                    {themes.map(t => (
                        <div key={t.name} className="flex flex-col items-center space-y-2">
                            <div className={`w-full aspect-video ${t.bg} rounded-xl border border-slate-200 shadow-sm`} />
                            <span className="text-xs font-bold text-slate-500 uppercase">{t.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const LanguageSettingsView: React.FC<{onBack: () => void}> = ({ onBack }) => (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden min-h-0">
        <div className="min-h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
            <button onClick={onBack} className="flex items-center text-green-600 font-bold"><ArrowLeftIcon className="h-6 w-6 mr-1" /><span>Back</span></button>
            <h3 className="text-[15px] font-black text-slate-800">Language</h3>
            <button onClick={onBack} className="text-green-600 font-black">Done</button>
        </div>
        <div className="flex-1 overflow-y-auto touch-pan-y p-6 pb-20 min-h-0">
            <div className="max-w-xl mx-auto">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                    <SelectionRow label="English" checked={true} />
                    <SelectionRow label="Belarusian" checked={false} />
                    <SelectionRow label="German" checked={false} />
                </div>
            </div>
        </div>
    </div>
);

export const StickersEmojiSettingsView: React.FC<{onBack: () => void}> = ({ onBack }) => (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden min-h-0">
        <div className="min-h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
            <button onClick={onBack} className="flex items-center text-green-600 font-bold"><ArrowLeftIcon className="h-6 w-6 mr-1" /><span>Back</span></button>
            <h3 className="text-[15px] font-black text-slate-800">Stickers and Emoji</h3>
            <button onClick={onBack} className="text-green-600 font-black">Done</button>
        </div>
        <div className="flex-1 overflow-y-auto touch-pan-y p-6 pb-20 min-h-0">
            <div className="max-w-xl mx-auto">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                    <ToggleRow label="Suggest Stickers by Emoji" defaultChecked={true} />
                    <ToggleRow label="Loop Animated Stickers" defaultChecked={true} />
                </div>
            </div>
        </div>
    </div>
);

export const ChatFoldersSettingsView: React.FC<{onBack: () => void}> = ({ onBack }) => (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden min-h-0">
        <div className="min-h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
            <button onClick={onBack} className="flex items-center text-green-600 font-bold"><ArrowLeftIcon className="h-6 w-6 mr-1" /><span>Back</span></button>
            <h3 className="text-[15px] font-black text-slate-800">Chat Folders</h3>
            <button onClick={onBack} className="text-green-600 font-black">Done</button>
        </div>
        <div className="flex-1 overflow-y-auto touch-pan-y p-6 flex flex-col items-center pb-20 min-h-0">
             <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-sm w-full shadow-sm mt-10">
                <div className="h-16 w-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FolderIcon className="h-8 w-8 text-pink-500" />
                </div>
                <p className="text-sm font-bold text-slate-500">Create folders for different groups of chats and quickly switch between them.</p>
                <button className="mt-6 text-green-600 font-black text-sm uppercase hover:underline">Add Custom Folder</button>
             </div>
        </div>
    </div>
);

export const PremiumSettingsView: React.FC<{onBack: () => void}> = ({ onBack }) => {
    const features = [
        { icon: '⭐', title: 'Double Limits', description: 'Up to 100 folders, 10 pinned chats, 20 public links, 4 accounts and more.' },
        { icon: '🎙️', title: 'Voice-to-Text', description: 'Convert any voice message into text by tapping a button next to it.' },
        { icon: '🚀', title: 'Faster Download', description: 'No more limits on the speed of media and document downloads.' },
        { icon: '🌍', title: 'Real-time Translation', description: 'Translate entire chats in real-time as you scroll.' },
        { icon: '👾', title: 'Animated Emoji', description: 'Use exclusive animated emoji in your messages and reactions.' },
        { icon: '📁', title: 'Advanced Chat Management', description: 'Tools to set the default folder, auto-archive and hide new chats.' },
        { icon: '💎', title: 'Premium Badge', description: 'A star next to your name showing you subscribe to Ringr Premium.' },
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden min-h-0">
            <div className="min-h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
                <button onClick={onBack} className="flex items-center text-indigo-600 font-bold hover:opacity-70 transition-all text-[15px]">
                    <ArrowLeftIcon className="h-6 w-6 mr-1" />
                    <span>Back</span>
                </button>
                <h3 className="text-[15px] font-black text-slate-800 leading-tight tracking-tight">Ringr Premium</h3>
                <div className="w-12" />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-12 pb-20 touch-pan-y min-h-0">
                <div className="max-w-2xl mx-auto px-6 flex flex-col items-center">
                    <div className="h-24 w-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center mb-8 animate-bounce transition-transform duration-1000 shrink-0">
                         <StarIcon className="h-12 w-12 text-white" />
                    </div>
                    
                    <h1 className="text-3xl font-black text-slate-800 text-center mb-4 tracking-tighter shrink-0">Ringr Premium</h1>
                    <p className="text-[16px] font-bold text-slate-400 text-center mb-12 max-w-md leading-relaxed shrink-0">
                        Go beyond the limits and unlock exclusive features with a Premium subscription.
                    </p>

                    <div className="w-full space-y-1 bg-slate-50 rounded-3xl p-2 border border-slate-100 mb-8">
                        {features.map((f, i) => (
                            <div key={i} className="flex items-start p-4 hover:bg-white rounded-2xl transition-all cursor-default group border border-transparent hover:border-slate-100 hover:shadow-sm">
                                <div className="h-10 w-10 flex-shrink-0 bg-white shadow-sm rounded-xl flex items-center justify-center text-xl mr-4 group-hover:scale-110 transition-transform">
                                    {f.icon}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[15px] font-black text-slate-800 mb-0.5">{f.title}</h4>
                                    <p className="text-[13px] font-bold text-slate-400 leading-snug">{f.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="w-full max-w-sm shrink-0 mb-8">
                        <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[16px] shadow-xl shadow-indigo-200 transition-all active:scale-95">
                            Subscribe for $4.99 / month
                        </button>
                        <p className="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Cancel anytime in system settings.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const StarsSettingsView: React.FC<{onBack: () => void}> = ({ onBack }) => {
    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden text-slate-800 min-h-0">
            <div className="min-h-16 px-6 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
                <button onClick={onBack} className="flex items-center text-green-600 font-bold hover:opacity-70 transition-all text-[15px]">
                    <ArrowLeftIcon className="h-6 w-6 mr-1" />
                    <span>Back</span>
                </button>
                <h3 className="text-[15px] font-black leading-tight tracking-tight uppercase">My Stars</h3>
                <div className="w-12" />
            </div>

            <div className="flex-1 overflow-y-auto touch-pan-y py-12 pb-20 min-h-0">
                <div className="max-w-xl mx-auto px-6 flex flex-col items-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="relative h-32 w-32 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full shadow-2xl flex items-center justify-center border-4 border-white shrink-0">
                         <StarIcon className="h-20 w-20 text-white drop-shadow-xl" />
                    </div>

                    <div className="text-center space-y-3 shrink-0">
                        <p className="text-[15px] font-bold text-slate-500 leading-relaxed max-w-sm mx-auto">
                            Buy Stars to unlock content and services in mini apps on Ringr.
                        </p>
                    </div>

                    <div className="w-full">
                        <h4 className="px-5 mb-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">Rewards Overview</h4>
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
                             <div className="px-5 py-4 flex items-center space-x-4">
                                <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                    <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[14px] font-bold text-slate-800">0 <span className="text-slate-400">≈$0</span></p>
                                    <p className="text-[12px] font-bold text-slate-400">Rewards Available for Collection</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="w-full bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center shadow-sm shrink-0">
                         <div className="flex items-center space-x-2 mb-8">
                             <StarIcon className="h-10 w-10 text-yellow-500" />
                             <span className="text-6xl font-black tracking-tighter text-slate-800">0</span>
                         </div>
                         <button className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-[16px] shadow-lg shadow-green-100 transition-all active:scale-95 mb-6">
                            Buy More Stars
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const BusinessSettingsView: React.FC<{onBack: () => void}> = ({ onBack }) => {
    const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden text-slate-800 min-h-0">
            <div className="min-h-16 px-6 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
                <button onClick={onBack} className="flex items-center text-green-600 font-bold hover:opacity-70 transition-all text-[15px]">
                    <ArrowLeftIcon className="h-6 w-6 mr-1" />
                    <span>Back</span>
                </button>
                <h3 className="text-[15px] font-black leading-tight tracking-tight uppercase">Ringr Business</h3>
                <div className="w-12" />
            </div>

            <div className="flex-1 overflow-y-auto touch-pan-y py-12 pb-20 min-h-0">
                <div className="max-w-xl mx-auto px-6 flex flex-col items-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="relative h-32 w-32 bg-gradient-to-br from-green-400 to-green-600 rounded-[40px] shadow-2xl flex items-center justify-center border-4 border-white rotate-12 transition-transform duration-500 shrink-0">
                         <StoreIcon className="h-16 w-16 text-white drop-shadow-xl" />
                    </div>

                    <p className="text-[15px] font-bold text-slate-500 text-center leading-relaxed max-w-sm mx-auto shrink-0">
                        Turn your account into a business page with these additional features.
                    </p>

                    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                        <button 
                            onClick={() => setSelectedPlan('annual')}
                            className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${selectedPlan === 'annual' ? 'bg-green-50/50' : 'hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center space-x-3 text-left">
                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPlan === 'annual' ? 'border-green-600 bg-green-600' : 'border-slate-300'}`}>
                                    {selectedPlan === 'annual' && <CheckIcon className="h-3 w-3 text-white" />}
                                </div>
                                <span className="text-[15px] font-black text-slate-800">Annual (-41%)</span>
                            </div>
                            <span className="text-[14px] font-black text-slate-800">R 699.99/yr</span>
                        </button>
                    </div>

                    <button className="w-full shrink-0 py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-2xl font-black text-[16px] shadow-lg shadow-green-100 transition-all active:scale-95">
                        Subscribe
                    </button>
                </div>
            </div>
        </div>
    );
};

export const GiftSettingsView: React.FC<{users: User[], onBack: () => void}> = ({ users, onBack }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = useMemo(() => {
        return users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [users, searchQuery]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden text-slate-800 min-h-0">
             <div className="min-h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
                    <CloseIcon className="h-6 w-6 text-slate-600" />
                </button>
                <h3 className="text-[15px] font-black text-slate-800">Send a Gift</h3>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto touch-pan-y pb-20 min-h-0">
                <div className="max-w-xl mx-auto py-2">
                    <div className="px-4 py-3 shrink-0">
                         <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-100 border-none rounded-xl py-2 px-10 text-sm outline-none"
                            />
                        </div>
                    </div>

                    <div className="px-4 py-2 border-b border-slate-100 bg-white cursor-pointer hover:bg-slate-50 transition-colors flex items-center group shrink-0">
                        <span className="text-[14px] font-bold text-blue-500">Add Your Birthday</span>
                    </div>

                    <div className="mt-4 pb-10">
                        <h4 className="px-4 mb-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">Frequent Contacts</h4>
                        <div className="bg-white border-y border-slate-100 divide-y divide-slate-50">
                            {filteredUsers.map(user => (
                                <div key={user.id} className="px-4 py-3 flex items-center cursor-pointer hover:bg-slate-50 group">
                                    <img src={user.avatar === 'gemini' ? 'https://aistudiocdn.com/logo/gemini-sparkle.png' : user.avatar} className="h-10 w-10 rounded-full mr-3 border border-slate-100 object-cover" alt="" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[15px] font-bold text-slate-800 truncate">{user.name}</p>
                                        <p className="text-[12px] font-medium text-slate-400 truncate">{user.username || 'last seen recently'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SupportPopup: React.FC<{onClose: () => void}> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white rounded-[28px] max-w-[340px] w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
                    <CloseIcon className="h-6 w-6" />
                </button>
                
                <div className="flex flex-col items-center">
                    <h3 className="text-[18px] font-black text-slate-800 mt-2 mb-6">Ringr</h3>
                    <p className="text-[15px] text-slate-600 text-center font-bold leading-relaxed mb-10 px-1">
                        Please take a look at the Ringr FAQ: it has important troubleshooting tips and answers to most questions.
                    </p>
                    <div className="flex w-full space-x-3">
                        <button onClick={onClose} className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-[18px] font-black text-[15px] shadow-lg shadow-green-100 transition-all active:scale-95">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SetProfileColorView: React.FC<{user: User, onBack: () => void}> = ({ user, onBack }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'name'>('profile');
    const colors = [
        'bg-[#8fb2db]', 'bg-[#6ab36e]', 'bg-[#d8935c]', 'bg-[#d86a6c]', 'bg-[#9b7cdb]', 'bg-[#6eb2db]', 'bg-[#d87cb3]', 'bg-[#9ea6b3]',
        'bg-[#5ea5db]', 'bg-[#5da563]', 'bg-[#d88241]', 'bg-[#d84d50]', 'bg-[#8c5cdb]', 'bg-[#4da5db]', 'bg-[#d85db2]', 'bg-[#8b96a6]',
        'bg-gradient-to-br from-[#8fb2db] to-[#6ab36e]', 'bg-gradient-to-br from-[#d86a6c] to-[#9b7cdb]', 'bg-[#8b96a6]'
    ];
    const giftOptions = [
        { label: 'My Gifts', icon: '🎁' },
        { label: 'UFC Strike', icon: '🥊' },
        { label: 'Khabib\'s Papakha', icon: '🎩' },
        { label: 'Snoop Dogg', icon: '🕶️' },
        { label: 'Swag Bag', icon: '🛍️' }
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] text-slate-800 relative overflow-hidden min-h-0 font-sans">
            {/* Standard Detail Header */}
            <div className="min-h-16 px-4 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0 pt-safe">
                <button onClick={onBack} className="text-green-600 font-bold text-[15px] flex items-center hover:opacity-70 transition-opacity">
                    <ArrowLeftIcon className="h-6 w-6 mr-1" />
                    Back
                </button>
                
                {/* Segmented Control */}
                <div className="bg-slate-100 p-1 rounded-2xl flex items-center min-w-[200px] border border-slate-200">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-1.5 text-[12px] font-black rounded-xl transition-all ${activeTab === 'profile' ? 'bg-white text-green-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        PROFILE
                    </button>
                    <button 
                        onClick={() => setActiveTab('name')}
                        className={`flex-1 py-1.5 text-[12px] font-black rounded-xl transition-all ${activeTab === 'name' ? 'bg-white text-green-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        NAME
                    </button>
                </div>

                <button onClick={onBack} className="text-green-600 font-black text-[15px] hover:opacity-70 transition-opacity">Apply</button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pt-10 pb-20 px-6 max-w-2xl mx-auto w-full space-y-12">
                {/* User Info Section */}
                <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="relative group cursor-pointer mb-6">
                        <div className="h-32 w-32 rounded-full border-4 border-white shadow-2xl overflow-hidden p-1 bg-white">
                            <img src={user.avatar} className="h-full w-full rounded-full object-cover" alt="" />
                        </div>
                        <div className="absolute inset-0 bg-black/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-800">{user.name}</h2>
                    <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mt-1">last seen recently</p>
                </div>

                {/* Profile Page Color Section */}
                <div>
                    <h3 className="px-5 mb-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Profile Page Color</h3>
                    <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
                        <div className="grid grid-cols-7 sm:grid-cols-10 gap-3 mb-8">
                            {colors.map((color, i) => (
                                <button key={i} className={`aspect-square rounded-full ${color} shadow-sm ring-2 ring-transparent hover:ring-slate-100 hover:scale-110 transition-all active:scale-95 border-2 border-white`} />
                            ))}
                        </div>

                        <div className="bg-slate-50 rounded-[22px] p-4 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer group border border-slate-200/50">
                            <span className="text-[15px] font-black text-slate-700 px-1">Profile Logo</span>
                            <div className="flex items-center text-slate-400">
                                <span className="text-[14px] font-bold mr-2">Not Selected</span>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                        <p className="px-5 mt-4 text-[12px] font-bold text-slate-400 leading-snug">
                            Make your profile stand out by adding custom icons to background.
                        </p>
                    </div>
                </div>

                {/* Gift Section */}
                <div>
                    <h3 className="px-5 mb-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Use a Gift</h3>
                    
                    <div className="bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-sm">
                        {/* Horizontal Gift Categories */}
                        <div className="flex items-center px-4 py-3 space-x-1 overflow-x-auto no-scrollbar border-b border-slate-100 bg-slate-50/50">
                            {giftOptions.map((gift, i) => (
                                <button key={i} className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${i === 0 ? 'bg-white text-green-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-500'}`}>
                                    <span className="text-sm">{gift.icon}</span>
                                    <span className="text-[11px] font-black uppercase tracking-tight">{gift.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Empty State Body */}
                        <div className="p-12 flex flex-col items-center">
                            <div className="relative mb-8">
                                <div className="text-7xl animate-bounce duration-1000 filter drop-shadow-lg">
                                    🐥
                                </div>
                                <div className="absolute -top-1 -right-1 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>
                            
                            <p className="text-[16px] font-bold text-slate-500 text-center mb-8 max-w-[280px] leading-relaxed">
                                You don't have any gifts you can use as styles for your profile.
                            </p>
                            
                            <button className="text-green-600 font-black text-[13px] hover:underline uppercase tracking-widest bg-green-50 px-6 py-3 rounded-2xl transition-all active:scale-95">
                                Browse Gifts for Purchase
                            </button>
                        </div>
                    </div>
                    
                    <p className="px-5 mt-4 text-[12px] font-bold text-slate-400 leading-snug">
                        Apply your collectible's unique look to your profile.
                    </p>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const MenuSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="mb-6 shrink-0">
        <h3 className="px-6 mb-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
        <div className="flex flex-col">{children}</div>
    </div>
);

const MenuItem: React.FC<{icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, chevron?: boolean, badge?: string, value?: string, iconBg?: string}> = ({ icon, label, active, onClick, chevron, badge, value, iconBg }) => (
    <button onClick={onClick} className={`flex items-center px-4 py-3 transition-colors shrink-0 ${active ? 'bg-green-100 border-l-4 border-green-600' : 'hover:bg-slate-50'}`}>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center mr-3 ${iconBg || 'bg-transparent shadow-sm'}`}>{icon}</div>
        <span className={`flex-1 text-left text-[14px] font-bold ${active ? 'text-green-700' : 'text-slate-700'}`}>{label}</span>
        {value && <span className="text-xs font-black text-slate-400 mr-2">{value}</span>}
        {badge && <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full mr-2">{badge}</span>}
        {chevron && <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>}
    </button>
);

const SettingDetailRow: React.FC<{label: string, value?: string, chevron?: boolean}> = ({ label, value, chevron }) => (
    <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors group shrink-0">
        <span className="text-[15px] font-bold text-slate-700">{label}</span>
        <div className="flex items-center">
            {value && <span className="text-[14px] font-black text-slate-400 mr-2">{value}</span>}
            {chevron && <svg className="h-4 w-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>}
        </div>
    </div>
);

const ToggleRow: React.FC<{label: string, defaultChecked?: boolean}> = ({ label, defaultChecked }) => {
    const [checked, setChecked] = useState(!!defaultChecked);
    return (
        <div onClick={() => setChecked(!checked)} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors group shrink-0">
            <span className="text-[15px] font-bold text-slate-700">{label}</span>
            <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${checked ? 'bg-green-500' : 'bg-slate-200'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
        </div>
    );
};

const SelectionRow: React.FC<{label: string, checked: boolean}> = ({ label, checked }) => (
    <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors group shrink-0">
        <span className="text-[15px] font-bold text-slate-700">{label}</span>
        {checked && <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center"><svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg></div>}
    </div>
);