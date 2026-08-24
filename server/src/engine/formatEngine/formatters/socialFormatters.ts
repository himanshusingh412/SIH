import { StyleConfig } from '../styleEngine';

export interface LinkedInPostInput {
  hook: string;
  context: string;
  keyInsights: string[];
  whyItMatters: string;
  callToAction: string;
  hashtags: string[];
}

export interface XThreadPost {
  postNumber: number;
  content: string;
}

export interface EmailInput {
  subject: string;
  preheader: string;
  greeting: string;
  sections: Array<{ title?: string; text: string; bulletPoints?: string[] }>;
  callToAction: string;
  signOff: string;
}

export class SocialFormatters {
  /**
   * Format LinkedIn post with hook, short paragraphs, bullet points, CTA, hashtags
   */
  formatLinkedInPost(input: LinkedInPostInput, styleConfig?: StyleConfig): string {
    const bulletChar = styleConfig?.bulletChar || '•';
    const hashtagStr = input.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');

    return `${input.hook.toUpperCase()}

${input.context}

Key Insights:
${input.keyInsights.map((ki) => `${bulletChar} ${ki}`).join('\n')}

Why it matters:
${input.whyItMatters}

${input.callToAction}

${hashtagStr}`;
  }

  /**
   * Format X Thread with 1/, 2/, 3/ numbering and character limit validation (<= 280 chars)
   */
  formatXThread(posts: string[]): { thread: XThreadPost[]; isValid: boolean; maxLen: number } {
    let isValid = true;
    let maxLen = 0;

    const thread = posts.map((postText, idx) => {
      const prefix = `${idx + 1}/${posts.length}\n`;
      const fullPost = `${prefix}${postText.trim()}`;
      if (fullPost.length > 280) {
        isValid = false;
      }
      maxLen = Math.max(maxLen, fullPost.length);
      return {
        postNumber: idx + 1,
        content: fullPost,
      };
    });

    return { thread, isValid, maxLen };
  }

  /**
   * Format HTML & Plain Text Email
   */
  formatEmail(input: EmailInput): { plainText: string; html: string; subject: string } {
    const plainText = `Subject: ${input.subject}
Preheader: ${input.preheader}

${input.greeting}

${input.sections
  .map((s) => `${s.title ? `${s.title.toUpperCase()}\n` : ''}${s.text}${s.bulletPoints ? `\n${s.bulletPoints.map((bp) => `• ${bp}`).join('\n')}` : ''}`)
  .join('\n\n')}

${input.callToAction}

${input.signOff}`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${input.subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 20px; background: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb; }
    h1 { color: #1e3a8a; font-size: 20px; margin-bottom: 8px; }
    h2 { color: #374151; font-size: 16px; margin-top: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
    p { margin-bottom: 14px; font-size: 15px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 6px; font-size: 14px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px; }
    .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <p><strong>${input.greeting}</strong></p>
    ${input.sections
      .map(
        (s) => `
      ${s.title ? `<h2>${s.title}</h2>` : ''}
      <p>${s.text}</p>
      ${s.bulletPoints ? `<ul>${s.bulletPoints.map((bp) => `<li>${bp}</li>`).join('')}</ul>` : ''}
    `
      )
      .join('')}
    <a href="#" class="btn">${input.callToAction}</a>
    <div class="footer">
      <p>${input.signOff}</p>
      <p><em>ContentSpine AI Verified Email Delivery</em></p>
    </div>
  </div>
</body>
</html>`;

    return { plainText, html, subject: input.subject };
  }
}

export const socialFormatters = new SocialFormatters();
