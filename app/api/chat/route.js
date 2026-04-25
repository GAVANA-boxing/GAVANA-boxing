export async function POST(request) {
  try {
    const { messages, system } = await request.json();
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        system: system || "Та GAVANA Boxing AI дасгалжуулагч. Монгол хэлээр товч хариулна.",
        messages: messages
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      return Response.json({ content: [{ text: "API алдаа: " + data.error.message }] });
    }
    
    return Response.json({ content: data.content });
    
  } catch (error) {
    return Response.json({ content: [{ text: "Алдаа: " + error.message }] });
  }
}