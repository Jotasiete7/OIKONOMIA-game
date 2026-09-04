/**
 * logo_generator.js — Gerador Procedural Determinístico de Logotipos & Identicons
 * OIKONOMIA v0.8.4
 */

export function hashStringToSeed(str) {
  let hash = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export const LOGO_ICONS = {
  crown:   { name: 'Coroa',      svgPath: 'M3 17h18v2H3v-2zm1-2l2-7 4.5 3.5L12 4l1.5 7.5L18 8l2 7H4z' },
  cog:     { name: 'Engrenagem', svgPath: 'M12 8a4 4 0 100 8 4 4 0 000-8zm-1-6h2v3h-2V2zm0 17h2v3h-2v-3zm9-8v2h-3v-2h3zM2 11h3v2H2v-2zm14.8-5.4l1.4 1.4-2.1 2.1-1.4-1.4 2.1-2.1zM6.9 15.7l1.4 1.4-2.1 2.1-1.4-1.4 2.1-2.1zm11.3 2.1l-1.4 1.4-2.1-2.1 1.4-1.4 2.1 2.1zM8.3 4.9l-1.4 1.4-2.1-2.1 1.4-1.4 2.1 2.1z' },
  anchor:  { name: 'Âncora',     svgPath: 'M12 2a3 3 0 100 6 3 3 0 000-6zm-1 7h2v9.8c3.4-.4 6-3.3 6-6.8h2c0 4.6-3.5 8.4-8 8.9V23h-2v-2.1c-4.5-.5-8-4.3-8-8.9h2c0 3.5 2.6 6.4 6 6.8V9z' },
  wheat:   { name: 'Trigo',      svgPath: 'M12 2c-.6 2.2-2.5 3.8-4.8 4 2.3.2 4.2 1.8 4.8 4 .6-2.2 2.5-3.8 4.8-4-2.3-.2-4.2-1.8-4.8-4zm-3 8c-.6 2.2-2.5 3.8-4.8 4 2.3.2 4.2 1.8 4.8 4 .6-2.2 2.5-3.8 4.8-4-2.3-.2-4.2-1.8-4.8-4zm6 0c-.6 2.2-2.5 3.8-4.8 4 2.3.2 4.2 1.8 4.8 4 .6-2.2 2.5-3.8 4.8-4-2.3-.2-4.2-1.8-4.8-4zm-4 7v5h2v-5h-2z' },
  gem:     { name: 'Diamante',   svgPath: 'M6 3h12l5 6-11 12L1 9l5-6zm1.2 2L4 8.5h4.8L7.2 5zm2.8 0l1.4 3.5h3.2L16 5h-6zm5.6 0l-1.6 3.5h4.8L16.8 5zM3.4 10.5l7.6 8.3v-8.3H3.4zm9.6 8.3l7.6-8.3h-7.6v8.3z' },
  pillar:  { name: 'Templo',     svgPath: 'M12 2L2 7v2h20V7L12 2zm-8 8v9h3v-9H4zm5 0v9h3v-9H9zm5 0v9h3v-9h-3zm5 0v9h3v-9h-3zM2 20v2h20v-2H2z' },
  swords:  { name: 'Espadas',    svgPath: 'M19.7 2.3a1 1 0 00-1.4 0l-5.3 5.3 1.4 1.4 5.3-5.3a1 1 0 000-1.4zM4.3 17.7l1.4 1.4L11 13.8l-1.4-1.4-5.3 5.3zm-2 2a1 1 0 000 1.4l.6.6a1 1 0 001.4 0l2-2-2-2-2 2zM4.3 6.3L17.7 19.7a1 1 0 001.4 0l.6-.6a1 1 0 000-1.4L6.3 4.3 4.3 6.3z' },
  diamond: { name: 'Losango',    svgPath: 'M12 2L2 12l10 10 10-10L12 2zm0 4.2L17.8 12 12 17.8 6.2 12 12 6.2z' },
  eagle:   { name: 'Águia',      svgPath: 'M12 3l-3 4-6 1 4 5-1 6 6-3 6 3-1-6 4-5-6-1-3-4zm0 4.5l1.8 2.4 3.6.6-2.4 3 .6 3.6-3.6-1.8-3.6 1.8.6-3.6-2.4-3 3.6-.6L12 7.5z' },
  star:    { name: 'Estrela',    svgPath: 'M12 2l2.9 6.6 7.1.6-5.3 4.8 1.6 7-6.3-3.7-6.3 3.7 1.6-7L2 9.2l7.1-.6L12 2z' }
};

export function generateCompanyLogo(companyName, regenSeed = 0, isAICompetitor = false) {
  const name = (companyName || 'OIKONOMIA').trim();
  const seed = hashStringToSeed(name + (regenSeed || 0).toString());

  const iconKeys = Object.keys(LOGO_ICONS);
  const iconKey = iconKeys[seed % iconKeys.length];
  const shapeKeys = ['circle', 'shield', 'hexagon'];
  const shape = shapeKeys[Math.floor(seed / iconKeys.length) % shapeKeys.length];

  const PLAYER_COLORS = ['#d4b483', '#c9a86a', '#e0c28f', '#b8935f'];
  const AI_COLORS = ['#c0392b', '#e74c3c', '#d35400', '#a93226'];

  const palette = isAICompetitor ? AI_COLORS : PLAYER_COLORS;
  const color = palette[seed % palette.length];

  return {
    iconKey,
    iconDef: LOGO_ICONS[iconKey],
    shape,
    color,
    seed,
    isAICompetitor
  };
}

export function getCompanyLogoSvg(logo, size = 24) {
  if (!logo) logo = generateCompanyLogo('OIKONOMIA', 0, false);
  const r = size / 2;
  const strokeW = Math.max(1, (size / 16).toFixed(1));
  let shapeSvg = '';

  if (logo.shape === 'circle') {
    shapeSvg = `<circle cx="${r}" cy="${r}" r="${r - 1.5}" fill="${logo.color}" stroke="#0f172a" stroke-width="${strokeW}"/>`;
  } else if (logo.shape === 'shield') {
    shapeSvg = `<path d="M 2 2 h ${size - 4} v ${size * 0.45} q -${size * 0.15} ${size * 0.45} -${r - 2} ${size * 0.48} q -${size * 0.35} -${size * 0.03} -${r - 2} -${size * 0.48} Z" fill="${logo.color}" stroke="#0f172a" stroke-width="${strokeW}"/>`;
  } else if (logo.shape === 'hexagon') {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      pts.push(`${(r + (r - 2) * Math.cos(a)).toFixed(1)},${(r + (r - 2) * Math.sin(a)).toFixed(1)}`);
    }
    shapeSvg = `<polygon points="${pts.join(' ')}" fill="${logo.color}" stroke="#0f172a" stroke-width="${strokeW}"/>`;
  }

  const iconScale = ((size * 0.52) / 24).toFixed(3);
  const iconOffset = ((size - 24 * iconScale) / 2).toFixed(1);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="inline-block shrink-0 select-none overflow-visible">
      ${shapeSvg}
      <g transform="translate(${iconOffset}, ${iconOffset}) scale(${iconScale})">
        <path d="${logo.iconDef ? logo.iconDef.svgPath : ''}" fill="#0f172a"/>
      </g>
    </svg>
  `;
}

export function drawCanvasCompanyLogoBadge(ctx, logo, cx, cy, radius, zoom) {
  if (!logo) return;
  ctx.save();
  const r = Math.max(6, radius * zoom);

  // Sombra projetada elegante
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 5 * zoom;
  ctx.shadowOffsetY = 2.5 * zoom;

  // Forma geométrica do brasão
  ctx.beginPath();
  if (logo.shape === 'circle') {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (logo.shape === 'shield') {
    ctx.moveTo(cx - r, cy - r * 0.85);
    ctx.lineTo(cx + r, cy - r * 0.85);
    ctx.lineTo(cx + r, cy + r * 0.15);
    ctx.quadraticCurveTo(cx + r * 0.6, cy + r * 1.05, cx, cy + r * 1.25);
    ctx.quadraticCurveTo(cx - r * 0.6, cy + r * 1.05, cx - r, cy + r * 0.15);
    ctx.closePath();
  } else if (logo.shape === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const hx = cx + r * Math.cos(angle);
      const hy = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
  }

  ctx.fillStyle = logo.color || '#d4b483';
  ctx.fill();

  // Borda escura de contraste
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = Math.max(1.2, 1.6 * zoom);
  ctx.stroke();

  // Anel interno sutil de acabamento
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = Math.max(0.8, 0.9 * zoom);
  ctx.stroke();

  // Símbolo iconográfico centralizado
  if (logo.iconDef && logo.iconDef.svgPath) {
    if (!logo.iconDef._path2d && typeof Path2D !== 'undefined') {
      logo.iconDef._path2d = new Path2D(logo.iconDef.svgPath);
    }
    if (logo.iconDef._path2d) {
      ctx.save();
      const iconScale = (r * 1.05) / 24;
      ctx.translate(cx, cy + (logo.shape === 'shield' ? 0.3 * zoom : 0));
      ctx.scale(iconScale, iconScale);
      ctx.translate(-12, -12);
      ctx.fillStyle = '#0f172a';
      ctx.fill(logo.iconDef._path2d);
      ctx.restore();
    }
  }

  ctx.restore();
}
