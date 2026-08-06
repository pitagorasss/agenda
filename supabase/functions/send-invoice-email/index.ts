import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { invoiceUrl, contractName, productName, invoiceEmail, fileName } = await req.json()

    if (!invoiceEmail || !invoiceUrl) {
      return new Response(
        JSON.stringify({ error: "invoiceEmail e invoiceUrl são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const resend = new Resend(resendApiKey)

    const { data, error } = await resend.emails.send({
      from: "Travessia ERP <onboarding@resend.dev>",
      to: [invoiceEmail],
      subject: `Nota Fiscal - ${contractName} - ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16A34A;">Nova Nota Fiscal Disponível</h2>
          <p>Uma nova nota fiscal foi anexada ao contrato <strong>${contractName}</strong>.</p>
          
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Contrato:</strong> ${contractName}</p>
            <p><strong>Produto:</strong> ${productName}</p>
            <p><strong>Arquivo:</strong> ${fileName}</p>
          </div>
          
          <p>
            <a href="${invoiceUrl}" 
               style="display: inline-block; background: #16A34A; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Baixar Nota Fiscal
            </a>
          </p>
          
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 12px;">
            Enviado automaticamente pelo Travessia ERP
          </p>
        </div>
      `,
    })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, emailId: data?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})