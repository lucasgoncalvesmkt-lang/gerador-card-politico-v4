
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { models } from '../../models';

export const runtime = 'nodejs';

async function removeBackgroundWithRembg(input: Buffer) {
  const apiUrl = process.env.REMBG_API_URL;
  if (!apiUrl) return input;

  const form = new FormData();
  form.append('file', new Blob([input]), 'foto.png');

  const response = await fetch(`${apiUrl}/remove-bg`, { method: 'POST', body: form });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Erro ao remover fundo no backend Rembg.');
  }
  return Buffer.from(await response.arrayBuffer());
}

async function trimTransparentImage(input: Buffer) {
  return sharp(input)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const photo = data.get('photo') as File | null;
    const modelSlug = String(data.get('model') || '');

    if (!photo) return new NextResponse('Foto não enviada.', { status: 400 });

    const selected = models.find((item) => item.slug === modelSlug) || models[0];

    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const noBg = await removeBackgroundWithRembg(photoBuffer);
    const trimmed = await trimTransparentImage(noBg);

    const root = process.cwd();
    const fundo = await fs.readFile(path.join(root, 'public', 'templates', selected.slug, 'fundo.png'));
    const politicos = await fs.readFile(path.join(root, 'public', 'templates', selected.slug, 'politicos.png'));

    const apoiador = await sharp(trimmed)
      .rotate()
      .resize({
        width: selected.supporter.width,
        height: selected.supporter.height,
        fit: 'cover',
        position: 'top'
      })
      .png()
      .toBuffer();

    const card = await sharp(fundo)
      .resize(1080, 1350)
      .composite([
        { input: apoiador, left: selected.supporter.left, top: selected.supporter.top },
        { input: politicos, left: 0, top: 0 }
      ])
      .png()
      .toBuffer();

    return new NextResponse(card, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="card-${selected.slug}.png"`
      }
    });
  } catch (error: any) {
    return new NextResponse(error.message || 'Erro ao gerar card.', { status: 500 });
  }
}
