import supabase from './supabaseClient.js';

export const connectDB = async () => {
  try {
    const { data, error } = await supabase
      .from('route')  
      .select('route_name')
      .limit(5);

    if (error) {
      throw new Error(error.message);
    }
    console.log('Database connected successfully:', data);
  } catch (error) {
    console.error('Error connecting to Supabase:', error.message);
  }
};