"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

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

interface CollaborationState {
  isEnabled: boolean;
  collaborators: Collaborator[];
  currentUser: Collaborator | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

interface UseCollaborationReturn extends CollaborationState {
  enableCollaboration: () => void;
  disableCollaboration: () => void;
  addCollaborator: (collaborator: Omit<Collaborator, 'id' | 'lastSeen' | 'color'>) => void;
  removeCollaborator: (collaboratorId: string) => void;
  updateCursorPosition: (position: { line: number; column: number }) => void;
  updateActiveFile: (fileId: string) => void;
  sendMessage: (message: string) => void;
  sharePlayground: (email: string, role: 'editor' | 'viewer') => Promise<void>;
}

// WebSocket connection for real-time updates
class CollaborationWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string;
  private onMessage: (data: any) => void;
  private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

  constructor(
    url: string,
    onMessage: (data: any) => void,
    onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void
  ) {
    this.url = url;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
  }

  connect() {
    try {
      this.onStatusChange('connecting');
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('Collaboration WebSocket connected');
        this.onStatusChange('connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Collaboration WebSocket disconnected');
        this.onStatusChange('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Collaboration WebSocket error:', error);
        this.onStatusChange('error');
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.onStatusChange('error');
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.onStatusChange('error');
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected, cannot send message');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const useCollaboration = (playgroundId: string, currentUserId: string): UseCollaborationReturn => {
  const [state, setState] = useState<CollaborationState>({
    isEnabled: false,
    collaborators: [],
    currentUser: null,
    isConnected: false,
    connectionStatus: 'disconnected'
  });

  const wsRef = useRef<CollaborationWebSocket | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a random color for the collaborator
  const generateCollaboratorColor = useCallback(() => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'collaborator_joined':
        setState(prev => ({
          ...prev,
          collaborators: [...prev.collaborators, {
            ...data.collaborator,
            lastSeen: new Date(),
            color: generateCollaboratorColor()
          }]
        }));
        toast.success(`${data.collaborator.name} joined the playground`);
        break;

      case 'collaborator_left':
        setState(prev => ({
          ...prev,
          collaborators: prev.collaborators.filter(c => c.id !== data.collaboratorId)
        }));
        const leftCollaborator = state.collaborators.find(c => c.id === data.collaboratorId);
        if (leftCollaborator) {
          toast.info(`${leftCollaborator.name} left the playground`);
        }
        break;

      case 'cursor_update':
        setState(prev => ({
          ...prev,
          collaborators: prev.collaborators.map(c => 
            c.id === data.collaboratorId 
              ? { ...c, cursorPosition: data.position, lastSeen: new Date() }
              : c
          )
        }));
        break;

      case 'file_change':
        setState(prev => ({
          ...prev,
          collaborators: prev.collaborators.map(c => 
            c.id === data.collaboratorId 
              ? { ...c, activeFile: data.fileId, lastSeen: new Date() }
              : c
          )
        }));
        break;

      case 'chat_message':
        // Handle chat messages
        console.log('Chat message received:', data.message);
        break;

      case 'presence_update':
        setState(prev => ({
          ...prev,
          collaborators: prev.collaborators.map(c => 
            c.id === data.collaboratorId 
              ? { ...c, lastSeen: new Date() }
              : c
          )
        }));
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, [state.collaborators, generateCollaboratorColor]);

  // Handle WebSocket status changes
  const handleStatusChange = useCallback((status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    setState(prev => ({
      ...prev,
      connectionStatus: status,
      isConnected: status === 'connected'
    }));

    if (status === 'connected') {
      toast.success('Collaboration connected');
    } else if (status === 'error') {
      toast.error('Collaboration connection failed');
    }
  }, []);

  // Enable collaboration
  const enableCollaboration = useCallback(() => {
    if (!playgroundId || !currentUserId) {
      toast.error('Cannot enable collaboration: missing playground ID or user ID');
      return;
    }

    setState(prev => ({ ...prev, isEnabled: true }));

    const collaborationWsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!collaborationWsUrl) {
      setState(prev => ({
        ...prev,
        isEnabled: false,
        connectionStatus: 'error',
        isConnected: false,
      }));
      toast.error('Real-time collaboration is not configured for this deployment');
      return;
    }

    // Create WebSocket connection
    const wsUrl = `${collaborationWsUrl.replace(/\/$/, '')}/collaboration/${playgroundId}`;
    wsRef.current = new CollaborationWebSocket(wsUrl, handleWebSocketMessage, handleStatusChange);
    wsRef.current.connect();

    // Set up heartbeat
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current && state.isConnected) {
        wsRef.current.send({
          type: 'heartbeat',
          userId: currentUserId,
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Send heartbeat every 30 seconds

    // Initialize current user
    setState(prev => ({
      ...prev,
      currentUser: {
        id: currentUserId,
        name: 'Current User', // This should come from user context
        email: 'user@example.com', // This should come from user context
        role: 'owner',
        lastSeen: new Date(),
        color: generateCollaboratorColor()
      }
    }));
  }, [playgroundId, currentUserId, handleWebSocketMessage, handleStatusChange, state.isConnected, generateCollaboratorColor]);

  // Disable collaboration
  const disableCollaboration = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: false, collaborators: [] }));

    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    toast.info('Collaboration disabled');
  }, []);

  // Add collaborator
  const addCollaborator = useCallback((collaborator: Omit<Collaborator, 'id' | 'lastSeen' | 'color'>) => {
    const newCollaborator: Collaborator = {
      ...collaborator,
      id: `temp-${Date.now()}`, // This will be replaced with real ID from server
      lastSeen: new Date(),
      color: generateCollaboratorColor()
    };

    setState(prev => ({
      ...prev,
      collaborators: [...prev.collaborators, newCollaborator]
    }));

    // Send to server
    if (wsRef.current) {
      wsRef.current.send({
        type: 'add_collaborator',
        collaborator: newCollaborator
      });
    }
  }, [generateCollaboratorColor]);

  // Remove collaborator
  const removeCollaborator = useCallback((collaboratorId: string) => {
    setState(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c.id !== collaboratorId)
    }));

    // Send to server
    if (wsRef.current) {
      wsRef.current.send({
        type: 'remove_collaborator',
        collaboratorId
      });
    }
  }, []);

  // Update cursor position
  const updateCursorPosition = useCallback((position: { line: number; column: number }) => {
    setState(prev => ({
      ...prev,
      currentUser: prev.currentUser ? { ...prev.currentUser, cursorPosition: position } : null
    }));

    // Send to server
    if (wsRef.current && state.isConnected) {
      wsRef.current.send({
        type: 'cursor_update',
        position,
        userId: currentUserId
      });
    }
  }, [currentUserId, state.isConnected]);

  // Update active file
  const updateActiveFile = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      currentUser: prev.currentUser ? { ...prev.currentUser, activeFile: fileId } : null
    }));

    // Send to server
    if (wsRef.current && state.isConnected) {
      wsRef.current.send({
        type: 'file_change',
        fileId,
        userId: currentUserId
      });
    }
  }, [currentUserId, state.isConnected]);

  // Send message
  const sendMessage = useCallback((message: string) => {
    if (wsRef.current && state.isConnected) {
      wsRef.current.send({
        type: 'chat_message',
        message,
        userId: currentUserId,
        timestamp: new Date().toISOString()
      });
    }
  }, [currentUserId, state.isConnected]);

  // Share playground
  const sharePlayground = useCallback(async (email: string, role: 'editor' | 'viewer') => {
    try {
      const response = await fetch('/api/collaboration/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playgroundId,
          email,
          role
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to share playground');
      }

      const data = await response.json();
      toast.success(`Playground shared with ${email}`);
      
      // Add to local collaborators list
      addCollaborator({
        name: email.split('@')[0], // Use email prefix as name
        email,
        role,
        avatar: undefined
      });

      return data;
    } catch (error) {
      console.error('Error sharing playground:', error);
      toast.error('Failed to share playground');
      throw error;
    }
  }, [playgroundId, addCollaborator]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    enableCollaboration,
    disableCollaboration,
    addCollaborator,
    removeCollaborator,
    updateCursorPosition,
    updateActiveFile,
    sendMessage,
    sharePlayground
  };
}; 
