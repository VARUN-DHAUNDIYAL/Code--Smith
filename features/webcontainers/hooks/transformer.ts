import type {
  TemplateFile,
  TemplateFolder,
  TemplateItem,
} from "@/features/playground/libs/path-to-json";

interface WebContainerFile {
  file: {
    contents: string;
  };
}

interface WebContainerDirectory {
  directory: {
    [key: string]: WebContainerFile | WebContainerDirectory;
  };
}

type WebContainerFileSystem = Record<
  string,
  WebContainerFile | WebContainerDirectory
>;

function isTemplateFolder(item: TemplateItem): item is TemplateFolder {
  return "items" in item;
}

function processItem(item: TemplateItem): WebContainerFile | WebContainerDirectory {
  if (isTemplateFolder(item)) {
    const directoryContents: WebContainerFileSystem = {};

    for (const subItem of item.items) {
      const key = isTemplateFolder(subItem)
        ? subItem.folderName
        : `${subItem.filename}.${subItem.fileExtension}`;
      directoryContents[key] = processItem(subItem);
    }

    return { directory: directoryContents };
  }

  const file = item as TemplateFile;
  return {
    file: {
      contents: file.content,
    },
  };
}

export function transformToWebContainerFormat(
  template: TemplateFolder
): WebContainerFileSystem {
  const result: WebContainerFileSystem = {};

  for (const item of template.items) {
    const key = isTemplateFolder(item)
      ? item.folderName
      : `${item.filename}.${item.fileExtension}`;
    result[key] = processItem(item);
  }

  return result;
}
