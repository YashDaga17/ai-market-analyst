# AI Market Analyst

An intelligent document analysis system that extracts structured insights from market research documents using RAG (Retrieval-Augmented Generation) and Google Gemini AI.

## Objective

This application solves the problem of manually analyzing lengthy market research documents by automatically extracting key insights, identifying opportunities and threats, and providing strategic recommendations. It enables users to quickly understand market dynamics and make data-driven decisions.

## Result

A production-ready web application that processes PDF documents, stores them in a vector-searchable format, and provides three core capabilities:
1. Interactive Q&A with document context
2. Automated market research findings extraction
3. Structured data extraction (company info, metrics, competitors)

## Tech Stack

- Next.js 15 (App Router with React Server Components)
- Google Gemini 2.5 Flash Lite (AI model)
- Firebase Firestore (document storage)
- PDF.js (dynamic client-side PDF extraction)
- TypeScript + Tailwind CSS

## Setup & Installation

### Prerequisites

- Node.js 18+ and pnpm
- Google Cloud account with Gemini API access
- Firebase project with Firestore enabled

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-market-analyst
```

2. Install dependencies:
```bash
pnpm install
```

3. Create `.env.local` file in the root directory:
```env
# Google Gemini API Key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Cloud Project
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_LOCATION=us
```

4. Set up Firebase:
   - Create a Firestore database in your Firebase project
   - No indexes required (simple keyword search implementation)

5. Run the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
pnpm build
pnpm start
```

The application uses dynamic imports for PDF.js to ensure compatibility with Next.js static generation and server-side rendering.

## Design Decisions

### Chunking Strategy

**Choice**: 1000 characters per chunk with 200 character overlap

**Rationale**:
- 1000 characters (~150-200 words) provides sufficient context for semantic understanding
- 200 character overlap ensures continuity across chunk boundaries, preventing loss of context at split points
- Balances between granularity (for precise retrieval) and context preservation
- Optimized for Gemini's token limits while maintaining coherent text segments

**Implementation**: See `lib/document-processor-simple.ts` - `chunkText()` function

### Embedding Model

**Choice**: Keyword-based search (no embeddings)

**Rationale**:
- Simplified architecture reduces complexity and API costs
- Keyword matching is sufficient for structured market research documents with clear terminology
- Eliminates dependency on embedding APIs (Vertex AI, OpenAI)
- Faster processing and lower latency
- Trade-off: Less semantic understanding, but adequate for domain-specific queries

**Implementation**: See `lib/document-processor-simple.ts` - `searchDocumentsSimple()` function

### Vector Database

**Choice**: Firebase Firestore (without vector search)

**Rationale**:
- Client-side Firebase SDK eliminates need for server-side authentication
- Real-time updates and easy integration with Next.js
- Simple keyword-based search meets requirements without vector capabilities
- Scalable and managed infrastructure
- No additional vector database setup required
- Trade-off: No semantic similarity search, but keyword matching works well for structured documents

**Collections**:
- `market_docs_simple`: Document chunks with metadata
- `chat_messages`: Conversation history

### Data Extraction Prompt Design

**Strategy**: Structured JSON output with explicit schema definition

**Key Elements**:
1. Clear role definition: "You are an AI Market Analyst"
2. Explicit output format specification with JSON schema
3. Context-first approach: Provide document content before questions
4. Specific field requirements with examples
5. Fallback parsing with regex to extract JSON from markdown code blocks

**Example** (from `lib/market-analyst-agent.ts`):
```typescript
const prompt = `You are an AI Market Analyst with access to the user's uploaded market research document. 
Answer the following question using ONLY the information from the provided document context.

DOCUMENT CONTEXT (from uploaded PDF):
${context}

USER QUESTION: ${question}

INSTRUCTIONS:
- Answer based ONLY on the information in the document context above
- Be specific and cite relevant details from the document
- Reference specific sections like [Source 1], [Source 2]
- Provide actionable insights when possible`;
```

**Reliability Measures**:
- JSON extraction with regex fallback
- Error handling for malformed responses
- Default values for missing fields
- Validation of required fields

## API Usage

### Task 1: Q&A with Document Context

**Endpoint**: `POST /api/market-analyst/ask`

**Request**:
```json
{
  "question": "What are the main competitors?",
  "documentName": "market-report.pdf"
}
```

**Response**:
```json
{
  "answer": "The main competitors are Synergy Systems, FutureFlow, and QuantumLeap...",
  "sources": ["[Source 1] Innovate Inc. holds a significant market share...", "..."],
  "confidence": 0.8
}
```

**Implementation**: `lib/market-analyst-agent.ts` - `askQuestion()`

### Task 2: Market Research Findings

**Endpoint**: `POST /api/market-analyst/analyze`

**Request**:
```json
{
  "text": "Full document text content..."
}
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "companyName": "Innovate Inc.",
    "industry": "AI workflow automation",
    "marketSize": "$15 billion",
    "competitors": ["Synergy Systems", "FutureFlow"],
    "keyInsights": ["Market growing at 22% CAGR", "..."],
    "opportunities": ["Healthcare sector expansion", "..."],
    "threats": ["Aggressive pricing from competitors", "..."],
    "recommendations": ["Accelerate feature development", "..."],
    "swotAnalysis": {
      "strengths": ["Strong customer loyalty", "..."],
      "weaknesses": ["Slower feature rollout", "..."],
      "opportunities": ["Healthcare expansion", "..."],
      "threats": ["Rapid innovation from QuantumLeap", "..."]
    }
  }
}
```

**Implementation**: `app/api/market-analyst/analyze/route.ts`

### Task 3: Structured Data Extraction

**Endpoint**: `POST /api/market-analyst/upload-simple`

**Request**:
```json
{
  "documentName": "market-report.pdf",
  "content": "Document text content...",
  "metadata": {
    "uploadedAt": "2025-11-03T15:32:40.468Z",
    "source": "pdf_upload"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Document processed into 2 chunks (simple mode - no embeddings)",
  "chunks": 2,
  "mode": "simple"
}
```

**Implementation**: `app/api/market-analyst/upload-simple/route.ts`

## Architecture

```
User Upload → PDF Extraction (client) → Text Chunking → Firestore Storage
                                                              ↓
User Query → Keyword Search → Relevant Chunks → Gemini AI → Response
```

## Features

- PDF document upload with dynamic client-side text extraction (SSR-safe)
- Text input for direct content analysis
- Intelligent document chunking with overlap
- Keyword-based document search
- AI-powered market analysis with structured output
- Interactive chat interface with document context
- Real-time analysis results
- Responsive design with modern UI
- Static page generation support

## Project Structure

```
lib/
├── document-processor-simple.ts  # Chunking, storage, search
├── market-analyst-agent.ts       # AI analysis functions
├── pdf-extractor.ts              # Dynamic PDF text extraction (SSR-safe)
└── firebase.ts                   # Firebase client config

app/
├── market-analyst/page.tsx       # Main UI
└── api/market-analyst/
    ├── analyze/route.ts          # Market analysis endpoint
    ├── ask/route.ts              # Q&A endpoint
    └── upload-simple/route.ts    # Document upload endpoint
```
