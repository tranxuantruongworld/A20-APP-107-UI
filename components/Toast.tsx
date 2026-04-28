'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error' | 'info';
}

export function Toast({
  message,
  isVisible,
  onClose,
  duration = 4000,
  type = 'success',
}: ToastProps) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!show) return null;

  const bgColor =
    type === 'success'
      ? 'bg-emerald-50 border-emerald-200'
      : type === 'error'
        ? 'bg-red-50 border-red-200'
        : 'bg-blue-50 border-blue-200';

  const textColor =
    type === 'success'
      ? 'text-emerald-800'
      : type === 'error'
        ? 'text-red-800'
        : 'text-blue-800';

  const iconColor =
    type === 'success'
      ? 'text-emerald-600'
      : type === 'error'
        ? 'text-red-600'
        : 'text-blue-600';

  return (
    <div
      className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300`}
    >
      <div
        className={`${bgColor} border-2 px-5 py-3.5 rounded-xl flex items-center gap-3 shadow-lg`}
      >
        <CheckCircle2 size={20} className={iconColor} />
        <p className={`${textColor} text-sm font-semibold`}>{message}</p>
        <button
          onClick={() => {
            setShow(false);
            onClose();
          }}
          className={`ml-2 ${iconColor} hover:opacity-70 transition-opacity`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
