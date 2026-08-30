import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {GoogleGenAI} from '@google/genai';

function geminiServerPlugin(): Plugin {
  return {
    name: 'gemini-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/api/gemini/triage') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not set' }));
                return;
              }

              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
              });

              const prompt = `You are a clinical decision support AI for Indian Rural Telemedicine & Primary Health Centres.
Analyze these symptoms and vitals:
Chief complaints: "${body.chiefComplaints || 'General checkup'}"
Vitals: ${JSON.stringify(body.vitals || {})}
Patient: ${JSON.stringify(body.patient || {})}

Return a structured JSON with:
- priority: "RED" | "YELLOW" | "GREEN"
- score: number (0-100)
- categoryTitle: string
- reason: string
- differentialDiagnosis: string[]
- redFlags: string[]
- recommendedAction: string
- suggestedMedications: array of {name, genericName, dosage, frequency, instructions}
- referralRecommended: boolean
- suggestedFacilityTier: "PHC" | "CHC" | "DH" | "APEX" | "NONE"`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(response.text || '{}');
            } catch (error) {
              console.error('Gemini Triage API error:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to process triage' }));
            }
          });
          return;
        }

        if (req.method === 'POST' && req.url === '/api/gemini/scribe') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not set' }));
                return;
              }

              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
              });

              const prompt = `You are a medical scribe summarizing a teleconsultation for an Indian e-Prescription.
Doctor notes: "${body.clinicalNotes || ''}"
Diagnosis: "${body.diagnosis || ''}"
Vitals: ${JSON.stringify(body.vitals || {})}

Return a structured JSON with:
- diagnosis: string
- medications: array of {id, name, genericName, dosage, frequency, durationDays, instructions, isAvailableInLocalPharmacy: true}
- dietaryAdvice: string
- precautions: string
- followUpDays: number`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(response.text || '{}');
            } catch (error) {
              console.error('Gemini Scribe API error:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to process scribe' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
