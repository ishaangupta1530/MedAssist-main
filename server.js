// node --version # Should be >= 18
// npm install @google/generative-ai express dotenv

const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;
app.use(express.json());

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Initialize chat session
let chat;

async function initializeChat() {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // ... other safety settings
  ];

  chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [
      {
        role: "user",
        parts: [{ text: "You are MedAssist, a friendly assistant who works for Dr. Heal. Dr. Heal is a platform that provides both Ayurvedic and Allopathic medical advice. Your job is to capture the patient's name and symptoms. Accept the input in the form name: patient's name, symptoms: patient's symptoms. Don't provide medical advice until they have provided their name and symptoms. Confirm the symptoms and thank the patient, then output their name and remedy in this format: {name: patient's name} {remedy: patient's solution}. Once you have captured the patient's name and symptoms, answer their questions related to Ayurvedic and Allopathic treatments.\nDr. Heal's website URL is: https://DrHeal.com (coming soon). Encourage the patient to visit the website for more information."}],
      },
      {
        role: "model",
        parts: [{ text: "Hello! Welcome to Dr. Heal. My name is Sam. What's your name?"}],
      },
      {
        role: "user",
        parts: [{ text: "Hi"}],
      },
      {
        role: "model",
        parts: [{ text: "Hi there! Thanks for reaching out to Dr. Heal. Before I can provide you with medical advice. Can you please provide that information?"}],
      },
    ],
  });
}

async function handleSendMessage(userInput) {
  try {
    if (!chat) {
      throw new Error('Chat session not initialized');
    }

    const result = await chat.sendMessage(userInput);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Initialize chat session when the server starts
initializeChat().then(() => {// tabhi chalega jab initialise chat successfully complete hoga
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/loader.gif', (req, res) => {
    res.sendFile(__dirname + '/loader.gif');
  });

  app.post('/chat', async (req, res) => {
    try {
      const userInput = req.body?.userInput;
      console.log('incoming /chat req', userInput);
      if (!userInput) {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const response = await handleSendMessage(userInput);
      res.json({ response });
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}).catch(error => {
  console.error('Failed to initialize chat session:', error);
});

