import React, { useState } from 'react';
import { BellZIcon, BellZSmallIcon, ClockIcon, BellOffIcon } from '../constants';

interface MuteOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMute: (mutedUntil: number | null) => Promise<void>;
  onUnmute?: () => Promise<void>;
  currentMutedUntil?: number | null;
}

export const MuteOptionsModal: React.FC<MuteOptionsModalProps> = ({
  isOpen,
  onClose,
  onMute,
  onUnmute,
  currentMutedUntil,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const isMuted = currentMutedUntil !== undefined && currentMutedUntil !== null && (currentMutedUntil === -1 || currentMutedUntil > Date.now());

  const handleMute = async (mutedUntil: number | null) => {
    setIsProcessing(true);
    try {
      await onMute(mutedUntil);
      onClose();
    } catch (error) {
      console.error('Error muting conversation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnmute = async () => {
    if (!onUnmute) return;
    setIsProcessing(true);
    try {
      await onUnmute();
      onClose();
    } catch (error) {
      console.error('Error unmuting conversation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomDate = () => {
    if (!customDate) {
      setShowCustomDatePicker(true);
      return;
    }
    const date = new Date(customDate);
    if (isNaN(date.getTime())) {
      alert('Invalid date. Please select a valid date.');
      return;
    }
    handleMute(date.getTime());
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
              disabled={isProcessing}
              className="p-1.5 -ml-1 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-[18px] font-black text-slate-800 flex-1 text-center pr-8">
              {isMuted ? 'Unmute Group' : 'Mute Group'}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isMuted && onUnmute ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 text-center mb-4">
                This group is currently muted. Would you like to unmute it?
              </p>
              <button
                onClick={handleUnmute}
                disabled={isProcessing}
                className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-[15px] transition-all active:scale-[0.98] shadow-lg shadow-green-100/50"
              >
                {isProcessing ? 'Unmuting...' : 'Unmute Group'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => handleMute(Date.now() + 60 * 60 * 1000)} // 1 hour
                disabled={isProcessing}
                className="w-full flex items-center px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BellZIcon className="h-5 w-5 text-slate-600 mr-3" />
                <span className="text-[15px] font-bold text-slate-800 flex-1 text-left">For 1 Hour</span>
              </button>

              <button
                onClick={() => handleMute(Date.now() + 8 * 60 * 60 * 1000)} // 8 hours
                disabled={isProcessing}
                className="w-full flex items-center px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BellZIcon className="h-5 w-5 text-slate-600 mr-3" />
                <span className="text-[15px] font-bold text-slate-800 flex-1 text-left">For 8 Hours</span>
              </button>

              <button
                onClick={() => handleMute(Date.now() + 3 * 24 * 60 * 60 * 1000)} // 3 days
                disabled={isProcessing}
                className="w-full flex items-center px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BellZSmallIcon className="h-5 w-5 text-slate-600 mr-3" />
                <span className="text-[15px] font-bold text-slate-800 flex-1 text-left">For 3 Days</span>
              </button>

              <div className="h-px bg-slate-100 my-2" />

              {showCustomDatePicker ? (
                <div className="space-y-3">
                  <input
                    type="datetime-local"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[15px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-green-500/20"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowCustomDatePicker(false);
                        setCustomDate('');
                      }}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-[15px] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCustomDate}
                      disabled={!customDate || isProcessing}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-[15px] transition-all"
                    >
                      Mute
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomDatePicker(true)}
                  disabled={isProcessing}
                  className="w-full flex items-center px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ClockIcon className="h-5 w-5 text-slate-600 mr-3" />
                  <span className="text-[15px] font-bold text-slate-800 flex-1 text-left">Mute Until...</span>
                </button>
              )}

              <div className="h-px bg-slate-100 my-2" />

              <button
                onClick={() => handleMute(-1)} // -1 = forever
                disabled={isProcessing}
                className="w-full flex items-center px-4 py-3 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BellOffIcon className="h-5 w-5 text-red-600 mr-3" />
                <span className="text-[15px] font-bold text-red-600 flex-1 text-left">Forever</span>
              </button>
            </div>
          )}
        </div>

        {/* Cancel Button */}
        <div className="p-6 pt-4 shrink-0 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 rounded-2xl font-black text-[15px] transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
