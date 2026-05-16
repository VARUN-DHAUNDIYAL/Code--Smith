import { Check, Clock, Code, Cpu } from "lucide-react";

interface AnalyticsSummaryProps {
  data: {
    totalLinesOfCode: number;
    totalAISuggestions: number;
    acceptedAISuggestions: number;
    acceptanceRate: number;
    totalProductivityTime: number;
  } | null;
}

export function AnalyticsSummary({ data }: AnalyticsSummaryProps) {
  if (!data) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  // Calculate insights
  const averageLinesPerMinute = data.totalProductivityTime > 0 
    ? (data.totalLinesOfCode / (data.totalProductivityTime / 60)).toFixed(1) 
    : "0";
  
  const aiEfficiencyRate = data.totalAISuggestions > 0 
    ? Math.round(data.acceptanceRate * 100) 
    : 0;
  
  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-4">
        <Code className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h4 className="text-sm font-medium">Code Productivity</h4>
          <p className="text-sm text-muted-foreground">
            You write an average of {averageLinesPerMinute} lines of code per minute.
          </p>
        </div>
      </div>
      
      <div className="flex items-start space-x-4">
        <Cpu className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h4 className="text-sm font-medium">AI Efficiency</h4>
          <p className="text-sm text-muted-foreground">
            {aiEfficiencyRate}% of AI suggestions are accepted, with a total of {data.acceptedAISuggestions} accepted suggestions.
          </p>
        </div>
      </div>
      
      <div className="flex items-start space-x-4">
        <Clock className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h4 className="text-sm font-medium">Time Investment</h4>
          <p className="text-sm text-muted-foreground">
            You've spent {Math.round(data.totalProductivityTime / 60)} minutes coding across all projects.
          </p>
        </div>
      </div>
      
      <div className="flex items-start space-x-4">
        <Check className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h4 className="text-sm font-medium">Productivity Score</h4>
          <p className="text-sm text-muted-foreground">
            Your productivity score is {calculateProductivityScore(data)}/100 based on your coding patterns.
          </p>
        </div>
      </div>
    </div>
  );
}

// Calculate a productivity score based on various metrics
function calculateProductivityScore(data: AnalyticsSummaryProps["data"]) {
  if (!data) return 0;
  
  // This is a simplified scoring algorithm
  // In a real implementation, this would be more sophisticated
  const codeScore = Math.min(data.totalLinesOfCode / 10, 40);
  const aiScore = Math.min(data.acceptanceRate * 30, 30);
  const timeScore = Math.min(data.totalProductivityTime / 60, 30);
  
  return Math.round(codeScore + aiScore + timeScore);
}