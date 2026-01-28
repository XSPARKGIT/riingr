import React, { useState } from 'react';
import type { Conversation, User, Message, ConversationNotificationLevel } from '../types';
import { ArrowLeftIcon, UsersIcon, TrashIcon } from '../constants';
import { AddMemberModal } from './AddMemberModal';
import { RemoveMemberModal } from './RemoveMemberModal';
import { GroupAvatarPicker } from './GroupAvatarPicker';
import { EditDescriptionModal } from './EditDescriptionModal';
import { MuteOptionsModal } from './MuteOptionsModal';
import { approvePendingMember, rejectPendingMember, blockUser, reportUser } from '../services/firestoreService';

interface GroupSettingsViewProps {
  conversation: Conversation;
  currentUserId: string;
  onClose: () => void;
  onUpdate: (updates: Partial<Conversation>) => Promise<void>;
  onAddMember: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onLeaveGroup: () => Promise<void>;
  onTransferAdmin: (userId: string) => Promise<void>;
  onRemoveAdmin: (userId: string) => Promise<void>;
  onMuteGroup: (mutedUntil: number | null) => Promise<void>;
  onUnmuteGroup: () => Promise<void>;
  availableUsers: User[];
  mutedUntil?: number | null;
  mediaMessages: Message[];
  fileMessages: Message[];
  pinnedMessages: Message[];
  notificationLevel: ConversationNotificationLevel;
  onChangeNotificationLevel: (level: ConversationNotificationLevel) => Promise<void>;
}

type Tab = 'Media' | 'Files' | 'Links' | 'Voice' | 'GIFs';

export const GroupSettingsView: React.FC<GroupSettingsViewProps> = ({
  conversation,
  currentUserId,
  onClose,
  onUpdate,
  onAddMember,
  onRemoveMember,
  onLeaveGroup,
  onTransferAdmin,
  onRemoveAdmin,
  onMuteGroup,
  onUnmuteGroup,
  availableUsers,
  mutedUntil,
  mediaMessages,
  fileMessages,
  pinnedMessages,
  notificationLevel,
  onChangeNotificationLevel,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('Media');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isRemoveMemberOpen, setIsRemoveMemberOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(conversation.name || '');

  const isAdmin = conversation.admins?.includes(currentUserId);
  const isMuted = mutedUntil !== undefined && mutedUntil !== null && (mutedUntil === -1 || mutedUntil > Date.now());

  const handleSaveName = async () => {
    if (editName.trim() && editName.trim() !== conversation.name) {
      await onUpdate({ name: editName.trim() });
    }
    setIsEditingName(false);
  };

  const handleAddMember = async (userId: string) => {
    await onAddMember(userId);
    setIsAddMemberOpen(false);
  };

  const handleRemoveMemberClick = (member: User) => {
    setMemberToRemove(member);
    setIsRemoveMemberOpen(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (memberToRemove) {
      await onRemoveMember(memberToRemove.id);
      setIsRemoveMemberOpen(false);
      setMemberToRemove(null);
    }
  };

  const handleAvatarChange = async (avatarUrl: string) => {
    await onUpdate({ avatar: avatarUrl });
    setIsAvatarPickerOpen(false);
  };

  const handleDescriptionChange = async (description: string) => {
    await onUpdate({ description });
    setIsDescriptionModalOpen(false);
  };

  const handleMute = async (mutedUntil: number | null) => {
    await onMuteGroup(mutedUntil);
    setIsMuteModalOpen(false);
  };

  const tabs: Tab[] = ['Media', 'Files', 'Links', 'Voice', 'GIFs'];

  const renderNotificationLevelLabel = (level: ConversationNotificationLevel) => {
    switch (level) {
      case 'mentions':
        return 'Mentions only';
      case 'none':
        return 'None';
      case 'all':
      default:
        return 'All messages';
    }
  };

  const handleNotificationChange = async (level: ConversationNotificationLevel) => {
    if (level === notificationLevel) return;
    await onChangeNotificationLevel(level);
  };

  const activeMedia = mediaMessages || [];
  const activeFiles = fileMessages || [];

  const pendingMemberIds = conversation.pendingMemberIds || [];
  const pendingMembers: User[] = pendingMemberIds
    .map((id) => availableUsers.find((u) => u.id === id))
    .filter((u): u is User => !!u);

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-800 animate-in slide-in-from-right duration-300 z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 pt-safe">
        <button 
          onClick={onClose} 
          className="flex items-center text-green-600 font-bold hover:opacity-70 transition-all active:scale-95 text-[15px]"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          <span>Back</span>
        </button>
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Group Info</h2>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-10">
        {/* Group Avatar and Name */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="relative mb-4">
            {conversation.avatar ? (
              <img 
                src={conversation.avatar} 
                className="h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-lg cursor-pointer hover:opacity-80 transition-opacity" 
                alt={conversation.name}
                onClick={() => isAdmin && setIsAvatarPickerOpen(true)}
              />
            ) : (
              <div 
                className="h-32 w-32 rounded-full bg-slate-100 flex items-center justify-center ring-4 ring-white shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => isAdmin && setIsAvatarPickerOpen(true)}
              >
                <UsersIcon className="h-16 w-16 text-slate-300" />
              </div>
            )}
            {isAdmin && (
              <div className="absolute bottom-0 right-0 bg-green-600 rounded-full p-2 shadow-lg">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
          </div>

          {/* Pending Members */}
          {pendingMembers.length > 0 && (
            <div className="mt-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Pending members ({pendingMembers.length})
                </h3>
              </div>
              <div className="space-y-3">
                {pendingMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center min-w-0">
                      <img
                        src={
                          member.avatar === 'gemini'
                            ? 'https://aistudiocdn.com/logo/gemini-sparkle.png'
                            : member.avatar
                        }
                        className="h-9 w-9 rounded-full mr-3 border-2 border-slate-100 shrink-0"
                        alt={member.name}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-bold text-slate-800 truncate">
                          {member.name || member.username || 'Pending member'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 truncate">
                          {member.username || member.email || member.id}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={async () => {
                            try {
                              await approvePendingMember(conversation.id, member.id, currentUserId);
                              alert('Member approved');
                            } catch (error) {
                              console.error('Error approving member:', error);
                              alert('Could not approve member. Please try again.');
                            }
                          }}
                          className="px-3 py-1.5 rounded-full bg-green-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = window.confirm(
                              `Reject join request from ${member.name || member.username || 'this user'}?`
                            );
                            if (!confirmed) return;
                            try {
                              await rejectPendingMember(conversation.id, member.id, currentUserId);
                              alert('Member rejected');
                            } catch (error) {
                              console.error('Error rejecting member:', error);
                              alert('Could not reject member. Please try again.');
                            }
                          }}
                          className="px-3 py-1.5 rounded-full bg-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isEditingName && isAdmin ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') {
                    setEditName(conversation.name || '');
                    setIsEditingName(false);
                  }
                }}
                className="text-xl font-black text-slate-800 text-center bg-transparent border-b-2 border-green-500 outline-none px-2"
                autoFocus
                maxLength={50}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-800">{conversation.name || 'Unnamed Group'}</h3>
              {isAdmin && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-green-600 hover:text-green-700 p-1"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mt-2 px-4">
            {conversation.description ? (
              <p className="text-sm text-slate-600 text-center">{conversation.description}</p>
            ) : (
              <p className="text-sm text-slate-400 text-center italic">No description</p>
            )}
            {isAdmin && (
              <button
                onClick={() => setIsDescriptionModalOpen(true)}
                className="text-green-600 text-xs font-semibold mt-1 hover:underline"
              >
                {conversation.description ? 'Edit description' : 'Add description'}
              </button>
            )}
          </div>

          {/* Mute Status */}
          {isMuted && (
            <div className="mt-2 px-4 py-1 bg-yellow-50 rounded-full">
              <p className="text-xs text-yellow-700 font-semibold">
                {mutedUntil === -1 ? 'Muted forever' : `Muted until ${new Date(mutedUntil).toLocaleString()}`}
              </p>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="px-4 mt-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Participants ({conversation.participants.length})</h3>
                {isAdmin && (
                  <button 
                    onClick={() => setIsAddMemberOpen(true)}
                    className="text-green-600 text-xs font-black hover:underline uppercase"
                  >
                    Add Member
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {conversation.participants.map(participant => {
                  const isParticipantAdmin = conversation.admins?.includes(participant.id);
                  const canRemove = isAdmin && participant.id !== currentUserId;
                  const canTransferAdmin = isAdmin && !isParticipantAdmin && participant.id !== currentUserId;
                  const canRemoveAdmin = isAdmin && isParticipantAdmin && participant.id !== currentUserId && conversation.admins && conversation.admins.length > 1;

                  return (
                    <div key={participant.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-2xl transition-colors">
                      <div className="flex items-center flex-1 min-w-0">
                        <img 
                          src={participant.avatar === 'gemini' ? 'https://aistudiocdn.com/logo/gemini-sparkle.png' : participant.avatar} 
                          className="h-11 w-11 rounded-full mr-4 border-2 border-slate-100 shrink-0" 
                          alt={participant.name}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] font-bold text-slate-800 truncate">
                              {participant.id === currentUserId ? 'You' : participant.name}
                            </p>
                            {isParticipantAdmin && (
                              <span className="text-[10px] font-black text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-bold text-slate-400 truncate">
                            {participant.username || participant.email || 'No username'}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          {canTransferAdmin && (
                            <button
                              onClick={() => onTransferAdmin(participant.id)}
                              className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-full transition-all"
                              title="Make admin"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </button>
                          )}
                          {canRemoveAdmin && (
                            <button
                              onClick={() => onRemoveAdmin(participant.id)}
                              className="text-yellow-600 hover:text-yellow-700 p-2 hover:bg-yellow-50 rounded-full transition-all"
                              title="Remove admin"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </button>
                          )}
                          {canRemove && (
                            <button
                              onClick={() => handleRemoveMemberClick(participant)}
                              className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-all"
                              title="Remove member"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                          {participant.id !== currentUserId && (
                            <div className="flex flex-col gap-1 ml-1">
                              <button
                                onClick={async () => {
                                  const confirmed = window.confirm(
                                    `Block ${participant.name || participant.username || 'this user'}? You won't receive messages from them.`
                                  );
                                  if (!confirmed) return;
                                  try {
                                    await blockUser(currentUserId, participant.id);
                                    alert('User blocked');
                                  } catch (error) {
                                    console.error('Error blocking user:', error);
                                    alert('Could not block user. Please try again.');
                                  }
                                }}
                                className="text-[10px] font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 px-2 py-0.5 rounded-full transition-colors"
                              >
                                Block
                              </button>
                              <button
                                onClick={async () => {
                                  const reason = window.prompt(
                                    `Report ${participant.name || participant.username || 'this user'}?\n\nDescribe the issue:`
                                  );
                                  if (!reason) return;
                                  try {
                                    await reportUser(currentUserId, participant.id, {
                                      conversationId: conversation.id,
                                      reason,
                                    });
                                    alert('Report submitted');
                                  } catch (error) {
                                    console.error('Error reporting user:', error);
                                    alert('Could not submit report. Please try again.');
                                  }
                                }}
                                className="text-[10px] font-bold text-slate-400 hover:text-amber-600 hover:bg-amber-50 px-2 py-0.5 rounded-full transition-colors"
                              >
                                Report
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Group Actions */}
          <div className="mt-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="space-y-4">
              {/* Notification preferences */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Notifications
                  </span>
                  <span className="text-[13px] font-bold text-slate-800">
                    {renderNotificationLevelLabel(notificationLevel)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['all', 'mentions', 'none'] as ConversationNotificationLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => handleNotificationChange(level)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                        notificationLevel === level
                          ? 'bg-green-600 text-white border-green-600 shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {level === 'all' ? 'All' : level === 'mentions' ? '@ Mentions' : 'None'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsMuteModalOpen(true)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-slate-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="text-[15px] font-bold text-slate-800">
                    {isMuted ? 'Unmute Group' : 'Mute Group'}
                  </span>
                </div>
                {isMuted && (
                  <span className="text-xs text-yellow-600 font-semibold">Muted</span>
                )}
              </button>

              {/* Simple theme controls */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Theme
                  </span>
                  <span className="text-[13px] font-bold text-slate-800">
                    Accent & background
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {['#16a34a', '#0ea5e9', '#e11d48'].map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        onUpdate({
                          theme: {
                            ...(conversation.theme || {}),
                            accentColor: color,
                          },
                        })
                      }
                      className="h-6 w-6 rounded-full border border-white shadow-sm hover:ring-2 hover:ring-slate-200 transition-all"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={onLeaveGroup}
                className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-xl transition-colors text-red-600"
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-[15px] font-bold">Leave Group</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Media & Content Tabs */}
        <div className="mt-8 bg-white border-t border-slate-100 shadow-sm">
          <div className="flex items-center px-6 space-x-8 border-b border-slate-50 overflow-x-auto no-scrollbar scroll-smooth">
            {tabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all shrink-0 ${
                  activeTab === tab ? 'text-green-600 border-green-600' : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content Grid */}
          <div className="min-h-[260px] bg-slate-50">
            {activeTab === 'Media' && (
              <div className="p-0.5 grid grid-cols-3 gap-0.5">
                {activeMedia.length === 0 ? (
                  <div className="col-span-3 flex items-center justify-center py-10 text-xs font-semibold text-slate-400">
                    No media shared yet
                  </div>
                ) : (
                  activeMedia.map((msg) => (
                    <div
                      key={msg.id}
                      className="aspect-square bg-slate-200 overflow-hidden relative group cursor-pointer border border-white/10"
                    >
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                          alt="Shared media content"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-green-900/0 group-hover:bg-green-900/10 transition-colors" />
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'Files' && (
              <div className="p-3 space-y-2">
                {activeFiles.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-xs font-semibold text-slate-400">
                    No files shared yet
                  </div>
                ) : (
                  activeFiles.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-center justify-between px-3 py-2 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-bold text-slate-800 truncate">
                          {msg.file?.name || 'File'}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                          {msg.file?.size} {msg.file?.type && `• ${msg.file.type}`}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 shrink-0">
                        {new Date(msg.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab !== 'Media' && activeTab !== 'Files' && (
              <div className="flex items-center justify-center py-10 text-xs font-semibold text-slate-400">
                {activeTab} view coming soon
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAddMemberOpen && (
        <AddMemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          onAddMember={handleAddMember}
          availableUsers={availableUsers.filter(u => 
            !conversation.participants.some(p => p.id === u.id)
          )}
          currentUserId={currentUserId}
        />
      )}

      {isRemoveMemberOpen && memberToRemove && (
        <RemoveMemberModal
          isOpen={isRemoveMemberOpen}
          onClose={() => {
            setIsRemoveMemberOpen(false);
            setMemberToRemove(null);
          }}
          onConfirm={handleConfirmRemoveMember}
          member={memberToRemove}
        />
      )}

      {isAvatarPickerOpen && (
        <GroupAvatarPicker
          isOpen={isAvatarPickerOpen}
          onClose={() => setIsAvatarPickerOpen(false)}
          onSave={handleAvatarChange}
          currentAvatar={conversation.avatar}
        />
      )}

      {isDescriptionModalOpen && (
        <EditDescriptionModal
          isOpen={isDescriptionModalOpen}
          onClose={() => setIsDescriptionModalOpen(false)}
          onSave={handleDescriptionChange}
          currentDescription={conversation.description || ''}
        />
      )}

      {isMuteModalOpen && (
        <MuteOptionsModal
          isOpen={isMuteModalOpen}
          onClose={() => setIsMuteModalOpen(false)}
          onMute={handleMute}
          onUnmute={isMuted ? onUnmuteGroup : undefined}
          currentMutedUntil={mutedUntil}
        />
      )}
    </div>
  );
};
