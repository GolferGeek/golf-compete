import { format } from 'date-fns';

// Test basic date-fns functionality
const now = new Date();
const formatted = format(now, 'yyyy-MM-dd');
console.log('Formatted date:', formatted);

export {}; 