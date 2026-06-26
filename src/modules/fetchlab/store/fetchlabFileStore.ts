/**
 * Shared runtime store for File objects that cannot live in Redux
 * (non-serializable). Keyed by form file row ID.
 */
export const formFileStore = new Map<string, FileList>()

/** Binary body file */
export let binaryFile: File | null = null
export const setBinaryFile = (f: File | null) => { binaryFile = f }
