/** Tell dropzone admins about a staff signup. No-op until RESEND_API_KEY is set. */
export async function sendMail(to: string[], subject: string, text: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  const recipients = [...new Set(to.map((email) => email.trim()).filter((email) => email.includes("@")))];
  if (!key || recipients.length === 0) return false;
  const from = process.env.STAFF_FROM_EMAIL?.trim() || "Skydive South Texas <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: recipients, subject, text }),
  });
  return response.ok;
}
