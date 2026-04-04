

function emailWrapper(content) {
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#0F172A;border-radius:12px 12px 0 0;padding:24px 40px;">
              <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                🚢 Travels App
              </span>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:48px 40px 40px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#F1F5F9;border-radius:0 0 12px 12px;border:1px solid #E2E8F0;border-top:none;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#64748B;">
                Bu e-postayı <strong>Travels App</strong> gönderdi.
              </p>
              <p style="margin:0;font-size:12px;color:#94A3B8;">
                © ${new Date().getFullYear()} Travels App · Tüm hakları saklıdır
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function welcomeTemplate(firstName, url) {
    const content = `
      <div style="display:inline-block;background-color:#EEF2FF;border-radius:100px;padding:6px 14px;margin-bottom:28px;">
        <span style="font-size:13px;font-weight:600;color:#4F46E5;">🎉 Hoş geldin!</span>
      </div>

      <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#0F172A;line-height:1.3;letter-spacing:-0.5px;">
        Seni aramızda görmekten<br/>çok mutluyuz, ${firstName}!
      </h1>

      <p style="margin:0 0 10px;font-size:16px;color:#334155;line-height:1.7;">
        Travels App ailesine katıldın — harika bir karar! 🚀
      </p>
      <p style="margin:0 0 32px;font-size:16px;color:#64748B;line-height:1.7;">
        Profilini tamamlayarak kişiselleştirilmiş deneyimini başlatabilirsin.
      </p>

      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-radius:8px;background-color:#6366F1;">
            <a href="${url}"
               style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
              Profilini Tamamla →
            </a>
          </td>
        </tr>
      </table>

      <hr style="margin:40px 0;border:none;border-top:1px solid #E2E8F0;" />

      <p style="margin:0;font-size:14px;color:#64748B;line-height:1.6;">
        Herhangi bir sorun yaşarsan
        <a href="mailto:support@geminiapp.com" style="color:#6366F1;text-decoration:none;font-weight:500;">support@geminiapp.com</a>
        adresinden bize ulaşabilirsin.
      </p>
    `;

    return emailWrapper(content);
}

export function passwordResetTemplate(url) {
    const content = `
      <div style="display:inline-block;background-color:#FEF2F2;border-radius:100px;padding:6px 14px;margin-bottom:28px;">
        <span style="font-size:13px;font-weight:600;color:#DC2626;">🔐 Güvenlik bildirimi</span>
      </div>

      <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#0F172A;line-height:1.3;letter-spacing:-0.5px;">
        Şifre sıfırlama talebinde bulundun
      </h1>

      <p style="margin:0;font-size:16px;color:#334155;line-height:1.7;">
        Hesabın için bir şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak yeni şifreni oluşturabilirsin.
      </p>

      <div style="background-color:#FFF7ED;border-left:4px solid #F97316;border-radius:0 6px 6px 0;padding:14px 18px;margin:24px 0 32px;">
        <p style="margin:0;font-size:14px;color:#9A3412;font-weight:500;">
          ⏱ Bu bağlantı <strong>10 dakika</strong> içinde geçerliliğini yitirecek.
        </p>
      </div>

      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-radius:8px;background-color:#0F172A;">
            <a href="${url}"
               style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
              Şifremi Sıfırla →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:20px 0 0;font-size:13px;color:#64748B;line-height:1.6;">
        Buton çalışmıyorsa bu bağlantıyı tarayıcına yapıştır:<br/>
        <a href="${url}" style="color:#6366F1;text-decoration:none;word-break:break-all;">${url}</a>
      </p>

      <hr style="margin:40px 0;border:none;border-top:1px solid #E2E8F0;" />

      <div style="background-color:#F8FAFC;border-radius:8px;padding:16px 20px;">
        <p style="margin:0;font-size:13px;color:#64748B;line-height:1.6;">
          🛡 <strong style="color:#334155;">Bu talebi sen yapmadıysan</strong> endişelenme —
          bağlantıya tıklanmadığı sürece hesabında hiçbir değişiklik olmaz.
        </p>
      </div>
    `;

    return emailWrapper(content);
}