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
    "slope": 135,
    "length": 6800  // Total yardage for this tee set if available
  },
  {
    "name": "White",
    "color": "White",
    "rating": 70.1,
    "slope": 128,
    "length": 6500  // Total yardage for this tee set if available
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

IMPORTANT: Focus ONLY on extracting the hole numbers, pars, handicap indices, and any notes for each hole.

Your response must be ONLY valid JSON in the following format:
{
  "holes": [
    {
      "number": 1,
      "par": 4,
      "handicapIndex": 5,  // if available
      "notes": ""  // if available
    },
    {
      "number": 2,
      "par": 3,
      "handicapIndex": 17,  // if available
      "notes": "Dogleg right"  // if available
    }
  ]
}

Guidelines:
1. Extract data for ALL holes visible in the scorecard (typically 9 or 18 holes)
2. For each hole, include number, par, handicap index (if available), and any notes if visible
3. If you can't determine a specific value, use a reasonable default (par 4 for missing pars)
4. Convert all text-based numbers to numeric values
5. If the scorecard has front/back 9 layout, combine them into a single array of 18 holes
6. Return ONLY the JSON object, nothing else`;
        userMessage = `${teeColorsText}Extract the hole-by-hole information from this golf scorecard.`;
      } 
      else {
        // Default to extracting all information
        systemMessage = `You are a golf course data extraction assistant. Extract all information from the scorecard image.
Your response must be ONLY valid JSON in the following format:
{
  "courseInfo": {
    "name": "Course Name",
    "city": "City",
    "state": "State",
    "phoneNumber": "555-123-4567",
    "website": "www.golfcourse.com",
    "par": 72,
    "holes": 18
  },
  "teeSets": [
    {
      "name": "Blue",
      "color": "Blue",
      "rating": 72.3,
      "slope": 135,
      "length": 6800
    },
    {
      "name": "White",
      "color": "White",
      "rating": 70.1,
      "slope": 128,
      "length": 6500
    }
  ],
  "holes": [
    {
      "number": 1,
      "par": 4,
      "handicapIndex": 5,
      "notes": ""
    },
    {
      "number": 2,
      "par": 3,
      "handicapIndex": 17,
      "notes": ""
    }
  ]
}

Guidelines:
1. Extract ALL possible information from the image - course details, tee boxes, and hole-by-hole data
2. If the image is clearly only showing one aspect (e.g., just course info), provide as much as you can see and leave other sections empty arrays
3. If you can see location information, split it into city and state fields properly
4. Convert all text-based numbers and ratings to appropriate numeric values
5. Return the data in exactly the format specified above
6. If a specific piece of data is not available, omit that field rather than including null or empty values`;
        userMessage = "Extract all possible course information from this golf scorecard or course image.";
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
        if (responseText) {
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
          } catch (parseError: unknown) {
            console.error('JSON parse error:', parseError);
            console.error('Failed to parse JSON string:', jsonString);
            const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
            return NextResponse.json({
              success: false,
              error: `Failed to parse extracted data from the image. The AI response could not be converted to valid JSON. ${errorMessage}`
            }, { status: 422 });
          }
        } else {
          return NextResponse.json({
            success: false,
            error: 'No response text received from the AI'
          }, { status: 422 });
        }
        
        // Post-process the data to ensure it has the expected structure
        if (extractType === 'scorecard') {
          console.log('Post-processing scorecard data');
          
          // Check if the data has the expected structure
          if (!extractedData || !extractedData.holes || !Array.isArray(extractedData.holes)) {
            console.error('Extracted data does not have the expected structure:', extractedData);
            return NextResponse.json({
              success: false,
              error: 'The extracted data does not have the expected structure. Please try with a clearer image or manually enter the data.'
            }, { status: 422 });
          }
          
          // Validate that we have proper hole data
          if (extractedData.holes.length === 0) {
            console.error('Extracted data has an empty holes array');
            return NextResponse.json({
              success: false,
              error: 'The AI could not identify any holes in the scorecard image. Please try with a clearer image or manually enter the data.'
            }, { status: 422 });
          }
          
          // Check if the first item has the expected structure
          const firstHole = extractedData.holes[0];
          if (!firstHole.number || !firstHole.par) {
            console.error('Extracted data does not match expected hole format:', firstHole);
            return NextResponse.json({
              success: false,
              error: 'The extracted data does not match the expected hole format. Please try with a clearer image or manually enter the data.'
            }, { status: 422 });
          }
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
    } catch (openaiError: unknown) {
      console.error('OpenAI API error:', openaiError);
      const errorMessage = openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI API error';
      return NextResponse.json({
        error: 'Error calling OpenAI API: ' + errorMessage,
      }, { status: 500 });
    }
    
  } catch (error: unknown) {
    console.error('Error processing scorecard:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage || 'Failed to process scorecard' },
      { status: 500 }
    );
  }
}
