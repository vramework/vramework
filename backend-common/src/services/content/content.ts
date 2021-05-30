import { SecretService } from "../secrets/secrets";

export interface ContentService {
  init: (secrets: SecretService) => Promise<void>
  signURL: (url: string) => Promise<string>
  getUploadURL: (fileKey: string, contentType: string) => Promise<{ uploadUrl: string; assetKey: string }>
  delete: (fileName: string) => Promise<boolean>
}