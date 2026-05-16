"use client";

import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const AddRepo = () => {
  const router = useRouter();
  const [repos, setRepos] = useState<
    { id: number; full_name: string; name: string; private: boolean; owner: { login: string } }[]
  >([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getCookie(name: string) {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  }

  const handleOpenGithub = async () => {
    const token = getCookie("github_token");
    if (!token) {
      const listener = (event: MessageEvent) => {
        if (event.data === "github-auth-success") {
          window.removeEventListener("message", listener);
          fetchRepos();
        }
      };
      window.addEventListener("message", listener);

      const popup = window.open(
        "/api/github/login",
        "github-oauth",
        "width=600,height=700"
      );
      if (!popup) {
        toast.error("Popup blocked. Please allow popups for this site.");
        window.removeEventListener("message", listener);
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
      const res = await fetch("/api/github/repos");
      if (!res.ok) throw new Error("Failed to fetch repositories");
      const data = await res.json();
      setRepos(data);
      setShowModal(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch repos";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = async (repo: {
    full_name: string;
    name: string;
    owner: { login: string };
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/github/import-playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repo.owner.login,
          repo: repo.name,
          title: repo.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import repository");
      }

      toast.success(
        `Imported ${data.importedFiles} file(s) from ${repo.full_name}`
      );
      setShowModal(false);
      router.push(`/playground/${data.playgroundId}`);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to import repository";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="group px-6 py-6 flex flex-row justify-between items-center border rounded-lg bg-muted cursor-pointer transition-all duration-300 ease-in-out hover:bg-background hover:border-cyan-500 hover:scale-[1.02] shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)]"
        onClick={handleOpenGithub}
      >
        <div className="flex flex-row justify-center items-start gap-4">
          <Button
            variant="outline"
            className="flex justify-center items-center bg-white group-hover:bg-cyan-50 group-hover:border-cyan-500 group-hover:text-cyan-500 transition-colors duration-300"
            size="icon"
          >
            <ArrowDown
              size={30}
              className="transition-transform duration-300 group-hover:translate-y-1"
            />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-cyan-600">
              Open Github Repository
            </h1>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              Import a repo into a new playground workspace
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden">
          <Image
            src="/github.svg"
            alt="Open GitHub repository"
            width={150}
            height={150}
            className="transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 max-w-lg w-full shadow-lg border">
            <h2 className="text-lg font-bold mb-4">Select a GitHub Repository</h2>
            {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {error && <p className="text-sm text-destructive mb-2">{error}</p>}
            <ul className="max-h-64 overflow-y-auto">
              {repos.map((repo) => (
                <li key={repo.id} className="mb-2">
                  <button
                    type="button"
                    className="text-left w-full px-3 py-2 rounded hover:bg-muted border"
                    onClick={() => handleRepoSelect(repo)}
                    disabled={loading}
                  >
                    <span className="font-semibold">{repo.full_name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {repo.private ? "Private" : "Public"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddRepo;