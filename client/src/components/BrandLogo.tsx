import React from 'react';

export type BrandName =
  | 'linkedin'
  | 'x'
  | 'github'
  | 'gemini'
  | 'openai'
  | 'word'
  | 'powerpoint'
  | 'excel'
  | 'pdf'
  | 'neon'
  | 'prisma'
  | 'ffmpeg'
  | 'google';

interface BrandLogoProps {
  name: BrandName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  name,
  size = 18,
  className = '',
  style = {},
  color,
}) => {
  const iconStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: 'inline-block',
    verticalAlign: 'middle',
    flexShrink: 0,
    ...style,
  };

  switch (name) {
    case 'linkedin':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="LinkedIn logo"
          role="img"
        >
          <path
            fill={color || '#0A66C2'}
            d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9z"
          />
        </svg>
      );

    case 'x':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="X (Twitter) logo"
          role="img"
        >
          <path
            fill={color || 'currentColor'}
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      );

    case 'github':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="GitHub logo"
          role="img"
        >
          <path
            fill={color || 'currentColor'}
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
      );

    case 'gemini':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="Google Gemini logo"
          role="img"
        >
          <defs>
            <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1A73E8" />
              <stop offset="50%" stopColor="#8AB4F8" />
              <stop offset="100%" stopColor="#C5221F" />
            </linearGradient>
          </defs>
          <path
            fill={color || 'url(#gemini-grad)'}
            d="M12 2C12 7.523 7.523 12 2 12c5.523 0 10 4.477 10 10 0-5.523 4.477-10 10-10-5.523 0-10-4.477-10-10z"
          />
        </svg>
      );

    case 'openai':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="OpenAI logo"
          role="img"
        >
          <path
            fill={color || 'currentColor'}
            d="M22.281 9.827a5.984 5.984 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.748-7.067zM13.26 22.19a4.26 4.26 0 0 1-2.483-.799l.135-.078 4.14-2.39a.9.9 0 0 0 .451-.781v-5.845l1.757 1.014a.084.084 0 0 1 .044.061v5.197A4.277 4.277 0 0 1 13.26 22.19zm-8.87-4.22a4.256 4.256 0 0 1-.557-2.545l.136.08 4.14 2.39a.903.903 0 0 0 .902 0l5.062-2.923v2.028a.084.084 0 0 1-.035.067l-4.5 2.599a4.278 4.278 0 0 1-5.148-.696zm-1.12-9.69a4.254 4.254 0 0 1 1.926-1.745v4.94a.902.902 0 0 0 .451.78l5.062 2.923-1.757 1.014a.084.084 0 0 1-.079.006l-4.5-2.599A4.278 4.278 0 0 1 3.27 8.28zm14.398 3.513l-5.062-2.923 1.757-1.014a.084.084 0 0 1 .079-.006l4.5 2.599a4.277 4.277 0 0 1 1.12 6.368 4.254 4.254 0 0 1-1.926 1.745v-4.94a.9.9 0 0 0-.468-.829zm2.083-3.21a4.256 4.256 0 0 1 .557 2.545l-.136-.08-4.14-2.39a.903.903 0 0 0-.902 0l-5.062 2.923V9.553a.084.084 0 0 1 .035-.067l4.5-2.599a4.278 4.278 0 0 1 5.148.696zm-11.47 1.488l3.303-1.907 3.303 1.907v3.814l-3.303 1.907-3.303-1.907v-3.814z"
          />
        </svg>
      );

    case 'word':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="Microsoft Word logo"
          role="img"
        >
          <path
            fill={color || '#185ABD'}
            d="M21.5 3h-8A1.5 1.5 0 0 0 12 4.5v15a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 21.5 3z"
          />
          <path
            fill="#FFF"
            d="M15.2 8.5h1.4l1.2 5.1 1.2-5.1h1.4l-1.9 7h-1.3l-1.1-4.4-1.1 4.4h-1.3l-1.9-7h1.4l1.2 5.1z"
          />
          <path
            fill={color || '#103F91'}
            d="M10.5 4.5L2 6v12l8.5 1.5V4.5z"
          />
          <path
            fill="#FFF"
            d="M4.2 9.5h1.3l.9 3.6.9-3.6h1.3l-1.5 5.5H5.8L4.2 9.5z"
          />
        </svg>
      );

    case 'powerpoint':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="Microsoft PowerPoint logo"
          role="img"
        >
          <path
            fill={color || '#D24726'}
            d="M21.5 3h-8A1.5 1.5 0 0 0 12 4.5v15a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 21.5 3z"
          />
          <path
            fill="#FFF"
            d="M15.5 8.5h3a2.5 2.5 0 0 1 0 5h-1.5v2.5h-1.5v-7.5zm1.5 3.5h1.5a1 1 0 0 0 0-2H17v2z"
          />
          <path
            fill={color || '#9B2C13'}
            d="M10.5 4.5L2 6v12l8.5 1.5V4.5z"
          />
          <path
            fill="#FFF"
            d="M4.5 9.5h2.5a2 2 0 0 1 0 4H5.8v2.5H4.5v-6.5zm1.3 2.8h1.2a.8.8 0 0 0 0-1.6H5.8v1.6z"
          />
        </svg>
      );

    case 'excel':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="Microsoft Excel logo"
          role="img"
        >
          <path
            fill={color || '#107C41'}
            d="M21.5 3h-8A1.5 1.5 0 0 0 12 4.5v15a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 21.5 3z"
          />
          <path
            fill="#FFF"
            d="M15.2 8.5l1.8 3.5 1.8-3.5h1.7l-2.6 4.7 2.7 4.8h-1.7l-1.9-3.7-1.9 3.7h-1.7l2.7-4.8-2.6-4.7h1.7z"
          />
          <path
            fill={color || '#084B27'}
            d="M10.5 4.5L2 6v12l8.5 1.5V4.5z"
          />
          <path
            fill="#FFF"
            d="M4.5 9.5l1.5 2.8 1.5-2.8h1.5L6.8 12.7l2.2 3.3H7.5L6 13.5l-1.5 2.5H3L5.2 12.7 3.5 9.5h1client/src/"
          />
        </svg>
      );

    case 'pdf':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="PDF Document logo"
          role="img"
        >
          <rect width="24" height="24" rx="4" fill={color || '#E5252A'} />
          <path
            fill="#FFF"
            d="M6 16.5v-9h2.5c1.2 0 2 .8 2 2s-.8 2-2 2H7.5v5H6zm1.5-6.5h1c.4 0 .7-.3.7-.7s-.3-.7-.7-.7h-1v1.4zm5.5 6.5v-9h2.5c2 0 3.5 1.3 3.5 4.5s-1.5 4.5-3.5 4.5H13zm1.5-7.5v6h1c1.2 0 2-.9 2-3s-.8-3-2-3h-1z"
          />
        </svg>
      );

    case 'neon':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="Neon PostgreSQL logo"
          role="img"
        >
          <path
            fill={color || '#00E599'}
            d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.8l7.5 3.75v7.9L12 20.2l-7.5-3.75v-7.9L12 4.8z"
          />
          <path fill={color || '#00E599'} d="M12 8l4.5 2.25v3.5L12 16l-4.5-2.25v-3.5L12 8z" />
        </svg>
      );

    case 'prisma':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="Prisma ORM logo"
          role="img"
        >
          <path
            fill={color || '#2D3748'}
            d="M20.2 18.3L13.1 3.5c-.3-.7-1.3-.7-1.6 0L4.2 18.6c-.3.6.1 1.4.8 1.4h14.4c.7 0 1.1-.8.8-1.7zm-8.2-12l5.1 10.7H6.9l5.1-10.7z"
          />
        </svg>
      );

    case 'ffmpeg':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="FFmpeg logo"
          role="img"
        >
          <path
            fill={color || '#007800'}
            d="M2 3h20v18H2V3zm3 3v12h4v-5h3v-3H9V9h5V6H5zm9 0v3h5v3h-5v3h5v3h-5v0H14z"
          />
        </svg>
      );

    case 'google':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          aria-label="Google logo"
          role="img"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      );

    default:
      return null;
  }
};
