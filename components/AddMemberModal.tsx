import React, { useState, useMemo } from 'react';
import type { User } from '../types';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (userId: string) => Promise<void>;
  availableUsers: User[];
  currentUserId: string;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
  availableUsers,
  currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleAdd = async () => {
    if (!selectedUserId) {
      setError('Please select a user to add');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      await onAddMember(selectedUserId);
      setSelectedUserId(null);
      setSearchQuery('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add member. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (isAdding) return;
    setSelectedUserId(null);
    setSearchQuery('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-[500px] h-[640px] max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 shrink-0 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={handleClose}
              disabled={isAdding}
              className="p-1.5 -ml-1 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-[18px] font-black text-slate-800 flex-1 text-center pr-8">
              Add Member
            </h3>
          </div>

          {/* Search */}
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

        {/* Users List */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {filteredUsers.length > 0 ? (
            <div className="space-y-1 px-2">
              {filteredUsers.map(user => {
                const isSelected = selectedUserId === user.id;
                return (
                  <div 
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors rounded-xl mx-2 ${
                      isSelected ? 'bg-green-50 border-2 border-green-500' : ''
                    }`}
                  >
                    <img 
                      className={`h-12 w-12 rounded-full object-cover mr-4 shrink-0 ${
                        isSelected ? 'ring-2 ring-green-500' : ''
                      }`}
                      src={user.avatar === 'gemini' ? 'https://aistudiocdn.com/logo/gemini-sparkle.png' : user.avatar} 
                      alt={user.name} 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-slate-800 truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 font-medium truncate">
                        {user.username || user.email || 'No username'}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="ml-2 shrink-0">
                        <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
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

        {/* Add Button */}
        <div className="p-6 pt-4 shrink-0 border-t border-slate-100">
          <button
            onClick={handleAdd}
            disabled={!selectedUserId || isAdding}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-[15px] transition-all active:scale-[0.98] shadow-lg shadow-green-100/50"
          >
            {isAdding ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
};
