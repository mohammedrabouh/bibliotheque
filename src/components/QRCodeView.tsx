import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeViewProps {
  value: string;
  size?: number;
  label?: string;
  className?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 140,
  label,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url: string) => setDataUrl(url))
      .catch((err: unknown) => console.error('Erreur génération QR code', err));
  }, [value, size]);

  return (
    <div className={`flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-slate-200 shadow-xs ${className}`}>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`QR Code ${value}`}
          style={{ width: size, height: size }}
          className="rounded-md"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="animate-pulse bg-slate-100 rounded-md flex items-center justify-center text-xs text-slate-400"
        >
          Génération...
        </div>
      )}
      {label && <span className="mt-1.5 text-[11px] font-mono text-slate-500">{label}</span>}
    </div>
  );
};
