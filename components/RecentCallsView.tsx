
import React, { useState } from 'react';
import { User, Call } from '../types';
import { CallIcon, PhoneIcon, CheckIcon, CloseIcon, TrashIcon } from '../constants';

interface RecentCallsViewProps {
    calls: Call[];
    users: User[];
}

export const RecentCallsView: React.FC<RecentCallsViewProps> = ({ calls, users }) => {
    const [isGroupCallModalOpen, setIsGroupCallModalOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [callSearchQuery, setCallSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [callList, setCallList] = useState<Call[]>(calls);

    const formatTimestamp = (ts: number) => {
        const date = new Date(ts);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
    };

    const getUser = (id: string) => users.find(u => u.id === id);

    const getCallIcon = (type: Call['type']) => {
        switch (type) {
            case 'outgoing':
                return <svg className="h-3 w-3 mr-1 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>;
            case 'incoming':
                return <svg className="h-3 w-3 mr-1 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="7" x2="7" y2="17"></line><polyline points="17 17 7 17 7 7"></polyline></svg>;
            case 'missed':
                return <svg className="h-3 w-3 mr-1 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="7" x2="7" y2="17"></line><polyline points="17 17 7 17 7 7"></polyline></svg>;
        }
    };

    const toggleUserSelection = (id: string) => {
        const next = new Set(selectedUserIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedUserIds(next);
    };

    const handleDeleteCall = (id: string) => {
        setCallList(prev => prev.filter(c => c.id !== id));
    };

    const filteredCallUsers = users.filter(user => 
        user.name.toLowerCase().includes(callSearchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(callSearchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-10 pt-safe">
                <div className="flex items-center justify-between mb-4">
                    <button className="text-[13px] font-bold text-green-600 hover:opacity-70 transition-opacity">
                        Sort
                    </button>
                    <h2 className="text-[17px] font-black text-slate-800 tracking-tight">Recent Calls</h2>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`text-[13px] font-bold transition-all ${isEditing ? 'text-sky-500' : 'text-green-600'} hover:opacity-70`}
                    >
                        {isEditing ? 'Done' : 'Edit'}
                    </button>
                </div>
                
                <button 
                    onClick={() => setIsGroupCallModalOpen(true)}
                    className="flex items-center text-green-600 space-x-3 w-full p-1 group"
                >
                    <div className="bg-green-50 p-1.5 rounded-full group-hover:bg-green-100 transition-colors">
                        <PhoneIcon className="h-5 w-5" />
                    </div>
                    <span className="text-[15px] font-bold tracking-tight">Create New Call</span>
                </button>
            </div>

            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Recent Calls</p>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-1">
                {callList.map(call => {
                    const user = getUser(call.userId);
                    if (!user) return null;
                    const isMissed = call.type === 'missed';

                    return (
                        <div key={call.id} className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group">
                            {isEditing && (
                                <button 
                                    onClick={() => handleDeleteCall(call.id)}
                                    className="mr-3 flex-shrink-0 bg-red-500 rounded-full h-6 w-6 flex items-center justify-center animate-in slide-in-from-left-4 fade-in duration-200"
                                >
                                    <div className="w-3 h-0.5 bg-white rounded-full" />
                                </button>
                            )}
                            <div className="h-12 w-12 flex-shrink-0 mr-4">
                                <img 
                                    className="h-full w-full rounded-full object-cover border border-slate-100" 
                                    src={user.avatar} 
                                    alt={user.name} 
                                />
                            </div>
                            <div className="flex-1 min-w-0 border-b border-slate-50 pb-3 group-last:border-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className={`text-[15px] font-bold truncate ${isMissed ? 'text-red-500' : 'text-slate-800'}`}>
                                            {user.name} {call.count && call.count > 1 ? `(${call.count})` : ''}
                                        </p>
                                        <div className="flex items-center mt-0.5">
                                            {getCallIcon(call.type)}
                                            <p className="text-[12px] text-slate-400 font-medium">
                                                {call.type === 'missed' ? 'Missed' : call.type.charAt(0).toUpperCase() + call.type.slice(1)}
                                                {call.duration ? ` (${call.duration})` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[12px] text-slate-400 font-medium pt-0.5">
                                        {formatTimestamp(call.timestamp)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Group Call Modal */}
            {isGroupCallModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-[400px] h-[640px] max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-6 pb-2 shrink-0">
                            <div className="flex items-center justify-between mb-6">
                                <button 
                                    onClick={() => setIsGroupCallModalOpen(false)} 
                                    className="p-1.5 -ml-1 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                >
                                    <CloseIcon className="h-7 w-7" />
                                </button>
                                <h3 className="text-[18px] font-black text-slate-800 flex-1 text-center pr-8">Group Call</h3>
                            </div>
                            
                            {/* Search */}
                            <div className="relative mb-6">
                                <input 
                                    type="text" 
                                    placeholder="Search"
                                    value={callSearchQuery}
                                    onChange={(e) => setCallSearchQuery(e.target.value)}
                                    className="w-full bg-slate-100 border-none rounded-2xl py-3 px-10 text-[15px] font-bold outline-none"
                                />
                                <div className="absolute left-3.5 top-3.5 text-slate-400">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>

                            {/* New Call Link */}
                            <button className="w-full flex items-center space-x-4 p-2 mb-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                </div>
                                <span className="text-[15px] font-bold text-green-600">New Call Link</span>
                            </button>
                        </div>

                        {/* List Section Header */}
                        <div className="px-6 py-2.5 bg-slate-50 border-y border-slate-100">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Frequent Contacts</span>
                        </div>

                        {/* Contacts List */}
                        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                            {filteredCallUsers.map(user => (
                                <div 
                                    key={user.id}
                                    onClick={() => toggleUserSelection(user.id)}
                                    className="flex items-center px-6 py-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                                >
                                    <div className="relative h-11 w-11 flex-shrink-0 mr-4">
                                        <img className="h-full w-full rounded-full object-cover border border-slate-100 shadow-sm" src={user.avatar === 'gemini' ? 'https://aistudiocdn.com/logo/gemini-sparkle.png' : user.avatar} alt={user.name} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[15px] font-bold text-slate-800 truncate leading-tight">{user.name}</p>
                                        <p className="text-[12px] text-slate-400 font-bold truncate">
                                            {user.username || 'last seen recently'}
                                        </p>
                                    </div>
                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedUserIds.has(user.id) ? 'bg-green-500 border-green-500 shadow-sm' : 'border-slate-200'}`}>
                                        {selectedUserIds.has(user.id) && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Bar */}
                        <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.04)]">
                            <button 
                                className={`w-full py-4 rounded-[22px] font-black text-[17px] shadow-lg transition-all active:scale-[0.98] ${selectedUserIds.size > 0 ? 'bg-green-600 text-white shadow-green-100 hover:bg-green-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                                onClick={() => selectedUserIds.size > 0 && setIsGroupCallModalOpen(false)}
                            >
                                Call
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
