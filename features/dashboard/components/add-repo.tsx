'use client';

import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const AddRepo = () => {
  const [repos, setRepos] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getCookie(name: string) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  const handleOpenGithub = async () => {
    const token = getCookie('github_token');
    if (!token) {
      // Listen for message from popup BEFORE opening it
      const listener = (event: MessageEvent) => {
        console.log('Received message from popup:', event.data);
        if (event.data === 'github-auth-success') {
          window.removeEventListener('message', listener);
          console.log('GitHub OAuth success message received. Fetching repos...');
          fetchRepos();
        }
      };
      window.addEventListener('message', listener);

      const popup = window.open(
        '/api/github/login',
        'github-oauth',
        'width=600,height=700'
      );
      if (!popup) {
        alert('Popup blocked! Please allow popups for this site.');
        window.removeEventListener('message', listener);
        return;
      }
      return;
    }
    fetchRepos();
  };

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching GitHub repos...');
      const res = await fetch('/api/github/repos');
      if (!res.ok) throw new Error('Failed to fetch repos');
      const data = await res.json();
      setRepos(data);
      setShowModal(true);
      console.log('Repos fetched and modal shown.');
    } catch (e: any) {
      setError(e.message);
      console.error('Error fetching repos:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = async (repo: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/github/repo-contents?owner=${repo.owner.login}&repo=${repo.name}`);
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setError('Failed to parse response');
        console.error('Failed to parse response:', jsonErr);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Failed to fetch repo contents');
        console.error('Error fetching repo contents:', data);
        setLoading(false);
        return;
      }
      // For now, just log the file tree. You can integrate with your editor here.
      console.log('Repo file tree:', data);
      alert(`Loaded repo: ${repo.full_name}. Check console for file tree.`);
      setShowModal(false);
    } catch (e: any) {
      setError(e.message);
      console.error('Error fetching repo contents:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div
        className="group px-6 py-6 flex flex-row justify-between items-center border rounded-lg bg-muted cursor-pointer \
        transition-all duration-300 ease-in-out hover:bg-background hover:border-cyan-500 hover:scale-[1.02] shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)]"
        onClick={handleOpenGithub}
    >
      <div className="flex flex-row justify-center items-start gap-4">
        <Button
          variant={"outline"}
          className="flex justify-center items-center bg-white group-hover:bg-cyan-50 group-hover:border-cyan-500 group-hover:text-cyan-500 transition-colors duration-300"
          size={"icon"}
        >
          <ArrowDown size={30} className="transition-transform duration-300 group-hover:translate-y-1" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-cyan-600">Open Github Repository</h1>
          <p className="text-sm text-muted-foreground max-w-[220px]">Work with your repositories in our editor</p>
        </div>
      </div>
      <div className="relative overflow-hidden">
        <Image
          src={"/github.svg"}
          alt="Open GitHub repository"
          width={150}
          height={150}
          className="transition-transform duration-300 group-hover:scale-110"
        />
      </div>
    </div>
      {/* Simple Modal for Repo Picker */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg">
            <h2 className="text-lg font-bold mb-4">Select a GitHub Repository</h2>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            <ul className="max-h-64 overflow-y-auto">
              {repos.map((repo) => (
                <li key={repo.id} className="mb-2">
                  <button
                    className="text-left w-full px-3 py-2 rounded hover:bg-gray-100 border border-gray-200"
                    onClick={() => handleRepoSelect(repo)}
                  >
                    <span className="font-semibold">{repo.full_name}</span>
                    <span className="ml-2 text-xs text-gray-500">{repo.private ? 'Private' : 'Public'}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddRepo;
