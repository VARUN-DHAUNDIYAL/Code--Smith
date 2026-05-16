"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Users,
  UserPlus,
  UserMinus,
  Mail,
  Eye,
  Edit3,
  Crown,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCollaboration } from '../hooks/useCollaboration';

interface CollaborationPanelProps {
  playgroundId: string;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  lastSeen: Date;
  cursorPosition?: { line: number; column: number };
  activeFile?: string;
  color: string;
}

export function CollaborationPanel({
  playgroundId,
  currentUserId,
  isOpen,
  onClose,
}: CollaborationPanelProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'editor' | 'viewer'>('editor');
  const [isSharing, setIsSharing] = useState(false);

  const {
    isEnabled,
    collaborators,
    currentUser,
    isConnected,
    connectionStatus,
    enableCollaboration,
    disableCollaboration,
    addCollaborator,
    removeCollaborator,
    sharePlayground,
  } = useCollaboration(playgroundId, currentUserId);

  const handleShare = useCallback(async () => {
    if (!shareEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSharing(true);
    try {
      await sharePlayground(shareEmail.trim(), shareRole);
      setShareEmail('');
      setShareRole('editor');
      setIsShareDialogOpen(false);
    } catch (error) {
      console.error('Error sharing playground:', error);
    } finally {
      setIsSharing(false);
    }
  }, [shareEmail, shareRole, sharePlayground]);

  const handleRemoveCollaborator = useCallback(async (collaboratorId: string) => {
    try {
      removeCollaborator(collaboratorId);
      toast.success('Collaborator removed');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
    }
  }, [removeCollaborator]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'editor':
        return <Edit3 className="h-3 w-3 text-blue-500" />;
      case 'viewer':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaboration
          </DialogTitle>
          <DialogDescription>
            Manage collaborators and real-time editing for this playground.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <Button
              variant={isEnabled ? 'destructive' : 'default'}
              size="sm"
              onClick={isEnabled ? disableCollaboration : enableCollaboration}
            >
              {isEnabled ? 'Disable' : 'Enable'} Collaboration
            </Button>
          </div>

          {/* Current User */}
          {currentUser && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback className="text-xs">
                    {currentUser.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{currentUser.name}</span>
                    <Badge variant="outline" className={getRoleColor(currentUser.role)}>
                      {getRoleIcon(currentUser.role)}
                      <span className="ml-1">{currentUser.role}</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          )}

          {/* Collaborators List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Collaborators ({collaborators.length})</h3>
              <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Playground</DialogTitle>
                    <DialogDescription>
                      Invite someone to collaborate on this playground.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="colleague@example.com"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={shareRole} onValueChange={(value: 'editor' | 'viewer') => setShareRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">
                            <div className="flex items-center gap-2">
                              <Edit3 className="h-4 w-4" />
                              Editor - Can edit files
                            </div>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Viewer - Read only
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleShare} disabled={isSharing}>
                      {isSharing ? 'Sharing...' : 'Share'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {collaborators.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No collaborators yet</p>
                <p className="text-xs">Share this playground to start collaborating</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={collaborator.avatar} />
                      <AvatarFallback className="text-xs">
                        {collaborator.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{collaborator.name}</span>
                        <Badge variant="outline" className={getRoleColor(collaborator.role)}>
                          {getRoleIcon(collaborator.role)}
                          <span className="ml-1">{collaborator.role}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{collaborator.email}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatLastSeen(collaborator.lastSeen)}
                        </span>
                      </div>
                      {collaborator.activeFile && (
                        <p className="text-xs text-blue-600 mt-1">
                          Editing: {collaborator.activeFile}
                        </p>
                      )}
                    </div>
                                         <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${new Date().getTime() - collaborator.lastSeen.getTime() < 30000 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      {currentUser?.role === 'owner' && collaborator.id !== currentUser.id && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveCollaborator(collaborator.id)}
                              >
                                <UserMinus className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove collaborator</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connection Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Status: {connectionStatus}</p>
            <p>Real-time collaboration is {isEnabled ? 'enabled' : 'disabled'}</p>
            {isConnected && (
              <p>Connected to {collaborators.length + 1} user(s)</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 