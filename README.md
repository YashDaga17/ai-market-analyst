<h1 align="center">AI Market Analyst</h1>

<p align="center">
  Get instant AI-powered market insights from your research documents.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- **Simple Text Input Interface**
  - No complex chat interface - just paste your text and get insights
  - Clean, focused user experience
- **AI-Powered Market Analysis**
  - Automatic analysis using Google Gemini 1.5 Flash (latest free tier)
  - Extract key insights, opportunities, threats, and recommendations
  - Company overview and structured data extraction
- **Vector Search with Firestore**
  - Intelligent document storage and retrieval
  - Context-aware analysis using embeddings
- **Modern Tech Stack**
  - [Next.js](https://nextjs.org) App Router with React Server Components
  - [Firebase Firestore](https://firebase.google.com/docs/firestore) for document storage
  - [shadcn/ui](https://ui.shadcn.com) with [Tailwind CSS](https://tailwindcss.com)
  - [AI SDK](https://sdk.vercel.ai/docs) by Vercel

## Model Providers

This template ships with Google Gemini `gemini-1.5-pro` models as the default. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fgemini-chatbot&env=AUTH_SECRET,GOOGLE_GENERATIVE_AI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fgemini-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=Next.js%20Gemini%20Chatbot&demo-description=An%20Open-Source%20AI%20Chatbot%20Template%20Built%20With%20Next.js%20and%20the%20AI%20SDK%20by%20Vercel.&demo-url=https%3A%2F%2Fgemini.vercel.ai&stores=[{%22type%22:%22postgres%22},{%22type%22:%22blob%22}])

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various Google Cloud and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

## How to Use

1. Start the development server (see Running Locally above)
2. Open [localhost:3000](http://localhost:3000/) in your browser
3. Choose your input method:
   - **Paste Text**: Copy and paste your market research content
   - **Upload PDF**: Upload a PDF document for analysis
4. Click "Get Market Insights"
5. View comprehensive AI-generated analysis including:
   - Company overview and key metrics
   - Market insights and trends
   - Growth opportunities
   - Potential threats
   - Strategic recommendations

### Supported Formats
- Plain text (paste directly)
- PDF files (uploaded via file picker)
- TXT files (uploaded via file picker)
