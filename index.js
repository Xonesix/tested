import OpenAI from 'openai';
import dotenv from 'dotenv';
import express from 'express';
import ServerlessHttp from 'serverless-http';
import bodyParser from 'body-parser';
dotenv.config();

const OPEN_API_KEY = process.env.OPEN_API_KEY;
const openai = new OpenAI({ apiKey: OPEN_API_KEY });

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
const port = process.env.PORT || 3000;

// Use bodyParser to parse JSON bodies
app.use(bodyParser.json());
const systemInstruction = "You are an assistant for diagnosing diseases/illnesses.\nRespond in this specific manner\nFirst give a list of likely diseases and explanations for why.\nThen Specifically add the token '|' (required) between and give a list of suggested medications if exist, if not, then don't type anything";

// POST endpoint to receive userInput and respond with the AI's output
app.post('/diagnose', async (req, res) => {
  console.log("Received request:", req.body);
  const { userInput } = req.body;

  if (!userInput) {
    console.error("userInput is missing.");
    return res.status(400).send({ error: 'userInput is required.' });
  }

  try {
    console.log("Calling OpenAI with userInput:", userInput);
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: userInput }],
      model: "gpt-3.5-turbo",
    });

    console.log("OpenAI response received");
    const rawResponse = completion.choices[0].message.content;
    const responseParts = rawResponse.split('|');
    const jsonResponse = {
      illness: responseParts[0].trim(),
      medication: responseParts.length > 1 ? responseParts[1].trim() : ""
    };

    res.json(jsonResponse);
  } catch (error) {
    console.error("Failed to call OpenAI:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// export const handler = ServerlessHttp(app);