import { SupabaseClient } from '@supabase/supabase-js';
import { 
  BaseService, 
  LogLevel,
  ServiceResponse,
  StorageError,
  ErrorCodes,
  createSuccessResponse,
  createErrorResponse
} from '../base';

// Define options for file operations
export interface FileOptions {
  /** Cache control header */
  cacheControl?: string;
  /** Content type header */
  contentType?: string;
  /** Upsert the file if it already exists */
  upsert?: boolean;
}

// Define options for retrieving file URLs
export interface UrlOptions {
  /** Expiration time for signed URLs in seconds */
  expiresIn?: number;
  /** Transform options for image files */
  transform?: {
    width?: number;
    height?: number;
    resize?: 'cover' | 'contain' | 'fill';
  };
}

// Define options for listing files
export interface ListOptions {
  /** The maximum number of files to return */
  limit?: number;
  /** The starting position for pagination */
  offset?: number;
  /** Search prefix */
  search?: string;
}

/**
 * Service for interacting with Supabase Storage
 */
class StorageService extends BaseService {
  constructor(client: SupabaseClient) {
    super(client);
    this.log(LogLevel.INFO, 'StorageService initialized');
  }

  /**
   * Upload a file to a storage bucket
   * @param bucketName The name of the bucket
   * @param filePath The path where the file will be stored in the bucket
   * @param file The file object (e.g., File, Blob, ArrayBuffer)
   * @param options Optional file options
   */
  public async uploadFile(
    bucketName: string,
    filePath: string,
    file: File | Blob | ArrayBuffer | Buffer | ReadableStream,
    options?: FileOptions
  ): Promise<ServiceResponse<{ path: string }>> {
    try {
      const { data, error } = await this.client.storage
        .from(bucketName)
        .upload(filePath, file, options);

      if (error) {
        throw this.createStorageError(error, ErrorCodes.STORAGE_UPLOAD_ERROR);
      }

      return createSuccessResponse({ path: data.path });
    } catch (error) {
      return this.handleStorageError(error, `Failed to upload file to ${bucketName}/${filePath}`);
    }
  }

  /**
   * Download a file from a storage bucket
   * @param bucketName The name of the bucket
   * @param filePath The path of the file in the bucket
   */
  public async downloadFile(
    bucketName: string,
    filePath: string
  ): Promise<ServiceResponse<Blob>> {
    try {
      const { data, error } = await this.client.storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        throw this.createStorageError(error, ErrorCodes.STORAGE_DOWNLOAD_ERROR);
      }
      if (!data) {
        throw new StorageError('Downloaded file data is null', ErrorCodes.STORAGE_DOWNLOAD_ERROR);
      }

      return createSuccessResponse(data);
    } catch (error) {
      return this.handleStorageError(error, `Failed to download file from ${bucketName}/${filePath}`);
    }
  }

  /**
   * Get the public URL for a file
   * @param bucketName The name of the bucket
   * @param filePath The path of the file in the bucket
   */
  public getPublicUrl(
    bucketName: string,
    filePath: string
  ): ServiceResponse<{ publicUrl: string }> {
    try {
      const { data } = this.client.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      return createSuccessResponse({ publicUrl: data.publicUrl });
    } catch (error) {
        // getPublicUrl doesn't typically throw standard storage errors, handle unexpected issues
        const storageError = new StorageError(
            error instanceof Error ? error.message : 'Failed to get public URL',
            ErrorCodes.STORAGE_FILE_NOT_FOUND, // Use FILE_NOT_FOUND as a likely cause
            error instanceof Error ? error : undefined
        );
        this.log(LogLevel.ERROR, storageError.message, { error: storageError });
        return createErrorResponse(storageError);
    }
  }

  /**
   * Create a signed URL for a file
   * @param bucketName The name of the bucket
   * @param filePath The path of the file in the bucket
   * @param options Optional URL options (e.g., expiresIn)
   */
  public async createSignedUrl(
    bucketName: string,
    filePath: string,
    options: UrlOptions = {}
  ): Promise<ServiceResponse<{ signedUrl: string }>> {
    try {
      const expiresIn = options.expiresIn || 3600; // Default 1 hour
      const { data, error } = await this.client.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn, { transform: options.transform });

      if (error) {
        // Use FILE_NOT_FOUND if that's the likely cause, otherwise use a generic code
        const errorCode = error.message?.includes('not found') 
            ? ErrorCodes.STORAGE_FILE_NOT_FOUND 
            : ErrorCodes.UNKNOWN_ERROR; // Use UNKNOWN_ERROR as generic fallback
        throw this.createStorageError(error, errorCode);
      }
      if (!data) {
          // Use FILE_NOT_FOUND as it implies the path might be wrong or file missing
          throw new StorageError('Signed URL data is null', ErrorCodes.STORAGE_FILE_NOT_FOUND);
      }

      return createSuccessResponse({ signedUrl: data.signedUrl });
    } catch (error) {
      return this.handleStorageError(error, `Failed to create signed URL for ${bucketName}/${filePath}`);
    }
  }

  /**
   * Delete a file from a storage bucket
   * @param bucketName The name of the bucket
   * @param filePaths An array of file paths to delete
   */
  public async deleteFile(
    bucketName: string,
    filePaths: string[]
  ): Promise<ServiceResponse<null>> {
    try {
      const { error } = await this.client.storage
        .from(bucketName)
        .remove(filePaths);

      if (error) {
        throw this.createStorageError(error, ErrorCodes.STORAGE_DELETE_ERROR);
      }

      return createSuccessResponse(null);
    } catch (error) {
      return this.handleStorageError(error, `Failed to delete file(s) from ${bucketName}`);
    }
  }

  /**
   * List files in a storage bucket path
   * @param bucketName The name of the bucket
   * @param folderPath The path within the bucket to list files from (optional)
   * @param options Optional list options (limit, offset, search)
   */
  public async listFiles(
    bucketName: string,
    folderPath?: string,
    options?: ListOptions
  ): Promise<ServiceResponse<{ files: any[] }>> { // Replace 'any' with Supabase FileObject if available
    try {
      const { data, error } = await this.client.storage
        .from(bucketName)
        .list(folderPath, options);

      if (error) {
        // Use FILE_NOT_FOUND if path is likely wrong, otherwise UNKNOWN_ERROR
        const errorCode = error.message?.includes('not found') 
            ? ErrorCodes.STORAGE_FILE_NOT_FOUND 
            : ErrorCodes.UNKNOWN_ERROR; 
        throw this.createStorageError(error, errorCode);
      }

      return createSuccessResponse({ files: data || [] });
    } catch (error) {
      return this.handleStorageError(error, `Failed to list files in ${bucketName}/${folderPath || ''}`);
    }
  }

  /**
   * Helper to create a StorageError from a Supabase storage error
   */
  private createStorageError(error: any, code: string): StorageError {
    // Supabase storage errors might not have a standard 'code' property
    // Use the provided code or a default one
    return new StorageError(
      error.message || 'Storage operation failed',
      code, // Use the specific error code passed in
      error instanceof Error ? error : new Error(String(error))
    );
  }

  /**
   * Handle storage-specific errors
   */
  private handleStorageError<T>(error: any, message: string): ServiceResponse<T> {
    const storageError = error instanceof StorageError
      ? error
      : this.createStorageError(error, ErrorCodes.UNKNOWN_ERROR); // Use UNKNOWN_ERROR as fallback

    this.log(LogLevel.ERROR, message, { error: storageError });
    return createErrorResponse<T>(storageError);
  }
}

export default StorageService; 