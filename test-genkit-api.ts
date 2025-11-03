/**
 * Test script for Genkit API
 * Run with: npx tsx test-genkit-api.ts
 */

const API_BASE = 'http://localhost:3000';

async function testGenkitUpload() {
  console.log('🧪 Testing Genkit Upload API...\n');

  const samplePdfContent = `
    Q4 2024 Market Analysis Report
    
    Executive Summary:
    The technology market showed strong growth in Q4 2024, with AI and cloud computing 
    leading the charge. Total market size reached $5.2 billion, up 23% from Q3.
    
    Key Products:
    - CloudSync Pro: Enterprise cloud storage solution
    - AI Assistant Plus: Advanced AI productivity tool
    - DataViz Analytics: Business intelligence platform
    
    Market Figures:
    - Total Revenue: $5.2B
    - Growth Rate: 23% QoQ
    - Active Users: 2.3M
    - Customer Satisfaction: 4.7/5
    
    Key Insights:
    1. AI adoption accelerated by 45% in enterprise segment
    2. Cloud migration continues to drive infrastructure spending
    3. Mobile-first solutions gaining traction in SMB market
    
    Market Trends:
    - Increased focus on AI integration
    - Growing demand for hybrid cloud solutions
    - Rising importance of data privacy and security
  `;

  try {
    const response = await fetch(`${API_BASE}/api/market-analyst/genkit-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentName: 'Q4-2024-Test-Report.pdf',
        content: samplePdfContent,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Upload successful!\n');
      console.log('📄 Document ID:', result.firestoreDocId);
      console.log('\n📊 Extracted Data:');
      console.log('Summary:', result.extractedData.summary.substring(0, 100) + '...');
      console.log('Products:', result.extractedData.products);
      console.log('Figures:', result.extractedData.figures);
      console.log('Key Insights:', result.extractedData.keyInsights);
      console.log('Market Trends:', result.extractedData.marketTrends);
    } else {
      console.error('❌ Upload failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testGetReports() {
  console.log('\n\n🧪 Testing Get Reports API...\n');

  try {
    const response = await fetch(`${API_BASE}/api/market-analyst/reports?limit=5`);
    const result = await response.json();

    if (result.success) {
      console.log(`✅ Found ${result.count} reports\n`);
      result.reports.forEach((report: any, index: number) => {
        console.log(`${index + 1}. ${report.documentName}`);
        console.log(`   ID: ${report.id}`);
        console.log(`   Extracted: ${report.extractedAt}`);
        console.log(`   Products: ${report.products?.length || 0}`);
        console.log('');
      });
    } else {
      console.error('❌ Failed to get reports:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Genkit API Tests\n');
  console.log('Make sure your dev server is running: npm run dev\n');
  console.log('=' .repeat(60) + '\n');

  await testGenkitUpload();
  await testGetReports();

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests complete!');
}

runTests();
