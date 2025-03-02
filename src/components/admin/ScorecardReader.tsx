import { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import Image from 'next/image';

// Styled component for the file input
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface ScorecardReaderProps {
  onImageSelected: (file: File) => void;
  buttonText?: string;
  disabled?: boolean;
  imagePreview?: string | null;
}

export default function ScorecardReader({ 
  onImageSelected, 
  buttonText = "Upload Scorecard", 
  disabled = false,
  imagePreview: externalImagePreview = null
}: ScorecardReaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [internalImagePreview, setInternalImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use external image preview if provided, otherwise use internal
  const imagePreview = externalImagePreview || internalImagePreview;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }
    
    setFile(file);
    setError(null);
    
    // Create image preview if not using external preview
    if (!externalImagePreview) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInternalImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    
    // Pass the file to the parent component
    onImageSelected(file);
  };

  return (
    <Box sx={{ mb: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUploadIcon />}
          sx={{ mb: 2 }}
          disabled={disabled}
        >
          {buttonText}
          <VisuallyHiddenInput type="file" onChange={handleFileChange} accept="image/*" />
        </Button>
        
        {file && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Selected file: {file.name}
          </Typography>
        )}
        
        {imagePreview && (
          <Box sx={{ mt: 2, mb: 3, maxWidth: '100%', overflow: 'hidden' }}>
            <Image 
              src={imagePreview} 
              alt="Scorecard preview" 
              width={800}
              height={300}
              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}