import React, { useState } from 'react';

interface EditDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string) => Promise<void>;
  currentDescription: string;
}

export const EditDescriptionModal: React.FC<EditDescriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentDescription,
}) => {
  const [description, setDescription] = useState(currentDescription);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxLength = 500;

  const handleSave = async () => {
    if (description.length > maxLength) {
      setError(`Description must be ${maxLength} characters or less`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(description);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update description. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    setDescription(currentDescription);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-[500px] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 shrink-0 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={handleClose}
              disabled={isSaving}
              className="p-1.5 -ml-1 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-[18px] font-black text-slate-800 flex-1 text-center pr-8">
              Edit Description
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Group Description
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError(null);
              }}
              placeholder="Add a description for this group..."
              rows={4}
              maxLength={maxLength}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-[16px] font-bold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-400 font-medium">
                Describe what this group is about
              </p>
              <p className={`text-xs font-bold ${
                description.length > maxLength * 0.9 
                  ? description.length >= maxLength 
                    ? 'text-red-500' 
                    : 'text-yellow-600'
                  : 'text-slate-400'
              }`}>
                {description.length}/{maxLength}
              </p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-bold mb-4 text-center">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 shrink-0 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 rounded-2xl font-black text-[15px] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || description.length > maxLength}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-[15px] transition-all active:scale-[0.98] shadow-lg shadow-green-100/50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
