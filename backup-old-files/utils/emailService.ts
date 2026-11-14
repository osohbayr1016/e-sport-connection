// Nodemailer disabled; provide a minimal stub

interface EmailConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  constructor() {}

  async sendEmail({ from, to, subject, html }: EmailConfig): Promise<boolean> {
    try {
      const mailOptions = {
        from: from || process.env.EMAIL_USER,
        to,
        subject,
        html,
      };

      // Email sending disabled in this environment
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  async sendInviteEmail(
    senderName: string,
    senderEmail: string,
    recipientEmail: string,
    inviteLink?: string
  ): Promise<boolean> {
    const defaultInviteLink =
      process.env.FRONTEND_URL || "https://e-sport-connection.vercel.app";
    const finalInviteLink =
      inviteLink ||
      `${defaultInviteLink}/auth/register?ref=${encodeURIComponent(
        senderEmail
      )}`;

    const subject = `${senderName} таныг E-Sport Connection платформд урьж байна!`;

    const html = `
      <!DOCTYPE html>
      <html lang="mn">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>E-Sport Connection Урилга</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #8b5cf6, #ec4899);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header p {
            margin: 10px 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          .invite-button {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6, #ec4899);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          }
          .invite-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
          }
          .features {
            background-color: #f7fafc;
            padding: 30px;
            margin: 30px 0;
            border-radius: 8px;
            border-left: 4px solid #8b5cf6;
          }
          .features h3 {
            color: #2d3748;
            margin-bottom: 20px;
            font-size: 18px;
          }
          .feature-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .feature-list li {
            padding: 8px 0;
            color: #4a5568;
            position: relative;
            padding-left: 25px;
          }
          .feature-list li:before {
            content: '🎮';
            position: absolute;
            left: 0;
            top: 8px;
          }
          .footer {
            background-color: #2d3748;
            color: #cbd5e0;
            padding: 30px;
            text-align: center;
            font-size: 14px;
          }
          .footer a {
            color: #8b5cf6;
            text-decoration: none;
          }
          .sender-info {
            background-color: #e6fffa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
          }
          .sender-info strong {
            color: #065f46;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎮 E-Sport Connection</h1>
            <p>Монголын тэргүүлэгч e-sport платформ</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Сайн байна уу!
            </div>
            
            <div class="message">
              <strong>${senderName}</strong> таныг E-Sport Connection платформд урьж байна! 
              Энэ нь Монголын хамгийн том e-sport нэгдэл бөгөөд та энд:
            </div>

            <div class="sender-info">
              <strong>Урилга илгээгч:</strong> ${senderName} (${senderEmail})
            </div>

            <div class="features">
              <h3>🏆 Платформын боломжууд:</h3>
              <ul class="feature-list">
                <li>Адил сэтгэлгээтэй тоглогчидтой танилцах</li>
                <li>Өөрийн багийг үүсгэх эсвэл нэгдэх</li>
                <li>Тэмцээнд оролцож шагнал хүртэх</li>
                <li>Спонсортой холбогдох боломж</li>
                <li>Чат болон шууд холбоо барих</li>
                <li>Профайл үүсгэх болон статистик харах</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${finalInviteLink}" class="invite-button">
                🚀 Платформд нэгдэх
              </a>
            </div>

            <div class="message">
              Хэрэв товч ажиллахгүй бол доорх холбоосыг хуулаад шууд хөтчдөө нээнэ үү:
              <br>
              <a href="${finalInviteLink}" style="color: #8b5cf6; word-break: break-all;">${finalInviteLink}</a>
            </div>

            <div class="message" style="margin-top: 30px; font-size: 14px; color: #718096;">
              <em>Энэ урилга таны найз ${senderName} (${senderEmail})-аас ирсэн болно.</em>
            </div>
          </div>
          
          <div class="footer">
            <p>E-Sport Connection - Монголын E-Sport Платформ</p>
            <p>
              <a href="${defaultInviteLink}">Вэбсайт</a> | 
              <a href="${defaultInviteLink}/about">Тухай</a> | 
              <a href="${defaultInviteLink}/games">Тоглоомууд</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
              Хэрэв та энэ имэйлийг хүлээн авахыг хүсэхгүй бол, энэ имэйлийг устгаад зүгээр нэгтгэнэ үү.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      from: process.env.EMAIL_USER || "noreply@e-sport-connection.com",
      to: recipientEmail,
      subject,
      html,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error("Email service connection failed:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default EmailService;
