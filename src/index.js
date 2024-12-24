import supabase from "./config/supabaseClient.js";
import dotenv from 'dotenv';

dotenv.config()
const Home =()=>{
  console.log(supabase)
}

export default Home;

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});