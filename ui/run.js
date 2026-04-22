const apiKey = "AIzaSyBtN9o8F5mTo4qQyHJsW4nzWHCeoPo4dNk";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${apiKey}`;

async function testGemma() {
  // Chúng ta viết hướng dẫn cực kỳ chi tiết trong prompt thay vì dùng tham số hệ thống
  const prompt = `
[SYSTEM]
Bạn là một trợ lý hỗ trợ gọi hàm. Nếu người dùng hỏi về thời tiết, bạn CHỈ ĐƯỢC trả về kết quả theo cấu trúc chính xác như sau:
CALL_FUNCTION: get_weather | ARGS: {"location": "tên thành phố"}

Nếu không cần gọi hàm, hãy trả lời như người bình thường.

[USER]
Thời tiết ở Hà Nội hôm nay thế nào?
`;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      console.error("Lỗi API:", data.error.message);
      return;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Raw Response:", text);

    // Kiểm tra xem text có chứa pattern gọi hàm không
    if (text.includes("CALL_FUNCTION:")) {
      console.log("✅ Gemma 3 đã phản hồi cấu trúc gọi hàm.");
      
      // Logic để bóc tách dữ liệu
      const parts = text.split("|");
      const funcName = parts[0].replace("CALL_FUNCTION:", "").trim();
      const argsStr = parts[1].replace("ARGS:", "").trim();
      
      try {
        const args = JSON.parse(argsStr);
        console.log("- Tên hàm đã bắt được:", funcName);
        console.log("- Tham số đã bắt được:", args);
      } catch (e) {
        console.log("Lỗi parse JSON trong chuỗi trả về.");
      }
    } else {
      console.log("Model trả về văn bản thông thường.");
    }

  } catch (error) {
    console.error("Lỗi thực thi:", error.message);
  }
}

testGemma();