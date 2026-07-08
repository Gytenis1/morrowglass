export interface ShareCardData {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  archetype: string;
  referralCode: string;
  url: string;
}

export function renderShareCardCanvas(data: ShareCardData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#241548');
  grad.addColorStop(0.55, '#160c30');
  grad.addColorStop(1, '#0a0616');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // subtle "stars"
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  let starSeed = 42;
  for (let i = 0; i < 140; i += 1) {
    starSeed = (starSeed * 9301 + 49297) % 233280;
    const x = (starSeed / 233280) * canvas.width;
    starSeed = (starSeed * 9301 + 49297) % 233280;
    const y = (starSeed / 233280) * canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#d4af37';
  ctx.font = '600 40px Georgia, serif';
  ctx.fillText('M O R R O W G L A S S', canvas.width / 2, 170);

  ctx.fillStyle = '#f4f0ff';
  ctx.font = '400 30px Georgia, serif';
  ctx.fillText('Your Cosmic Personality', canvas.width / 2, 225);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 58px Georgia, serif';
  wrapText(ctx, `${data.sunSign} · ${data.moonSign} · ${data.risingSign}`, canvas.width / 2, 520, 900, 64);

  ctx.fillStyle = '#d4af37';
  ctx.font = 'italic 38px Georgia, serif';
  ctx.fillText(data.archetype, canvas.width / 2, 610);

  ctx.fillStyle = '#c9c2e0';
  ctx.font = '400 26px system-ui, sans-serif';
  ctx.fillText(data.url, canvas.width / 2, canvas.height - 150);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText(`Referral code: ${data.referralCode}`, canvas.width / 2, canvas.height - 96);

  return canvas;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(' ');
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const testLine = line.length > 0 ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.length > 0) ctx.fillText(line, x, cursorY);
}

type ShareNavigator = Navigator & {
  canShare?: (data?: { files?: File[] }) => boolean;
  share?: (data: { files?: File[]; title?: string; text?: string; url?: string }) => Promise<void>;
};

export async function shareCardImage(canvas: HTMLCanvasElement, filename: string, shareText: string): Promise<'shared' | 'downloaded' | 'failed'> {
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return 'failed';

  const nav = navigator as ShareNavigator;
  const file = new File([blob], filename, { type: 'image/png' });

  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Morrowglass', text: shareText });
      return 'shared';
    } catch {
      // user cancelled or share failed — fall back to download
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}

export function socialIntentUrl(network: 'facebook' | 'x', url: string, text: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  if (network === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
}

export async function copyLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
