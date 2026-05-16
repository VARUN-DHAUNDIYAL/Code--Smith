import type { TemplateFile, TemplateFolder } from "./path-to-json";

/**
 * Updates a single file's content using its path relative to the project root.
 */
export function updateFileContentInTree(
  root: TemplateFolder,
  filePath: string,
  content: string
): TemplateFolder {
  const updated = JSON.parse(JSON.stringify(root)) as TemplateFolder;
  const parts = filePath.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length === 0) return root;

  const fileName = parts.pop()!;
  let current: TemplateFolder = updated;

  for (const part of parts) {
    const folder = current.items.find(
      (item) => "folderName" in item && item.folderName === part
    ) as TemplateFolder | undefined;
    if (!folder) return root;
    current = folder;
  }

  const target = current.items.find(
    (item) =>
      "filename" in item &&
      `${item.filename}.${item.fileExtension}` === fileName
  ) as TemplateFile | undefined;

  if (target) {
    target.content = content;
  }

  return updated;
}
