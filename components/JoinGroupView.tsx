import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, UsersIcon, CheckIcon } from '../constants';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import type { Conversation, User } from '../types';
import { requestJoinGroupByInvite } from '../services/firestoreService';
import { toast } from '../utils/toast';

interface JoinGroupViewProps {
  inviteToken: string;
  currentUser: User | null;
  isAuthenticated: boolean;
  onLogin?: () => void;
  onJoinSuccess: () => void;
  onCancel: () => void;
}

export const JoinGroupView: React.FC<JoinGroupViewProps> = ({
  inviteToken,
  currentUser,
  isAuthenticated,
  onLogin,
  onJoinSuccess,
  onCancel,
}) => {
  const [groupInfo, setGroupInfo] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get invite info
        const inviteRef = doc(db, 'invites', inviteToken);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
          setError('Invalid invite link. This link may have expired or been revoked.');
          setIsLoading(false);
          return;
        }

        const inviteData = inviteSnap.data();
        if (!inviteData.active) {
          setError('This invite link is no longer active.');
          setIsLoading(false);
          return;
        }

        // Check expiration
        if (inviteData.expiresAt) {
          const expiresAt = inviteData.expiresAt.toMillis();
          if (Date.now() > expiresAt) {
            setError('This invite link has expired.');
            setIsLoading(false);
            return;
          }
        }

        const groupId = inviteData.groupId as string;
        
        // Build lightweight group info from invite metadata only.
        // This avoids needing read access to the conversations collection,
        // which is restricted to group participants in Firestore rules.
        const groupName =
          inviteData.groupName ||
          inviteData.group_name || // fallback for any older field names
          'Group chat';
        const groupAvatar = inviteData.groupAvatar || inviteData.group_avatar || '';
        const groupDescription =
          inviteData.groupDescription || inviteData.group_description || '';

        setGroupInfo({
          id: groupId,
          type: 'group',
          name: groupName,
          avatar: groupAvatar,
          description: groupDescription,
          participants: [],
          messages: [],
          admins: [],
          isPinned: false,
        } as Conversation);

        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching group info:', error);
        setError('Failed to load group information. Please try again.');
        setIsLoading(false);
      }
    };

    fetchGroupInfo();
  }, [inviteToken]);

  const handleJoin = async () => {
    if (!currentUser?.id || !isAuthenticated) {
      toast.warning('Please log in to join this group');
      if (onLogin) {
        onLogin();
      }
      return;
    }

    if (!groupInfo) return;

    try {
      setIsJoining(true);
      await requestJoinGroupByInvite(inviteToken, currentUser.id);
      toast.success('Join request sent! Waiting for admin approval.');
      onJoinSuccess();
    } catch (error: any) {
      console.error('Error joining group:', error);
      const errorMessage = error.message || 'Failed to join group. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-slate-600">Loading group information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Unable to Join</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!groupInfo) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-slate-600" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Join Group</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          {/* Group Avatar */}
          <div className="flex justify-center mb-6">
            {groupInfo.avatar ? (
              <img
                src={groupInfo.avatar}
                alt={groupInfo.name}
                className="w-24 h-24 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <UsersIcon className="h-12 w-12 text-white" />
              </div>
            )}
          </div>

          {/* Group Name */}
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
            {groupInfo.name}
          </h2>

          {/* Group Description */}
          {groupInfo.description && (
            <p className="text-sm text-slate-600 text-center mb-6">
              {groupInfo.description}
            </p>
          )}

          {/* Participants Count */}
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Members</span>
              </div>
              <span className="text-sm font-bold text-slate-600">
                {groupInfo.participants.length}+
              </span>
            </div>
          </div>

          {/* Join Button */}
          {!isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 text-center mb-4">
                You need to log in to join this group
              </p>
              <button
                onClick={onLogin}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-lg shadow-green-100"
              >
                Log In to Join
              </button>
              <button
                onClick={onCancel}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2"
              >
                {isJoining ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    <span>Join Group</span>
                  </>
                )}
              </button>
              <button
                onClick={onCancel}
                disabled={isJoining}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
