const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

interface AIAnalysisResult {
  title: string;
  tags: string[];
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  themes?: string[];
}

/**
 * Use OpenAI to analyze journal entry and generate title + tags
 */
export async function analyzeEntryWithAI(
  content: string,
  mood?: number,
  hasPhotos?: boolean,
  location?: { name?: string; coordinates?: { lat: number; lng: number } }
): Promise<AIAnalysisResult> {
  try {
    const systemPrompt = `You are an expert journal analyzer. Analyze the given journal entry and provide:
1. A concise, meaningful title (2-4 words that capture the essence)
2. Up to 10 relevant tags for future analysis

Tags should cover:
- Emotions/feelings (happy, sad, anxious, grateful, etc.)
- Activities (work, exercise, social, travel, etc.)
- Themes (family, relationships, health, achievement, etc.)
- Time context (morning, evening, weekend, etc.)
- Topics (specific subjects mentioned)
- Sentiment (overall mood)

Return ONLY valid JSON in this format:
{
  "title": "Brief Title Here",
  "tags": ["tag1", "tag2", "tag3", ...],
  "sentiment": "positive|negative|neutral|mixed",
  "themes": ["theme1", "theme2"]
}`;

    const userPrompt = `Journal Entry: "${content}"
${mood ? `\nMood Score: ${mood}/5` : ''}
${hasPhotos ? '\nIncludes photos' : ''}
${location?.name ? `\nLocation: ${location.name}` : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Ensure we have valid data
    return {
      title: result.title || 'Daily Entry',
      tags: (result.tags || []).slice(0, 10), // Limit to 10 tags
      sentiment: result.sentiment || 'neutral',
      themes: result.themes || [],
    };
  } catch (error) {
    console.error('AI Analysis failed:', error);
    // Fallback to basic analysis
    return fallbackAnalysis(content, mood, hasPhotos, location);
  }
}

/**
 * Fallback analysis when AI is unavailable
 */
function fallbackAnalysis(
  content: string,
  mood?: number,
  hasPhotos?: boolean,
  location?: { name?: string }
): AIAnalysisResult {
  const tags: string[] = [];
  const lowerContent = content.toLowerCase();
  
  // Basic title generation
  let title = 'Daily Entry';
  if (lowerContent.includes('work')) title = 'Work Day';
  else if (lowerContent.includes('family')) title = 'Family Time';
  else if (lowerContent.includes('friend')) title = 'Friend Moments';
  
  // Basic tag generation
  if (mood) {
    if (mood >= 4) tags.push('positive');
    else if (mood <= 2) tags.push('challenging');
    else tags.push('neutral');
  }
  
  if (hasPhotos) tags.push('photo-memory');
  if (location?.name) tags.push('location-tagged');
  
  // Day of week
  tags.push(new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase());
  
  return {
    title,
    tags: tags.slice(0, 10),
    sentiment: mood && mood >= 3 ? 'positive' : 'negative',
    themes: [],
  };
}