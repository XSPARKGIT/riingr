import React, { useState } from 'react';
import type { User } from '../types';
import { updateUserProfile } from '../services/firestoreService';

interface OnboardingProfileProps {
  user: User;
  onComplete: (updates: Partial<User>) => void;
}

export const OnboardingProfile: React.FC<OnboardingProfileProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState(user.status || '');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoDataUrl(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(reader.result as string);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read the image. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!status.trim()) {
        setError('Please add a short status before continuing.');
        return;
      }
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, 2));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!status.trim()) {
      setError('Please add a short status before continuing.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const updates: Partial<User> = {
      status: status.trim(),
      avatar: photoDataUrl || user.avatar,
      profileComplete: true,
    };

    try {
      await updateUserProfile(user.id, updates);
      onComplete(updates);
    } catch (err: any) {
      setError(err.message || 'Failed to save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[100dvh] w-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Step {step} of 2
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            {step === 1 ? 'Add a status' : 'Add a profile photo'}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            {step === 1
              ? 'Let people know what’s up. You can change this later.'
              : 'Upload a profile photo so friends can recognize you.'}
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-3">
            <textarea
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="e.g. Building something awesome 🚀"
              className="w-full min-h-[110px] rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white transition-all"
              maxLength={140}
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Keep it short and friendly.</span>
              <span>{status.length}/140</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={photoDataUrl || user.avatar}
                alt="Profile preview"
                className="h-20 w-20 rounded-full object-cover border-2 border-slate-100 shadow-sm"
              />
              <div>
                <label className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer">
                  Upload photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
                <p className="text-xs text-slate-400 mt-2">PNG or JPG works best.</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-xs font-bold text-red-500">{error}</p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1 || isSaving}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Back
          </button>

          {step === 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold shadow-lg shadow-green-100/50 hover:bg-green-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold shadow-lg shadow-green-100/50 hover:bg-green-700 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save & Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
