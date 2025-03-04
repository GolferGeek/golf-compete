import React, { useState } from 'react';
import { Button, Box, Typography, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { v4 as uuidv4 } from 'uuid';
import { ImageUploaderProps } from '../types';

const ImageUploader: React.FC<ImageUploaderProps> = ({
  step,
  processingImage,
  setProcessingImage,
  extractionStep,
  setExtractionStep,
  onDataExtracted,
  isMobile
}) => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  
  // Process image with AI extraction
  const processImageWithAI = async (file: File, extractType: 'course' | 'teeBoxes' | 'scorecard') => {
    try {
      console.log(`Processing image for ${extractType} extraction`);
      
      // Create form data for API call
      const apiFormData = new FormData();
      apiFormData.append('file', file);
      
      // Set the extraction type based on the step
      let apiExtractType = 'all';
      if (extractType === 'course') apiExtractType = 'courseInfo';
      if (extractType === 'teeBoxes') apiExtractType = 'teeSets';
      if (extractType === 'scorecard') apiExtractType = 'scorecard';
      
      apiFormData.append('extractType', apiExtractType);
      
      // Call our API endpoint
      const response = await fetch('/api/scorecard', {
        method: 'POST',
        body: apiFormData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to extract ${extractType} data`);
      }
      
      const result = await response.json();
      console.log('API response:', result);
      
      if (!result.success || !result.data) {
        throw new Error(`No data received from API for ${extractType} extraction`);
      }
      
      return result.data;
    } catch (error: any) {
      console.error(`Error processing ${extractType} image:`, error);
      throw new Error(error.message || 'Unknown error occurred during image processing');
    }
  };

  // Handle image upload for AI extraction
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setUploadedImage(file);
    setExtractionStep(step);
    setProcessingImage(true);
    
    try {
      // Process the image with AI
      const extractedData = await processImageWithAI(file, step);
      
      // Call the callback with the extracted data
      onDataExtracted(extractedData);
      
    } catch (error: any) {
      console.error(`Error in handleImageUpload for ${step}:`, error);
      alert(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingImage(false);
      setUploadedImage(null);
    }
  };
  
  return (
    <Paper sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 3 : 4, border: '1px dashed #2196f3', bgcolor: 'rgba(33, 150, 243, 0.04)' }}>
      <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
        {step === 'course' 
          ? 'AI-Assisted Course Information' 
          : step === 'teeBoxes' 
            ? 'AI-Assisted Tee Box Detection'
            : 'AI-Assisted Scorecard Data'}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {step === 'course'
          ? 'Upload an image of the course information or website screenshot, and our AI will extract the basic details for you.'
          : step === 'teeBoxes'
            ? 'Upload an image of the course scorecard or tee information, and our AI will identify the tee boxes for you.'
            : 'Upload an image of the scorecard, and our AI will extract the hole data for you.'}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, alignItems: isMobile ? 'flex-start' : 'center' }}>
        <Button
          variant="contained"
          component="label"
          startIcon={<AddIcon />}
          disabled={processingImage}
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
        >
          {processingImage && extractionStep === step ? 'Processing...' : 'Upload Image'}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleImageUpload}
          />
        </Button>
        <Typography variant="body2" color="text.secondary">
          {processingImage && extractionStep === step 
            ? `Analyzing image and extracting ${step === 'course' ? 'course information' : step === 'teeBoxes' ? 'tee box information' : 'scorecard data'}...` 
            : 'Supported formats: JPG, PNG, WEBP'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ImageUploader; 