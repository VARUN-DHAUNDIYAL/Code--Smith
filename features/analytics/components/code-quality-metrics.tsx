"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalytics } from "@/hooks/use-analytics";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CodeQualityMetricsProps {
  userId: string;
}

export function CodeQualityMetrics({ userId }: CodeQualityMetricsProps) {
  const [selectedPlayground, setSelectedPlayground] = useState<string>("");
  const [playgrounds, setPlaygrounds] = useState<{ id: string; title: string }[]>([]);
  const { toast } = useToast();
  
  const {
    data: codeQualityData,
    isLoading,
    error,
    fetchAnalytics,
  } = useAnalytics({
    type: "code-quality",
    playgroundId: selectedPlayground,
    autoFetch: false,
  });

  // Fetch playgrounds
  useEffect(() => {
    async function fetchPlaygrounds() {
      try {
        // Use the server action instead of API route
        const playgroundsData = await fetch('/api/actions/getAllPlaygrounds');
        const playgrounds = await playgroundsData.json();

        if (!playgrounds) throw new Error("Failed to fetch playgrounds");

        setPlaygrounds(playgrounds || []);

        // Set the first playground as default if available
        if (playgrounds.length > 0 && !selectedPlayground) {
          setSelectedPlayground(playgrounds[0].id);
        }
      } catch (err) {
        console.error("Error fetching playgrounds:", err);
        toast({
          title: "Error",
          description: "Failed to load playgrounds",
          variant: "destructive",
        });
      }
    }
    
    fetchPlaygrounds();
  }, [toast, selectedPlayground]);

  // Fetch code quality data when playground changes
  useEffect(() => {
    if (selectedPlayground) {
      fetchAnalytics();
    }
  }, [selectedPlayground, fetchAnalytics]);

  if (!playgrounds.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Code Quality Metrics</CardTitle>
          <CardDescription>
            No projects available. Create a project to view code quality metrics.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Code Quality Metrics</CardTitle>
              <CardDescription>
                Analyze the quality of your code across projects
              </CardDescription>
            </div>
            <Select
              value={selectedPlayground}
              onValueChange={setSelectedPlayground}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {playgrounds.map((playground) => (
                  <SelectItem key={playground.id} value={playground.id}>
                    {playground.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-6 text-center">
              <div>
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
                <h3 className="text-lg font-medium">Error loading metrics</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : !codeQualityData || codeQualityData.length === 0 ? (
            <div className="flex items-center justify-center p-6 text-center">
              <div>
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-lg font-medium">No metrics available</h3>
                <p className="text-sm text-muted-foreground">
                  Start coding to generate code quality metrics
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium">Lines of Code</h4>
                  <span className="text-sm text-muted-foreground">
                    {codeQualityData[0]?.linesOfCode || 0} lines
                  </span>
                </div>
                <Progress value={Math.min((codeQualityData[0]?.linesOfCode || 0) / 10, 100)} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium">Code Complexity</h4>
                  <span className="text-sm text-muted-foreground">
                    {codeQualityData[0]?.complexity || 0}/10
                  </span>
                </div>
                <Progress 
                  value={((codeQualityData[0]?.complexity || 0) / 10) * 100} 
                  className={getComplexityColorClass(codeQualityData[0]?.complexity || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium">Code Duplication</h4>
                  <span className="text-sm text-muted-foreground">
                    {codeQualityData[0]?.duplications || 0}%
                  </span>
                </div>
                <Progress 
                  value={codeQualityData[0]?.duplications || 0} 
                  className={getDuplicationColorClass(codeQualityData[0]?.duplications || 0)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/40">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Bugs</CardTitle>
                      {(codeQualityData[0]?.bugs || 0) > 0 ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">{codeQualityData[0]?.bugs || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {(codeQualityData[0]?.bugs || 0) === 0 ? "No bugs detected" : "Bugs detected"}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/40">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Vulnerabilities</CardTitle>
                      {(codeQualityData[0]?.vulnerabilities || 0) > 0 ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">{codeQualityData[0]?.vulnerabilities || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {(codeQualityData[0]?.vulnerabilities || 0) === 0 ? "No vulnerabilities" : "Security issues"}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/40">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Code Smells</CardTitle>
                      {(codeQualityData[0]?.codeSmells || 0) > 5 ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (codeQualityData[0]?.codeSmells || 0) > 0 ? (
                        <AlertCircle className="h-5 w-5 text-warning" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">{codeQualityData[0]?.codeSmells || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {getCodeSmellsText(codeQualityData[0]?.codeSmells || 0)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions for UI
function getComplexityColorClass(complexity: number): string {
  if (complexity <= 3) return "bg-primary";
  if (complexity <= 7) return "bg-warning";
  return "bg-destructive";
}

function getDuplicationColorClass(duplication: number): string {
  if (duplication <= 5) return "bg-primary";
  if (duplication <= 15) return "bg-warning";
  return "bg-destructive";
}

function getCodeSmellsText(codeSmells: number): string {
  if (codeSmells === 0) return "Clean code";
  if (codeSmells <= 5) return "Minor improvements needed";
  return "Refactoring recommended";
}
