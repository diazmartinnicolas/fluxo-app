// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { Bot, webhookCallback, InlineKeyboard } from "grammy"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { MENU_PEPPERINO, BUSINESS_INFO } from "./menu.ts"

console.log("Hello from Telegram Bot Function!")

// 1. Get Secrets
const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN")
const geminiApiKey = Deno.env.get("GEMINI_API_KEY")

if (!telegramBotToken || !geminiApiKey) {
  console.error("Missing TELEGRAM_BOT_TOKEN or GEMINI_API_KEY")
}

// 2. Initialize Bot and Gemini
const bot = new Bot(telegramBotToken || "")
const genAI = new GoogleGenerativeAI(geminiApiKey || "")

// 3. Define the System Prompt
const systemPrompt = `
Eres el asistente virtual de ${BUSINESS_INFO.name}, una pizzería en Buenos Aires.

INFORMACIÓN DEL NEGOCIO:
- Dirección: ${BUSINESS_INFO.address}
- Horario: ${BUSINESS_INFO.hours}
- Zonas de Delivery: ${BUSINESS_INFO.delivery_zones.join(", ")}
- Teléfono: ${BUSINESS_INFO.phone}
- Menú Online: https://qr-pepperino2.vercel.app/

MENÚ DEL DÍA:
${JSON.stringify(MENU_PEPPERINO, null, 2)}

TU OBJETIVO:
- Responder preguntas de los clientes sobre el menú, precios y horarios.
- Si quieren ver fotos o el menú completo, recomiéndales usar el botón "🍕 Ver Menú" o ir al link.
- Ayudar a decidir qué pedir recomendando platos.
- Ser amable, conciso y usar emojis apropiados (🍕, 🥤, etc).
- Si te piden algo que no está en el menú, aclara amablemente que no lo tenemos.
- Responde siempre en español rioplatense (argentino).

IMPORTANTE:
- No inventes precios ni productos. Usa solo lo que está en el menú.
- Si preguntan por reservas, diles que por ahora solo pueden reservar llamando al ${BUSINESS_INFO.phone}.
`

// UPDATED MODEL NAME: gemini-2.5-flash (Standard for 2026)
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: systemPrompt
})

// Define Keyboard - WITH URL BUTTON
const menuKeyboard = new InlineKeyboard()
  .url("🍕 Ver Menú Visual", "https://qr-pepperino2.vercel.app/").text("🕒 Horarios", "ver_horarios").row()
  .text("📍 Ubicación", "ver_dónde").text("📞 Contacto", "ver_contacto");

// 4. Define Bot Logic
bot.command("start", (ctx) => {
  ctx.reply(
    `¡Hola! Bienvenido a ${BUSINESS_INFO.name}. 🍕\n¿Qué te gustaría saber hoy?`,
    { reply_markup: menuKeyboard }
  )
})

// Handle Button Clicks
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  let responseText = "";

  try {
    if (data === "ver_horarios") {
      responseText = (`🕒 Abrimos de ${BUSINESS_INFO.hours}.`);
    } else if (data === "ver_dónde") {
      responseText = (`📍 Estamos en ${BUSINESS_INFO.address}.\nZonas de envío: ${BUSINESS_INFO.delivery_zones.join(", ")}.`);
    } else if (data === "ver_contacto") {
      responseText = (`📞 Llámanos al ${BUSINESS_INFO.phone} para reservas.`);
    }

    await ctx.answerCallbackQuery(); // Stop loading animation
    if (responseText) {
      await ctx.reply(responseText, { parse_mode: "Markdown", reply_markup: menuKeyboard });
    }
  } catch (error) {
    console.error("Error in callback:", error);
  }
})

bot.on("message:text", async (ctx) => {
  try {
    const userMessage = ctx.message.text
    console.log(`Received message: ${userMessage}`)

    const result = await model.generateContent(userMessage)
    const response = result.response.text()

    if (!response) throw new Error("Empty response from AI")

    // Send response WITH KEYBOARD as requested
    await ctx.reply(response, { reply_markup: menuKeyboard })
  } catch (error) {
    console.error("Error generating content:", error)
    // Friendly error message WITH KEYBOARD
    await ctx.reply(
      "Uy, sigo un poco mareado (Error de IA). 🥴\nPero aquí tienes las opciones manuales para ayudarte:",
      { reply_markup: menuKeyboard }
    )
  }
})

// 5. Handle Webhook
const handleUpdate = webhookCallback(bot, "std/http")

Deno.serve(async (req) => {
  try {
    // Check if it's a valid request
    if (req.method === "POST") {
      const url = new URL(req.url)
      if (url.searchParams.get("secret") !== Deno.env.get("FUNCTION_SECRET")) {
        return new Response("Unauthorized", { status: 401 })
      }
      return await handleUpdate(req)
    }
    return new Response("OK. Send POST request to use webhook.")
  } catch (err) {
    console.error(err)
    return new Response(err.message, { status: 500 })
  }
})
