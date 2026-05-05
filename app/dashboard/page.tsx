import AddNewButton from "@/features/dashboard/components/add-new-btn";
import AddRepo from "@/features/dashboard/components/add-repo";
import ProjectTable from "@/features/dashboard/components/project-table";
import { getAllPlaygroundForUser, deleteProjectById, editProjectById, duplicateProjectById } from "@/features/playground/actions";

const EmptyState = (): React.ReactElement => (
  <div className="flex flex-col items-center justify-center py-16">
    <img src="/empty-state.svg" alt="No projects" className="w-48 h-48 mb-4" />
    <h2 className="text-xl font-semibold text-cyan-600">No projects found</h2>
    <p className="text-cyan-500">Create a new project to get started!</p>
  </div>
);

const DashboardMainPage = async (): Promise<React.ReactElement> => {
  try {
    const playgrounds = await getAllPlaygroundForUser();
    
    // Ensure playgrounds is always an array
    const projects = Array.isArray(playgrounds) ? playgrounds : [];
    
    return (
      <div className="flex flex-col justify-start items-center min-h-screen mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <AddNewButton />
          <AddRepo />
        </div>
        <div className="mt-10 flex flex-col justify-center items-center w-full">
          {projects.length === 0 ? (
            <EmptyState />
          ) : (
            <ProjectTable
              projects={projects}
              onDeleteProject={deleteProjectById}
              onUpdateProject={editProjectById}
              onDuplicateProject={duplicateProjectById}
            />
          )}
        </div>
      </div>
    );
  } catch (error) {
    // Log error on server side without exposing in client console
    console.error('Error loading projects:', error instanceof Error ? error.message : String(error));

    // For monitoring in production, you could use a logging service here
    // Example: await logErrorToService(error);

    return (
      <div className="flex flex-col justify-start items-center min-h-screen mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <AddNewButton />
          <AddRepo />
        </div>
        <div className="mt-10 flex flex-col justify-center items-center w-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Error loading projects</h2>
            <p className="text-red-500">Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }
};

export default DashboardMainPage;
