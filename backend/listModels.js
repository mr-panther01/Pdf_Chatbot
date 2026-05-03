import dotenv from "dotenv";
dotenv.config();

async function listAvailableModels() {
  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Available models:");
    if (data.models) {
      data.models.forEach(m => {
        console.log(`- ${m.name} (${m.supportedGenerationMethods.join(", ")})`);
      });
    } else {
        console.log(data);
    }
  } catch (error) {
    console.error('Error fetching models:', error);
  }
}

listAvailableModels();
