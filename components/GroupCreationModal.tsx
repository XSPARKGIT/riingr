import React, { useState, useMemo } from 'react';
import type { User } from '../types';

interface GroupCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, participantIds: string[], avatar?: string) => Promise<void>;
  contacts: User[];
  currentUserId: string;
  allUsers?: User[]; // Users from existing conversations
}

export const GroupCreationModal: React.FC<GroupCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  contacts,
  currentUserId,
  allUsers = [],
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Combine contacts and allUsers, remove duplicates and current user
  const availableUsers = useMemo(() => {
    const userMap = new Map<string, User>();
    
    // Add contacts
    contacts.forEach(user => {
      if (user.id !== currentUserId) {
        userMap.set(user.id, user);
      }
    });
    
    // Add users from existing conversations
    allUsers.forEach(user => {
      if (user.id !== currentUserId) {
        userMap.set(user.id, user);
      }
    });
    
    return Array.from(userMap.values());
  }, [contacts, allUsers, currentUserId]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableUsers;
    }
    
    const query = searchQuery.toLowerCase();
    return availableUsers.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }, [availableUsers, searchQuery]);

  // Get selected users for display
  const selectedUsers = useMemo(() => {
    return availableUsers.filter(user => selectedParticipantIds.has(user.id));
  }, [availableUsers, selectedParticipantIds]);

  const toggleParticipant = (userId: string) => {
    setSelectedParticipantIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
    setError(null);
  };

  const handleNext = () => {
    if (selectedParticipantIds.size === 0) {
      setError('Please select at least one participant');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
  };

  const handleCreate = async () => {
    if (!groupName.trim() || groupName.trim().length < 2) {
      setError('Group name must be at least 2 characters');
      return;
    }
    
    if (selectedParticipantIds.size === 0) {
      setError('Please select at least one participant');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreateGroup(
        groupName.trim(),
        Array.from(selectedParticipantIds),
        undefined // Avatar can be added later
      );
      
      // Reset form
      setStep(1);
      setSelectedParticipantIds(new Set());
      setGroupName('');
      setSearchQuery('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isCreating) return; // Prevent closing during creation
    
    setStep(1);
    setSelectedParticipantIds(new Set());
    setGroupName('');
    setSearchQuery('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-[500px] h-[640px] max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 pb-4 shrink-0 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={step === 1 ? handleClose : handleBack}
              disabled={isCreating}
              className="p-1.5 -ml-1 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {step === 1 ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                )}
              </svg>
            </button>
            <h3 className="text-[18px] font-black text-slate-800 flex-1 text-center pr-8">
              {step === 1 ? 'New Group' : 'Group Details'}
            </h3>
          </div>

          {step === 1 && (
            <div className="text-center">
              <p className="text-xs text-slate-500 font-semibold">
                {selectedParticipantIds.size > 0 
                  ? `${selectedParticipantIds.size} participant${selectedParticipantIds.size > 1 ? 's' : ''} selected`
                  : 'Select participants'}
              </p>
            </div>
          )}
        </div>

        {/* Step 1: Select Participants */}
        {step === 1 && (
          <>
            {/* Search */}
            <div className="px-6 pt-4 pb-2 shrink-0">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search contacts"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 border-none rounded-2xl py-3 px-10 text-[15px] font-bold outline-none placeholder:text-slate-400"
                  autoFocus
                />
                <div className="absolute left-3.5 top-3.5 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Selected Participants Preview */}
            {selectedUsers.length > 0 && (
              <div className="px-6 py-3 shrink-0 border-b border-slate-100">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full shrink-0"
                    >
                      <img 
                        className="h-6 w-6 rounded-full object-cover" 
                        src={user.avatar === 'gemini' ? 'https://aistudiocdn.com/logo/gemini-sparkle.png' : user.avatar} 
                        alt={user.name} 
                      />
                      <span className="text-xs font-bold text-green-700">{user.name}</span>
                      <button
                        onClick={() => toggleParticipant(user.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              {filteredUsers.length > 0 ? (
                <div className="space-y-1 px-2">
                  {filteredUsers.map(user => {
                    const isSelected = selectedParticipantIds.has(user.id);
                    return (
                      <div 
                        key={user.id}
                        onClick={() => toggleParticipant(user.id)}
                        className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors rounded-xl mx-2"
                      >
                        <div className="relative h-11 w-11 flex-shrink-0 mr-4">
                          {user.avatar === 'gemini' ? (
                            <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                              <svg className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z" />
                              </svg>
                            </div>
                          ) : (
                            <img 
                              className="h-full w-full rounded-full object-cover border border-slate-100 shadow-sm" 
                              src={user.avatar} 
                              alt={user.name} 
                            />
                          )}
                          {user.isOnline && (
                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-slate-800 truncate leading-tight">{user.name}</p>
                          <p className="text-[12px] text-slate-400 font-bold truncate">
                            {user.username || user.email || 'No username'}
                          </p>
                        </div>
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                          isSelected ? 'bg-green-500 border-green-500 shadow-sm' : 'border-slate-200'
                        }`}>
                          {isSelected && (
                            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="bg-slate-100 p-4 rounded-full mb-4">
                    <svg className="h-8 w-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400 font-medium">
                    {searchQuery ? 'No contacts match your search' : 'No contacts available'}
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-6 py-2 shrink-0">
                <p className="text-xs text-red-500 font-bold text-center">{error}</p>
              </div>
            )}

            {/* Next Button */}
            <div className="p-6 pt-4 shrink-0 border-t border-slate-100">
              <button
                onClick={handleNext}
                disabled={selectedParticipantIds.size === 0}
                className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-[15px] transition-all active:scale-[0.98] shadow-lg shadow-green-100/50"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 2: Group Details */}
        {step === 2 && (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
              {/* Group Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    setError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-[16px] font-bold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                  autoFocus
                  maxLength={50}
                />
                <p className="mt-1 text-xs text-slate-400 font-medium">
                  {groupName.length}/50 characters
                </p>
              </div>

              {/* Selected Participants Preview */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Participants ({selectedUsers.length + 1})
                </label>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  {selectedUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3">
                      <img 
                        className="h-10 w-10 rounded-full object-cover border border-slate-200" 
                        src={user.avatar === 'gemini' ? 'https://aistudiocdn.com/logo/gemini-sparkle.png' : user.avatar} 
                        alt={user.name} 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 font-medium truncate">
                          {user.username || user.email || 'No username'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4">
                  <p className="text-xs text-red-500 font-bold">{error}</p>
                </div>
              )}
            </div>

            {/* Create Button */}
            <div className="p-6 pt-4 shrink-0 border-t border-slate-100">
              <button
                onClick={handleCreate}
                disabled={!groupName.trim() || groupName.trim().length < 2 || isCreating}
                className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-[15px] transition-all active:scale-[0.98] shadow-lg shadow-green-100/50"
              >
                {isCreating ? 'Creating Group...' : 'Create Group'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
