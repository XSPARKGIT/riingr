import React, { useState } from 'react';

interface GroupAvatarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (avatarUrl: string) => Promise<void>;
  currentAvatar?: string;
}

export const GroupAvatarPicker: React.FC<GroupAvatarPickerProps> = ({
  isOpen,
  onClose,
  onSave,
  currentAvatar,
}) => {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  const handleSave = async () => {
    if (!avatarUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(avatarUrl.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update avatar. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    setAvatarUrl(currentAvatar || '');
    setError(null);
    setPreviewError(false);
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
              Change Group Avatar
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {/* Preview */}
          <div className="mb-6">
            {avatarUrl && !previewError ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="h-32 w-32 rounded-full object-cover border-4 border-slate-100 shadow-lg"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-100 shadow-lg">
                <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* URL Input */}
          <div className="w-full mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                setPreviewError(false);
                setError(null);
              }}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-[16px] font-bold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
            />
            <p className="mt-2 text-xs text-slate-400 font-medium">
              Enter a URL to an image. The image will be displayed as the group avatar.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-bold mb-4 text-center w-full">{error}</p>
          )}

          {previewError && avatarUrl && (
            <p className="text-xs text-yellow-600 font-bold mb-4 text-center w-full">
              Could not load image preview. The URL may be invalid.
            </p>
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
            disabled={isSaving || !avatarUrl.trim()}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-[15px] transition-all active:scale-[0.98] shadow-lg shadow-green-100/50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
