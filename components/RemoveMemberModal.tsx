import React from 'react';
import type { User } from '../types';

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  member: User;
}

export const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  member,
}) => {
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    setIsRemoving(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-[400px] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 shrink-0 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onClose}
              disabled={isRemoving}
              className="p-1.5 -ml-1 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-[18px] font-black text-slate-800 flex-1 text-center pr-8">
              Remove Member
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <img 
            className="h-20 w-20 rounded-full object-cover mb-4 border-4 border-slate-100" 
            src={member.avatar === 'gemini' ? 'https://aistudiocdn.com/logo/gemini-sparkle.png' : member.avatar} 
            alt={member.name} 
          />
          <h4 className="text-lg font-black text-slate-800 mb-2">{member.name}</h4>
          <p className="text-sm text-slate-400 font-medium mb-6 text-center">
            Are you sure you want to remove {member.name} from this group? They will no longer be able to see group messages.
          </p>

          {error && (
            <p className="text-xs text-red-500 font-bold mb-4 text-center">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 shrink-0 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={isRemoving}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 rounded-2xl font-black text-[15px] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isRemoving}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-[15px] transition-all active:scale-[0.98]"
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};
