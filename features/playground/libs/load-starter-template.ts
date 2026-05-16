import path from "path";
import { templatePaths } from "@/lib/template";
import { scanTemplateDirectory } from "./path-to-json.node";
import type { TemplateFolder } from "./path-to-json";

export type StarterTemplateKey = keyof typeof templatePaths;

export async function loadStarterTemplate(
  template: StarterTemplateKey
): Promise<TemplateFolder> {
  const templatePath = templatePaths[template];
  if (!templatePath) {
    throw new Error(`Unknown template: ${template}`);
  }

  const inputPath = path.join(
    process.cwd(),
    templatePath.replace(/^[/\\]+/, "")
  );

  return scanTemplateDirectory(inputPath);
}
