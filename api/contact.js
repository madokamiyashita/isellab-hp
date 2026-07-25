// /api/contact.js  — Vercel Serverless Function
// 依存: Resend SDK  →  npm install resend  (package.json に追加)
// 環境変数: RESEND_API_KEY (Vercel > Settings > Environment Variables に設定)

const { Resend } = require('resend');

const NOTIFY_TO  = 'info@isellab.co.jp'; // 通知受信先（変更可）
const FROM_ADDR  = 'iSELLab <info@isellab.co.jp>'; // 送信元（ドメイン認証済みであること）

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { name, company, email, category, message } = req.body || {};

  // バリデーション
  if (!name || !email || !category || !message) {
    return res.status(400).json({ ok: false, error: '必須項目が不足しています。' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'メールアドレスの形式が正しくありません。' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // ① 管理者（info@isellab.co.jp）への通知メール
    await resend.emails.send({
      from: FROM_ADDR,
      to:   NOTIFY_TO,
      reply_to: email,
      subject: `【お問い合わせ】${category} — ${name}`,
      html: `
        <h2 style="color:#0A2540">新しいお問い合わせが届きました</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif;font-size:14px">
          <tr><th style="text-align:left;padding:10px 16px;background:#F0F8FF;border:1px solid #E0F2FE;width:140px">お名前</th>
              <td style="padding:10px 16px;border:1px solid #E0F2FE">${esc(name)}</td></tr>
          <tr><th style="text-align:left;padding:10px 16px;background:#F0F8FF;border:1px solid #E0F2FE">会社名</th>
              <td style="padding:10px 16px;border:1px solid #E0F2FE">${esc(company || '（未記入）')}</td></tr>
          <tr><th style="text-align:left;padding:10px 16px;background:#F0F8FF;border:1px solid #E0F2FE">メール</th>
              <td style="padding:10px 16px;border:1px solid #E0F2FE">${esc(email)}</td></tr>
          <tr><th style="text-align:left;padding:10px 16px;background:#F0F8FF;border:1px solid #E0F2FE">種別</th>
              <td style="padding:10px 16px;border:1px solid #E0F2FE">${esc(category)}</td></tr>
          <tr><th style="text-align:left;padding:10px 16px;background:#F0F8FF;border:1px solid #E0F2FE;vertical-align:top">内容</th>
              <td style="padding:10px 16px;border:1px solid #E0F2FE;white-space:pre-wrap">${esc(message)}</td></tr>
        </table>
      `,
    });

    // ② 送信者への自動返信メール
    await resend.emails.send({
      from: FROM_ADDR,
      to:   email,
      subject: '【iSELLab】お問い合わせを受け付けました',
      html: `
        <div style="font-family:sans-serif;max-width:600px;color:#1E293B">
          <h2 style="color:#0A2540;font-size:20px">${esc(name)} 様</h2>
          <p style="line-height:1.8">この度はiSELLabへお問い合わせいただきありがとうございます。<br>
          以下の内容でお問い合わせを受け付けました。<br>
          担当者より改めてご連絡いたします。</p>
          <hr style="border:none;border-top:1px solid #E0F2FE;margin:24px 0">
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <tr><th style="text-align:left;padding:10px 16px;background:#F0F8FF;border:1px solid #E0F2FE;width:140px">お名前</th>
                <td style="padding:10px 16px;border:1px solid #E0F2FE">${esc(name)}</td></tr>
            <tr><th style="text-align:left;padding:10px 16px;background:#F0F8FF;border:1px solid #E0F2FE">種別</th>
                <td style="padding:10px 16px;border:1px solid #E0F2FE">${esc(category)}</td></tr>
            <tr><th style="text-align:left;padding:10px 16px;background:#F0F8FF;border:1px solid #E0F2FE;vertical-align:top">内容</th>
                <td style="padding:10px 16px;border:1px solid #E0F2FE;white-space:pre-wrap">${esc(message)}</td></tr>
          </table>
          <p style="font-size:12px;color:#94A3B8;margin-top:32px">
            このメールはiSELLab（info@isellab.co.jp）が自動送信しています。<br>
            このメールへの返信は受け付けていません。
          </p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ ok: false, error: '送信処理でエラーが発生しました。' });
  }
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
