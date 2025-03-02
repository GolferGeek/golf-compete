import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Debug logging for environment variables
console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('API Key length:', process.env.OPENAI_API_KEY?.length);
console.log('API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 7));

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('Scorecard API called');
    
    // Check content type to determine how to parse the request
    const contentType = request.headers.get('content-type') || '';
    console.log('Content type:', contentType);
    
    let imageData: File | null = null;
    let extractType = 'all';
    let teeColors: string[] = [];
    
    // Handle form data (preferred method)
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing as form data');
      const formData = await request.formData();
      
      // Get file from form data
      imageData = formData.get('file') as File;
      extractType = formData.get('extractType') as string || 'all';
      
      const teeColorsJson = formData.get('teeColors') as string;
      if (teeColorsJson) {
        try {
          teeColors = JSON.parse(teeColorsJson);
        } catch (e) {
          console.warn('Could not parse tee colors:', e);
        }
      }
      
      if (!imageData) {
        return NextResponse.json(
          { error: 'No file provided in form data' },
          { status: 400 }
        );
      }
      
      // Check if the file is an image
      if (!(imageData as File).type?.startsWith('image/')) {
        return NextResponse.json(
          { error: 'File must be an image' },
          { status: 400 }
        );
      }
    } 
    // If not form data, return an error
    else {
      return NextResponse.json(
        { error: 'Invalid content type. Please use multipart/form-data with a file field.' },
        { status: 400 }
      );
    }
    
    console.log('Processing request with extractType:', extractType);
    
    try {
      // Convert the file to base64 for OpenAI
      const buffer = await imageData.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString('base64');
      const imageUrl = `data:${imageData.type};base64,${base64Image}`;
      console.log('Converted file to base64 image URL');
      
      // Create system message based on extraction type
      let systemMessage = '';
      let userMessage = '';
      
      if (extractType === 'courseInfo') {
        systemMessage = `You are a golf course data extraction assistant. Extract the golf course name, location, and other details from the scorecard image. 
Your response must be ONLY valid JSON in the following format:
{
  "name": "Golf Course Name",
  "location": "City, State",
  "phoneNumber": "555-123-4567",  // if available
  "email": "contact@golfcourse.com",  // if available
  "website": "www.golfcourse.com"  // if available
}`;
        userMessage = "Extract the course information from this golf scorecard.";
      } 
      else if (extractType === 'teeSets') {
        systemMessage = `You are a golf course data extraction assistant. Extract the tee set information from the scorecard image.
Your response must be ONLY valid JSON in the following format:
[
  {
    "name": "Blue",  // Often the same as color
    "color": "Blue",
    "rating": 72.3,
    "slope": 135
  },
  {
    "name": "White",
    "color": "White",
    "rating": 70.1,
    "slope": 128
  }
]`;
        userMessage = "Extract the tee set information from this golf scorecard.";
      } 
      else if (extractType === 'scorecard') {
        // If tee colors are provided, include them in the prompt
        let teeColorsText = '';
        if (teeColors && teeColors.length > 0) {
          teeColorsText = `The scorecard has the following tee colors: ${teeColors.join(', ')}. `;
        }
        
        systemMessage = `You are a golf course data extraction assistant. Extract the hole-by-hole information from the scorecard image.
Your task is to analyze the golf scorecard image and extract structured data for each hole.

IMPORTANT: Focus ONLY on extracting the hole numbers, pars, handicap indices, and distances for each tee color.

Your response must be ONLY valid JSON in the following format:
[
  {
    "number": 1,
    "par": 4,
    "handicapIndex": 5,  // if available
    "distances": {
      "Blue": 425,
      "White": 410,
      "Red": 380
    }
  },
  {
    "number": 2,
    "par": 3,
    "handicapIndex": 17,  // if available
    "distances": {
      "Blue": 185,
      "White": 165,
      "Red": 145
    }
  }
]

Guidelines:
1. Extract data for ALL holes visible in the scorecard (typically 9 or 18 holes)
2. For each hole, include number, par, handicap index (if available), and distances for each tee color
3. If you can't determine a specific value, use a reasonable default (par 4 for missing pars)
4. Convert all text-based numbers to numeric values
5. Ensure the "distances" object contains entries for ALL tee colors visible in the scorecard
6. If the scorecard has front/back 9 layout, combine them into a single array of 18 holes
7. Return ONLY the JSON array, nothing else`;
        userMessage = `${teeColorsText}Extract the hole-by-hole information from this golf scorecard.`;
      } 
      else {
        // Default to extracting all information
        systemMessage = `You are a golf course data extraction assistant. Extract all information from the scorecard image.
Your response must be ONLY valid JSON in the following format:
{
  "name": "Course Name",
  "location": "City, State",
  "teeSets": [
    {
      "name": "Blue",
      "color": "Blue",
      "rating": 72.3,
      "slope": 135
    },
    {
      "name": "White",
      "color": "White",
      "rating": 70.1,
      "slope": 128
    }
  ],
  "holeDetails": [
    {
      "number": 1,
      "par": 4,
      "handicapIndex": 5,
      "distances": {
        "Blue": 425,
        "White": 410,
        "Red": 380
      }
    }
  ]
}`;
        userMessage = "Extract all information from this golf scorecard.";
      }
      
      console.log('System message:', systemMessage);
      console.log('User message:', userMessage);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: [
              { type: "text", text: userMessage },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1, // Lower temperature for more deterministic output
      });
      
      console.log('OpenAI response received');
      
      // Extract the JSON from the response
      const responseText = response.choices[0].message.content;
      console.log('Full response text:', responseText);
      
      let extractedData;
      try {
        // Try to extract JSON from the response text
        let jsonString = '';
        
        // Try to find JSON in code blocks
        const jsonBlockMatch = responseText.match(/```(?:json)?\n([\s\S]*?)\n```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
          console.log('Found JSON in code block');
          jsonString = jsonBlockMatch[1];
        } 
        // If not in code blocks, try to find the first { or [ to the last } or ]
        else {
          const firstBrace = responseText.indexOf('{');
          const firstBracket = responseText.indexOf('[');
          
          if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            // JSON object
            const lastBrace = responseText.lastIndexOf('}');
            if (lastBrace !== -1 && lastBrace > firstBrace) {
              jsonString = responseText.substring(firstBrace, lastBrace + 1);
              console.log('Found JSON object');
            }
          } else if (firstBracket !== -1) {
            // JSON array
            const lastBracket = responseText.lastIndexOf(']');
            if (lastBracket !== -1 && lastBracket > firstBracket) {
              jsonString = responseText.substring(firstBracket, lastBracket + 1);
              console.log('Found JSON array');
            }
          }
          
          // If still no JSON found, use the entire response
          if (!jsonString) {
            console.log('No JSON format detected, using entire response');
            jsonString = responseText;
          }
        }
        
        console.log('Extracted JSON string:', jsonString);
        
        // Clean up the string before parsing
        jsonString = jsonString.trim();
        
        try {
          // Parse the JSON
          extractedData = JSON.parse(jsonString);
          console.log('Parsed data:', extractedData);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Failed to parse JSON string:', jsonString);
          return NextResponse.json({
            success: false,
            error: `Failed to parse extracted data from the image. The AI response could not be converted to valid JSON. ${parseError.message}`
          }, { status: 422 });
        }
        
        // Post-process the data to standardize tee color keys if it's an array of holes
        if (Array.isArray(extractedData) && extractType === 'scorecard') {
          console.log('Post-processing scorecard data to standardize tee colors');
          
          // Validate that we have proper hole data
          if (extractedData.length === 0) {
            console.error('Extracted data is an empty array');
            return NextResponse.json({
              success: false,
              error: 'The AI could not identify any holes in the scorecard image. Please try with a clearer image or manually enter the data.'
            }, { status: 422 });
          }
          
          // Check if the first item has the expected structure
          const firstHole = extractedData[0];
          if (!firstHole.number || !firstHole.par || !firstHole.distances) {
            console.error('Extracted data does not match expected hole format:', firstHole);
            return NextResponse.json({
              success: false,
              error: 'The extracted data does not match the expected hole format. Please try with a clearer image or manually enter the data.'
            }, { status: 422 });
          }
          
          // Get the provided tee colors if any
          let providedTeeColors: string[] = [];
          if (teeColors.length > 0) {
            console.log('Using provided tee colors for standardization:', teeColors);
            providedTeeColors = teeColors;
          }
          
          // Standardize each hole's distances
          extractedData = extractedData.map((hole: any) => {
            if (hole.distances) {
              const standardizedDistances: Record<string, number> = {};
              const distanceKeys = Object.keys(hole.distances);
              
              // If we have provided tee colors, try to match them
              if (providedTeeColors.length > 0) {
                providedTeeColors.forEach(teeColor => {
                  // Find a matching key regardless of case
                  const matchingKey = distanceKeys.find(
                    key => key.toLowerCase() === teeColor.toLowerCase()
                  );
                  
                  if (matchingKey) {
                    standardizedDistances[teeColor] = parseInt(hole.distances[matchingKey]) || 0;
                  } else {
                    // If no match, still include the tee color with 0 distance
                    standardizedDistances[teeColor] = 0;
                  }
                });
              } else {
                // If no provided tee colors, just use the keys as they are
                Object.entries(hole.distances).forEach(([key, value]) => {
                  standardizedDistances[key] = parseInt(value as string) || 0;
                });
              }
              
              hole.distances = standardizedDistances;
            }
            
            return hole;
          });
          
          console.log('Post-processed data:', extractedData);
        }
        
      } catch (jsonError) {
        console.error('Error parsing JSON from OpenAI response:', jsonError);
        console.log('Raw response:', responseText);
        
        return NextResponse.json({
          error: 'Failed to parse extracted data from the image. The AI could not properly analyze the scorecard.',
          rawResponse: responseText
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: extractedData
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json({
        error: 'Error calling OpenAI API: ' + openaiError.message,
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error processing scorecard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process scorecard' },
      { status: 500 }
    );
  }
}
