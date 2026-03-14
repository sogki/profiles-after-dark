import { LockKeyhole } from 'lucide-react';

interface StripeSecurityNoticeProps {
  className?: string;
}

export default function StripeSecurityNotice({ className = '' }: StripeSecurityNoticeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 ${className}`}
    >
      <LockKeyhole className="h-3.5 w-3.5" />
      Payments secured via Stripe
    </div>
  );
}

