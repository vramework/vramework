export interface ContentService {
  signURL: (url: string) => Promise<string>
  getUploadURL: (fileKey: string, contentType: string) => Promise<{ uploadUrl: string; assetUrl: string }>
  delete: (fileName: string) => Promise<boolean>
}