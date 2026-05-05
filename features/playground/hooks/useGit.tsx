"use client";

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: string[];
}

interface GitStatus {
  branch: string;
  status: 'clean' | 'modified' | 'conflict';
  stagedFiles: string[];
  unstagedFiles: string[];
  untrackedFiles: string[];
  commits: GitCommit[];
  ahead: number;
  behind: number;
  remoteUrl?: string;
}

interface GitConfig {
  user: {
    name: string;
    email: string;
  };
  remote: {
    origin?: string;
  };
}

interface UseGitReturn {
  status: GitStatus;
  config: GitConfig | null;
  isLoading: boolean;
  error: string | null;
  
  // Basic Git operations
  init: () => Promise<void>;
  add: (files?: string[]) => Promise<void>;
  commit: (message: string) => Promise<void>;
  push: (branch?: string) => Promise<void>;
  pull: (branch?: string) => Promise<void>;
  fetch: () => Promise<void>;
  
  // File operations
  stageFile: (file: string) => Promise<void>;
  unstageFile: (file: string) => Promise<void>;
  discardChanges: (file: string) => Promise<void>;
  
  // Branch operations
  createBranch: (name: string) => Promise<void>;
  switchBranch: (name: string) => Promise<void>;
  deleteBranch: (name: string) => Promise<void>;
  listBranches: () => Promise<string[]>;
  
  // History and diff
  getCommitHistory: (limit?: number) => Promise<GitCommit[]>;
  getDiff: (file?: string) => Promise<string>;
  getFileHistory: (file: string) => Promise<GitCommit[]>;
  
  // Configuration
  setUserConfig: (name: string, email: string) => Promise<void>;
  addRemote: (name: string, url: string) => Promise<void>;
  removeRemote: (name: string) => Promise<void>;
  
  // Status and refresh
  refreshStatus: () => Promise<void>;
  reset: (commit?: string) => Promise<void>;
}

export const useGit = (webContainerInstance: any): UseGitReturn => {
  const [status, setStatus] = useState<GitStatus>({
    branch: 'main',
    status: 'clean',
    stagedFiles: [],
    unstagedFiles: [],
    untrackedFiles: [],
    commits: [],
    ahead: 0,
    behind: 0
  });
  
  const [config, setConfig] = useState<GitConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastCommandRef = useRef<string>('');

  // Helper function to execute Git commands
  const executeGitCommand = useCallback(async (command: string, args: string[] = []): Promise<string> => {
    if (!webContainerInstance) {
      throw new Error('WebContainer instance not available');
    }

    setIsLoading(true);
    setError(null);
    lastCommandRef.current = `git ${command} ${args.join(' ')}`.trim();

    try {
      const process = await webContainerInstance.spawn('git', [command, ...args]);
      
      let output = '';
      let errorOutput = '';

      // Collect output
      process.output.pipeTo(
        new WritableStream({
          write(chunk) {
            output += chunk;
          }
        })
      );

      // Collect error output
      process.stderr?.pipeTo(
        new WritableStream({
          write(chunk) {
            errorOutput += chunk;
          }
        })
      );

      const exitCode = await process.exit;

      if (exitCode !== 0 && errorOutput) {
        throw new Error(`Git command failed: ${errorOutput}`);
      }

      return output.trim();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown Git error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [webContainerInstance]);

  // Initialize Git repository
  const init = useCallback(async () => {
    try {
      await executeGitCommand('init');
      await refreshStatus();
      toast.success('Git repository initialized');
    } catch (error) {
      console.error('Error initializing Git repository:', error);
      toast.error('Failed to initialize Git repository');
      throw error;
    }
  }, [executeGitCommand]);

  // Add files to staging area
  const add = useCallback(async (files?: string[]) => {
    try {
      const args = files && files.length > 0 ? files : ['.'];
      await executeGitCommand('add', args);
      await refreshStatus();
      toast.success(`Added ${files ? files.length : 'all'} files to staging`);
    } catch (error) {
      console.error('Error adding files:', error);
      toast.error('Failed to add files');
      throw error;
    }
  }, [executeGitCommand]);

  // Commit staged changes
  const commit = useCallback(async (message: string) => {
    try {
      await executeGitCommand('commit', ['-m', message]);
      await refreshStatus();
      toast.success('Changes committed successfully');
    } catch (error) {
      console.error('Error committing changes:', error);
      toast.error('Failed to commit changes');
      throw error;
    }
  }, [executeGitCommand]);

  // Push to remote repository
  const push = useCallback(async (branch?: string) => {
    try {
      const args = branch ? ['origin', branch] : ['origin'];
      await executeGitCommand('push', args);
      await refreshStatus();
      toast.success('Changes pushed successfully');
    } catch (error) {
      console.error('Error pushing changes:', error);
      toast.error('Failed to push changes');
      throw error;
    }
  }, [executeGitCommand]);

  // Pull from remote repository
  const pull = useCallback(async (branch?: string) => {
    try {
      const args = branch ? ['origin', branch] : ['origin'];
      await executeGitCommand('pull', args);
      await refreshStatus();
      toast.success('Changes pulled successfully');
    } catch (error) {
      console.error('Error pulling changes:', error);
      toast.error('Failed to pull changes');
      throw error;
    }
  }, [executeGitCommand]);

  // Fetch from remote repository
  const fetch = useCallback(async () => {
    try {
      await executeGitCommand('fetch');
      await refreshStatus();
      toast.success('Remote changes fetched');
    } catch (error) {
      console.error('Error fetching changes:', error);
      toast.error('Failed to fetch changes');
      throw error;
    }
  }, [executeGitCommand]);

  // Stage specific file
  const stageFile = useCallback(async (file: string) => {
    try {
      await executeGitCommand('add', [file]);
      await refreshStatus();
      toast.success(`Staged ${file}`);
    } catch (error) {
      console.error('Error staging file:', error);
      toast.error(`Failed to stage ${file}`);
      throw error;
    }
  }, [executeGitCommand]);

  // Unstage specific file
  const unstageFile = useCallback(async (file: string) => {
    try {
      await executeGitCommand('reset', ['HEAD', file]);
      await refreshStatus();
      toast.success(`Unstaged ${file}`);
    } catch (error) {
      console.error('Error unstaging file:', error);
      toast.error(`Failed to unstage ${file}`);
      throw error;
    }
  }, [executeGitCommand]);

  // Discard changes in file
  const discardChanges = useCallback(async (file: string) => {
    try {
      await executeGitCommand('checkout', ['--', file]);
      await refreshStatus();
      toast.success(`Discarded changes in ${file}`);
    } catch (error) {
      console.error('Error discarding changes:', error);
      toast.error(`Failed to discard changes in ${file}`);
      throw error;
    }
  }, [executeGitCommand]);

  // Create new branch
  const createBranch = useCallback(async (name: string) => {
    try {
      await executeGitCommand('checkout', ['-b', name]);
      await refreshStatus();
      toast.success(`Created and switched to branch ${name}`);
    } catch (error) {
      console.error('Error creating branch:', error);
      toast.error(`Failed to create branch ${name}`);
      throw error;
    }
  }, [executeGitCommand]);

  // Switch to branch
  const switchBranch = useCallback(async (name: string) => {
    try {
      await executeGitCommand('checkout', [name]);
      await refreshStatus();
      toast.success(`Switched to branch ${name}`);
    } catch (error) {
      console.error('Error switching branch:', error);
      toast.error(`Failed to switch to branch ${name}`);
      throw error;
    }
  }, [executeGitCommand]);

  // Delete branch
  const deleteBranch = useCallback(async (name: string) => {
    try {
      await executeGitCommand('branch', ['-d', name]);
      await refreshStatus();
      toast.success(`Deleted branch ${name}`);
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error(`Failed to delete branch ${name}`);
      throw error;
    }
  }, [executeGitCommand]);

  // List branches
  const listBranches = useCallback(async (): Promise<string[]> => {
    try {
      const output = await executeGitCommand('branch', ['--list']);
      return output.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^\*?\s*/, '')); // Remove asterisk and spaces
    } catch (error) {
      console.error('Error listing branches:', error);
      return [];
    }
  }, [executeGitCommand]);

  // Get commit history
  const getCommitHistory = useCallback(async (limit: number = 10): Promise<GitCommit[]> => {
    try {
      const output = await executeGitCommand('log', [
        '--pretty=format:%H|%s|%an|%ad|%n',
        '--date=iso',
        `-${limit}`
      ]);

      return output.split('\n\n')
        .filter(commit => commit.trim())
        .map(commit => {
          const [hash, message, author, date] = commit.split('|');
          return {
            hash,
            message,
            author,
            date: new Date(date),
            files: [] // Could be enhanced to include file changes
          };
        });
    } catch (error) {
      console.error('Error getting commit history:', error);
      return [];
    }
  }, [executeGitCommand]);

  // Get diff for file or all changes
  const getDiff = useCallback(async (file?: string): Promise<string> => {
    try {
      const args = file ? ['--', file] : [];
      return await executeGitCommand('diff', args);
    } catch (error) {
      console.error('Error getting diff:', error);
      return '';
    }
  }, [executeGitCommand]);

  // Get file history
  const getFileHistory = useCallback(async (file: string): Promise<GitCommit[]> => {
    try {
      const output = await executeGitCommand('log', [
        '--pretty=format:%H|%s|%an|%ad',
        '--date=iso',
        '--follow',
        '--', file
      ]);

      return output.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, message, author, date] = line.split('|');
          return {
            hash,
            message,
            author,
            date: new Date(date),
            files: [file]
          };
        });
    } catch (error) {
      console.error('Error getting file history:', error);
      return [];
    }
  }, [executeGitCommand]);

  // Set user configuration
  const setUserConfig = useCallback(async (name: string, email: string) => {
    try {
      await executeGitCommand('config', ['user.name', name]);
      await executeGitCommand('config', ['user.email', email]);
      await loadConfig();
      toast.success('Git user configuration updated');
    } catch (error) {
      console.error('Error setting user config:', error);
      toast.error('Failed to update Git user configuration');
      throw error;
    }
  }, [executeGitCommand]);

  // Add remote repository
  const addRemote = useCallback(async (name: string, url: string) => {
    try {
      await executeGitCommand('remote', ['add', name, url]);
      await loadConfig();
      toast.success(`Added remote ${name}`);
    } catch (error) {
      console.error('Error adding remote:', error);
      toast.error(`Failed to add remote ${name}`);
      throw error;
    }
  }, [executeGitCommand]);

  // Remove remote repository
  const removeRemote = useCallback(async (name: string) => {
    try {
      await executeGitCommand('remote', ['remove', name]);
      await loadConfig();
      toast.success(`Removed remote ${name}`);
    } catch (error) {
      console.error('Error removing remote:', error);
      toast.error(`Failed to remove remote ${name}`);
      throw error;
    }
  }, [executeGitCommand]);

  // Load Git configuration
  const loadConfig = useCallback(async () => {
    try {
      const userName = await executeGitCommand('config', ['user.name']);
      const userEmail = await executeGitCommand('config', ['user.email']);
      const remoteUrl = await executeGitCommand('config', ['--get', 'remote.origin.url']);

      setConfig({
        user: {
          name: userName,
          email: userEmail
        },
        remote: {
          origin: remoteUrl || undefined
        }
      });
    } catch (error) {
      console.error('Error loading Git config:', error);
      setConfig(null);
    }
  }, [executeGitCommand]);

  // Refresh Git status
  const refreshStatus = useCallback(async () => {
    try {
      // Get current branch
      const branch = await executeGitCommand('branch', ['--show-current']);
      
      // Get status
      const statusOutput = await executeGitCommand('status', ['--porcelain']);
      const lines = statusOutput.split('\n').filter(line => line.trim());
      
      const stagedFiles: string[] = [];
      const unstagedFiles: string[] = [];
      const untrackedFiles: string[] = [];

      lines.forEach(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        
        if (status[0] === 'A' || status[0] === 'M') {
          stagedFiles.push(file);
        }
        if (status[1] === 'M' || status[1] === 'D') {
          unstagedFiles.push(file);
        }
        if (status === '??') {
          untrackedFiles.push(file);
        }
      });

      // Get commit history
      const commits = await getCommitHistory(5);

      // Determine status
      let status: 'clean' | 'modified' | 'conflict' = 'clean';
      if (unstagedFiles.length > 0 || untrackedFiles.length > 0) {
        status = 'modified';
      }

      setStatus({
        branch: branch || 'main',
        status,
        stagedFiles,
        unstagedFiles,
        untrackedFiles,
        commits,
        ahead: 0, // Could be enhanced to check remote
        behind: 0
      });

      // Load config if not already loaded
      if (!config) {
        await loadConfig();
      }
    } catch (error) {
      console.error('Error refreshing Git status:', error);
      // If Git is not initialized, set default status
      setStatus({
        branch: 'main',
        status: 'clean',
        stagedFiles: [],
        unstagedFiles: [],
        untrackedFiles: [],
        commits: [],
        ahead: 0,
        behind: 0
      });
    }
  }, [executeGitCommand, getCommitHistory, config, loadConfig]);

  // Reset to specific commit
  const reset = useCallback(async (commit?: string) => {
    try {
      const args = commit ? ['--hard', commit] : ['--hard', 'HEAD'];
      await executeGitCommand('reset', args);
      await refreshStatus();
      toast.success(`Reset to ${commit || 'HEAD'}`);
    } catch (error) {
      console.error('Error resetting:', error);
      toast.error('Failed to reset');
      throw error;
    }
  }, [executeGitCommand]);

  return {
    status,
    config,
    isLoading,
    error,
    init,
    add,
    commit,
    push,
    pull,
    fetch,
    stageFile,
    unstageFile,
    discardChanges,
    createBranch,
    switchBranch,
    deleteBranch,
    listBranches,
    getCommitHistory,
    getDiff,
    getFileHistory,
    setUserConfig,
    addRemote,
    removeRemote,
    refreshStatus,
    reset
  };
}; 