/**
 * Interface for handling content operations.
 */
export interface ContentService {
  /**
   * Signs a content key to provide secure access.
   * @param contentKey - The key of the content to sign.
   * @returns A promise that resolves to the signed content key URL.
   * @description This method generates a signed URL for the specified content key to ensure secure access.
   */
  signContentKey: (contentKey: string) => Promise<string>

  /**
   * Signs a URL to provide secure access.
   * @param url - The URL to sign.
   * @returns A promise that resolves to the signed URL.
   * @description This method appends a signature to the provided URL to ensure secure access.
   */
  signURL: (url: string) => Promise<string>

  /**
   * Gets an upload URL for a file.
   * @param fileKey - The key of the file to upload.
   * @param contentType - The content type of the file.
   * @returns A promise that resolves to an object containing the upload URL and asset key.
   * @description This method generates an upload URL for the specified file key and content type, allowing the file to be uploaded.
   */
  getUploadURL: (
    fileKey: string,
    contentType: string
  ) => Promise<{ uploadUrl: string; assetKey: string }>

  /**
   * Deletes a file.
   * @param fileName - The name of the file to delete.
   * @returns A promise that resolves to a boolean indicating success.
   * @description This method deletes the specified file and returns a boolean indicating whether the deletion was successful.
   */
  deleteFile?: (fileName: string) => Promise<boolean>

  /**
   * Writes a file.
   * @param assetKey - The key of the asset to write.
   * @param buffer - The buffer containing the file data.
   * @returns A promise that resolves to a boolean indicating success.
   * @description This method writes the specified buffer to the file identified by the asset key and returns a boolean indicating success.
   */
  writeFile?: (assetKey: string, buffer: Buffer) => Promise<boolean>

  /**
   * Copies a file.
   * @param assetKey - The key of the asset to copy.
   * @param fromAbsolutePath - The absolute path of the source file.
   * @returns A promise that resolves to a boolean indicating success.
   * @description This method copies the file from the specified absolute path to the location identified by the asset key and returns a boolean indicating success.
   */
  copyFile?: (assetKey: string, fromAbsolutePath: string) => Promise<boolean>

  /**
   * Reads a file.
   * @param assetKey - The key of the asset to read.
   * @returns A promise that resolves to a buffer containing the file data.
   * @description This method reads the file identified by the asset key and returns a buffer containing the file data.
   */
  readFile?: (assetKey: string) => Promise<Buffer>
}
