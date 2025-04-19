import { supabase, refreshSchemaCache } from '@/lib/supabase';

/**
 * Generic function to fetch data from a table
 */
export const fetchData = async <T>(
  table: string,
  columns: string = '*',
  filters?: { column: string; value: any }[],
  options?: {
    limit?: number;
    offset?: number;
    orderBy?: { column: string; ascending?: boolean };
  }
) => {
  try {
    let query = supabase.from(table).select(columns);

    // Apply filters if provided
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        query = query.eq(filter.column, filter.value);
      });
    }

    // Apply options if provided
    if (options) {
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching data from ${table}:`, error);
      throw error;
    }

    return data as T[];
  } catch (error) {
    console.error(`Error in fetchData for ${table}:`, error);
    throw error;
  }
};

/**
 * Generic function to fetch a single record from a table
 */
export const fetchSingleRecord = async <T>(
  table: string,
  column: string,
  value: any,
  columns: string = '*'
) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq(column, value)
      .single();

    if (error) {
      console.error(`Error fetching single record from ${table}:`, error);
      throw error;
    }

    return data as T;
  } catch (error) {
    console.error(`Error in fetchSingleRecord for ${table}:`, error);
    throw error;
  }
};

/**
 * Generic function to insert data into a table
 */
export const insertData = async <T>(table: string, data: any) => {
  try {
    const { data: insertedData, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) {
      console.error(`Error inserting data into ${table}:`, error);
      throw error;
    }

    return insertedData as T[];
  } catch (error) {
    console.error(`Error in insertData for ${table}:`, error);
    throw error;
  }
};

/**
 * Generic function to update data in a table
 */
export const updateData = async <T>(
  table: string,
  column: string,
  value: any,
  data: any
) => {
  try {
    const { data: updatedData, error } = await supabase
      .from(table)
      .update(data)
      .eq(column, value)
      .select();

    if (error) {
      console.error(`Error updating data in ${table}:`, error);
      throw error;
    }

    return updatedData as T[];
  } catch (error) {
    console.error(`Error in updateData for ${table}:`, error);
    throw error;
  }
};

/**
 * Generic function to delete data from a table
 */
export const deleteData = async (
  table: string,
  column: string,
  value: any
) => {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq(column, value);

    if (error) {
      console.error(`Error deleting data from ${table}:`, error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error(`Error in deleteData for ${table}:`, error);
    throw error;
  }
};

/**
 * Function to call a stored procedure
 */
export const callRPC = async <T>(
  functionName: string,
  params: Record<string, any>
) => {
  try {
    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      console.error(`Error calling RPC ${functionName}:`, error);
      throw error;
    }

    return data as T;
  } catch (error) {
    console.error(`Error in callRPC for ${functionName}:`, error);
    throw error;
  }
};

/**
 * Refresh the schema cache
 */
export const refreshCache = async () => {
  try {
    await refreshSchemaCache();
    return true;
  } catch (error) {
    console.error('Error refreshing schema cache:', error);
    throw error;
  }
};

// Course-specific functions
export const fetchCourses = async (limit?: number, offset?: number) => {
  return fetchData('courses', '*', undefined, {
    limit,
    offset,
    orderBy: { column: 'name', ascending: true },
  });
};

export const fetchCourseById = async (courseId: string) => {
  return fetchSingleRecord('courses', 'id', courseId);
};

export const createCourse = async (courseData: any) => {
  return insertData('courses', courseData);
};

export const updateCourse = async (courseId: string, courseData: any) => {
  return updateData('courses', 'id', courseId, courseData);
};

export const deleteCourse = async (courseId: string) => {
  return deleteData('courses', 'id', courseId);
};

// Tee box-specific functions
export const fetchTeeBoxes = async (courseId: string) => {
  return fetchData('tee_sets', '*', [{ column: 'course_id', value: courseId }]);
};

export const createTeeBoxes = async (teeBoxesData: any[]) => {
  return insertData('tee_sets', teeBoxesData);
};

export const deleteTeeBoxes = async (courseId: string) => {
  return deleteData('tee_sets', 'course_id', courseId);
};

// Hole-specific functions
export const fetchHoles = async (courseId: string) => {
  return fetchData('holes', '*', [{ column: 'course_id', value: courseId }], {
    orderBy: { column: 'hole_number', ascending: true },
  });
};

export const createHoles = async (holesData: any[]) => {
  return insertData('holes', holesData);
};

export const deleteHoles = async (courseId: string) => {
  return deleteData('holes', 'course_id', courseId);
}; 