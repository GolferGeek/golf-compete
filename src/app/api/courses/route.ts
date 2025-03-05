import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Creating course with data:', JSON.stringify(data.courseSubmitData));
    
    // Insert course
    const { data: insertedCourse, error: courseError } = await supabase
      .from('courses')
      .insert(data.courseSubmitData)
      .select()
      .single();
    
    if (courseError) {
      console.error('Failed to insert course:', courseError);
      return NextResponse.json(
        { error: 'Failed to insert course: ' + courseError.message },
        { status: 500 }
      );
    }
    
    console.log('Course inserted successfully:', insertedCourse);
    
    // Insert tee sets
    const teeSetInsertPromises = data.teeSets.map((teeSet: any) => {
      const teeSetData = {
        courseId: insertedCourse.id,
        name: teeSet.name,
        color: teeSet.color,
        rating: teeSet.rating,
        slope: teeSet.slope,
        distance: teeSet.distance || 0,
        imageUrl: data.teeSetImageUrl || data.courseInfoImageUrl
      };
      
      console.log('Inserting tee set:', teeSetData);
      
      return supabase
        .from('tee_sets')
        .insert(teeSetData)
        .select()
        .single();
    });
    
    const teeSetResults = await Promise.all(teeSetInsertPromises);
    const teeSetErrors = teeSetResults.filter(result => result.error);
    
    if (teeSetErrors.length > 0) {
      console.error('Failed to insert tee sets:', teeSetErrors[0].error);
      return NextResponse.json(
        { error: 'Failed to insert tee sets: ' + teeSetErrors[0].error.message },
        { status: 500 }
      );
    }
    
    const insertedTeeSets = teeSetResults.map(result => result.data);
    console.log('Tee sets inserted successfully:', insertedTeeSets);
    
    // Insert holes
    const holeInsertPromises = data.holes.map((hole: any) => {
      const holeData = {
        course_id: insertedCourse.id,
        hole_number: hole.number,
        par: hole.par,
        handicap_index: hole.handicapIndex || hole.number,
        imageUrl: data.scorecardImageUrl || data.teeSetImageUrl || data.courseInfoImageUrl
      };
      
      console.log('Inserting hole:', holeData);
      
      return supabase
        .from('holes')
        .insert(holeData)
        .select()
        .single();
    });
    
    const holeResults = await Promise.all(holeInsertPromises);
    const holeErrors = holeResults.filter(result => result.error);
    
    if (holeErrors.length > 0) {
      console.error('Failed to insert holes:', holeErrors[0].error);
      return NextResponse.json(
        { error: 'Failed to insert holes: ' + holeErrors[0].error.message },
        { status: 500 }
      );
    }
    
    const insertedHoles = holeResults.map(result => result.data);
    console.log('Holes inserted successfully:', insertedHoles);
    
    // No distance results to check since we're not inserting distances anymore
    
    return NextResponse.json(
      { 
        course: insertedCourse, 
        teeSets: insertedTeeSets, 
        holes: insertedHoles 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create course: ' + errorMessage },
      { status: 500 }
    );
  }
}
