import mongoose from "mongoose";

mongoose.set("strictQuery", false);

const dbConnect = async (): Promise<void> => {
  try {
    // Pehle check karte hain ki URL theek se aa raha hai ya 'undefined' hai
    console.log("Check URL: ", process.env.MONGODB_URL);

    // 'await' lagana sabse zaroori hai yahan
    const conn = await mongoose.connect(process.env.MONGODB_URL as string);
    
    console.log("Database Connected successfully 🎉");
  } catch (error: any) {
    // Ab yeh line humein pakka batayegi ki gadbad kahan hai!
    console.log("🚨 Asli Database Error 🚨: ", error.message);
  }
};

export default dbConnect;