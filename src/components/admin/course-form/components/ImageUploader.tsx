import React, { useState } from 'react';
import { Button, Box, Typography, Paper, LinearProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { v4 as uuidv4 } from 'uuid';
import { ImageUploaderProps } from '../types';
import Toast from '@/components/ai/Toast';

// Define the notification state interface
interface ExtractNotification {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  id: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  step,
  processingImage,
  setProcessingImage,
  extractionStep,
  setExtractionStep,
  onDataExtracted,
  onFullDataExtracted,
  isMobile
}) => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [notifications, setNotifications] = useState<ExtractNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<ExtractNotification | null>(null);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  
  // Add a notification to the queue
  const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newNotification = {
      message,
      type,
      id: uuidv4()
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // If no notification is currently showing, show this one
    if (!currentNotification) {
      setCurrentNotification(newNotification);
    }
  };
  
  // Handle notification close
  const handleNotificationClose = () => {
    setCurrentNotification(null);
    
    // If there are more notifications in the queue, show the next one
    setTimeout(() => {
      if (notifications.length > 0) {
        const nextNotification = notifications[0];
        setNotifications(prev => prev.slice(1));
        setCurrentNotification(nextNotification);
      }
    }, 300);
  };
  
  // Process image with AI extraction
  const processImageWithAI = async (file: File, extractType: 'course' | 'teeBoxes' | 'scorecard') => {
    try {
      console.log(`Processing image for ${extractType} extraction`);
      addNotification(`Image uploaded successfully`, 'success');
      setShowProgress(true);
      setProgress(10);
      
      // Create form data for API call
      const apiFormData = new FormData();
      apiFormData.append('file', file);
      
      // Set the extraction type based on the step
      let apiExtractType = 'all';
      // If we're on course step, always get all data to prefill future steps
      if (extractType === 'course') {
        apiExtractType = 'all'; // Get all data
      } else if (extractType === 'teeBoxes') {
        apiExtractType = 'teeSets';
      } else if (extractType === 'scorecard') {
        apiExtractType = 'scorecard';
      }
      
      apiFormData.append('extractType', apiExtractType);
      
      setProgress(30);
      addNotification(`Analyzing image content...`, 'info');
      
      // Call our API endpoint
      const response = await fetch('/api/scorecard', {
        method: 'POST',
        body: apiFormData,
      });
      
      setProgress(60);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to extract ${extractType} data`);
      }
      
      const result = await response.json();
      console.log('API response:', result);
      
      setProgress(80);
      
      if (!result.success || !result.data) {
        throw new Error(`No data received from API for ${extractType} extraction`);
      }
      
      setProgress(90);
      
      // If we're in the course step and got all data
      if (extractType === 'course' && apiExtractType === 'all') {
        console.log('Received full course data:', result.data);
        
        // Show notifications for what was found
        if (result.data.courseInfo?.name) {
          addNotification(`Course information found: ${result.data.courseInfo.name}`, 'success');
        }
        
        if (result.data.teeSets && result.data.teeSets.length > 0) {
          addNotification(`Tee boxes found: ${result.data.teeSets.length}`, 'success');
        }
        
        if (result.data.holes && result.data.holes.length > 0) {
          addNotification(`Holes found: ${result.data.holes.length}`, 'success');
        }
        
        // Call onDataExtracted with just the course info portion
        if (result.data.courseInfo) {
          onDataExtracted(result.data.courseInfo);
        }
        
        // If there's a callback for full data extraction, call it
        if (onFullDataExtracted) {
          onFullDataExtracted(result.data);
        }
        
        setProgress(100);
        addNotification(`Import complete`, 'success');
        
        return result.data.courseInfo || {};
      } else if (extractType === 'teeBoxes' && result.data) {
        // Handle tee boxes extraction
        const teeCount = Array.isArray(result.data) ? result.data.length : 0;
        if (teeCount > 0) {
          addNotification(`Tee boxes found: ${teeCount}`, 'success');
        } else {
          addNotification(`No tee boxes detected in the image`, 'warning');
        }
      } else if (extractType === 'scorecard' && result.data) {
        // Handle scorecard extraction
        const holeCount = Array.isArray(result.data) ? result.data.length : 0;
        if (holeCount > 0) {
          addNotification(`Holes found: ${holeCount}`, 'success');
        } else {
          addNotification(`No hole data detected in the image`, 'warning');
        }
      }
      
      setProgress(100);
      addNotification(`Import complete`, 'success');
      
      return result.data;
    } catch (error: any) {
      console.error(`Error processing ${extractType} image:`, error);
      addNotification(`Error: ${error.message || 'Unknown error occurred'}`, 'error');
      setProgress(0);
      setShowProgress(false);
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
      // Toast notification is already handled in processImageWithAI
    } finally {
      setProcessingImage(false);
      setUploadedImage(null);
      setTimeout(() => {
        setShowProgress(false);
      }, 1000);
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
      
      {showProgress && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 1 }}>
            {processingImage && extractionStep === step 
              ? `Processing ${Math.round(progress)}%` 
              : 'Complete'}
          </Typography>
        </Box>
      )}
      
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
      
      {/* Toast notification */}
      <Toast
        message={currentNotification?.message || ''}
        type={currentNotification?.type === 'warning' ? 'info' : currentNotification?.type || 'info'}
        open={Boolean(currentNotification)}
        onClose={handleNotificationClose}
        duration={4000}
      />
    </Paper>
  );
};

export default ImageUploader; 