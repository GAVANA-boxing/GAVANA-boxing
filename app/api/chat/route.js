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
        system: system || "Та GAVANA Boxing вэб сайтын мэргэжлийн боксын дасгалжуулагч. Монгол хэлээр зөв, тодорхой хариулна. Монгол үгийн дүрмийг чанд сахиж, товч бөгөөд практик зөвлөгөө өгнө. Боксын техник, дасгал, хоол тэжээл, стратегийн талаар мэддэг.",
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