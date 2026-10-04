/**
 * Utility to manage Object URLs and avoid memory leaks.
 */

const objectUrls = new Set<string>();

export const createManagedObjectURL = (blob: Blob | File): string => {
  const url = URL.createObjectURL(blob);
  objectUrls.add(url);
  return url;
};

export const revokeManagedObjectURL = (url: string): void => {
  if (objectUrls.has(url)) {
    URL.revokeObjectURL(url);
    objectUrls.delete(url);
  }
};

export const revokeAllManagedObjectURLs = (): void => {
  objectUrls.forEach(url => URL.revokeObjectURL(url));
  objectUrls.clear();
};
