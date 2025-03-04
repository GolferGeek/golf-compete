import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface ImageUploadResult {
  path: string;
  url: string;
  error?: string;
}

export interface ImageMetadata {
  id?: string;
  entity_id: string;
  entity_type: string;
  image_path: string;
  image_url: string;
  is_primary: boolean;
  created_at?: string;
}

/**
 * Uploads an image to Supabase storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param path Optional path within the bucket
 * @returns Promise with the upload result
 */
export const uploadImage = async (
  file: File,
  bucket: string,
  path?: string
): Promise<ImageUploadResult> => {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      return { path: '', url: '', error: error.message };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return {
      path: '',
      url: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Deletes an image from Supabase storage
 * @param path The path of the image to delete
 * @param bucket The storage bucket name
 * @returns Promise with the deletion result
 */
export const deleteImage = async (
  path: string,
  bucket: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Saves image metadata to the database
 * @param metadata The image metadata to save
 * @returns Promise with the saved metadata
 */
export const saveImageMetadata = async (
  metadata: Omit<ImageMetadata, 'id' | 'created_at'>
): Promise<ImageMetadata> => {
  try {
    const { data, error } = await supabase
      .from('images')
      .insert([metadata])
      .select()
      .single();

    if (error) {
      console.error('Error saving image metadata:', error);
      throw error;
    }

    return data as unknown as ImageMetadata;
  } catch (error) {
    console.error('Error in saveImageMetadata:', error);
    throw error;
  }
};

/**
 * Fetches image metadata for an entity
 * @param entityId The ID of the entity
 * @param entityType The type of entity (e.g., 'course', 'user')
 * @returns Promise with the image metadata
 */
export const getEntityImages = async (
  entityId: string,
  entityType: string
): Promise<ImageMetadata[]> => {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('Error fetching entity images:', error);
      throw error;
    }

    return data as unknown as ImageMetadata[];
  } catch (error) {
    console.error('Error in getEntityImages:', error);
    throw error;
  }
};

/**
 * Sets an image as the primary image for an entity
 * @param imageId The ID of the image to set as primary
 * @param entityId The ID of the entity
 * @param entityType The type of entity
 * @returns Promise with the result
 */
export const setPrimaryImage = async (
  imageId: string,
  entityId: string,
  entityType: string
): Promise<boolean> => {
  try {
    // First, set all images for this entity to not primary
    const { error: updateError } = await supabase
      .from('images')
      .update({ is_primary: false })
      .eq('entity_id', entityId)
      .eq('entity_type', entityType);

    if (updateError) {
      console.error('Error updating image primary status:', updateError);
      throw updateError;
    }

    // Then set the selected image as primary
    const { error: setPrimaryError } = await supabase
      .from('images')
      .update({ is_primary: true })
      .eq('id', imageId);

    if (setPrimaryError) {
      console.error('Error setting primary image:', setPrimaryError);
      throw setPrimaryError;
    }

    return true;
  } catch (error) {
    console.error('Error in setPrimaryImage:', error);
    throw error;
  }
};

/**
 * Deletes image metadata from the database
 * @param imageId The ID of the image metadata to delete
 * @returns Promise with the result
 */
export const deleteImageMetadata = async (imageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Error deleting image metadata:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImageMetadata:', error);
    throw error;
  }
};

/**
 * Complete function to handle image upload, storage, and metadata
 * @param file The file to upload
 * @param entityId The ID of the entity the image belongs to
 * @param entityType The type of entity
 * @param bucket The storage bucket name
 * @param path Optional path within the bucket
 * @param isPrimary Whether this image should be the primary image
 * @returns Promise with the complete image data
 */
export const processEntityImage = async (
  file: File,
  entityId: string,
  entityType: string,
  bucket: string,
  path?: string,
  isPrimary: boolean = false
): Promise<ImageMetadata> => {
  try {
    // Upload the image
    const uploadResult = await uploadImage(file, bucket, path);
    
    if (uploadResult.error) {
      throw new Error(uploadResult.error);
    }
    
    // If this is set to be primary, first set all existing images to non-primary
    if (isPrimary) {
      const { error } = await supabase
        .from('images')
        .update({ is_primary: false })
        .eq('entity_id', entityId)
        .eq('entity_type', entityType);
        
      if (error) {
        console.error('Error updating existing images:', error);
      }
    }
    
    // Save the metadata
    const metadata: Omit<ImageMetadata, 'id' | 'created_at'> = {
      entity_id: entityId,
      entity_type: entityType,
      image_path: uploadResult.path,
      image_url: uploadResult.url,
      is_primary: isPrimary
    };
    
    return await saveImageMetadata(metadata);
  } catch (error) {
    console.error('Error in processEntityImage:', error);
    throw error;
  }
};

/**
 * Complete function to delete an image and its metadata
 * @param imageId The ID of the image metadata
 * @param bucket The storage bucket name
 * @returns Promise with the result
 */
export const removeEntityImage = async (
  imageId: string,
  bucket: string
): Promise<boolean> => {
  try {
    // First get the image metadata to get the path
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single();
      
    if (error) {
      console.error('Error fetching image metadata:', error);
      throw error;
    }
    
    const metadata = data as unknown as ImageMetadata;
    
    // Delete the image from storage
    const deleteResult = await deleteImage(metadata.image_path, bucket);
    
    if (!deleteResult.success) {
      console.error('Error deleting image from storage:', deleteResult.error);
    }
    
    // Delete the metadata
    await deleteImageMetadata(imageId);
    
    return true;
  } catch (error) {
    console.error('Error in removeEntityImage:', error);
    throw error;
  }
}; 