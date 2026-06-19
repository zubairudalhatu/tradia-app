import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";

const channels: Array<{
  label: string;
  href: string;
  Icon: IconType;
}> = [
  { label: "X", href: "https://x.com/tradiabusiness", Icon: FaXTwitter },
  { label: "Instagram", href: "https://www.instagram.com/tradiabusiness", Icon: FaInstagram },
  { label: "Facebook", href: "https://www.facebook.com/tradiabusiness", Icon: FaFacebookF },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/tradiabusiness", Icon: FaLinkedinIn },
  { label: "TikTok", href: "https://www.tiktok.com/@tradiabusiness", Icon: FaTiktok },
  { label: "YouTube", href: "https://www.youtube.com/@tradiabusiness", Icon: FaYoutube }
];

type SocialLinksProps = {
  className?: string;
  compact?: boolean;
  showHandle?: boolean;
};

export function SocialLinks({ className = "", compact = false, showHandle = false }: SocialLinksProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} aria-label="Tradia social media channels">
      {channels.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-2 rounded-full border border-current/20 font-bold transition hover:bg-current/10 ${
            compact ? "p-2" : "px-3 py-2"
          }`}
          aria-label={`Tradia on ${label}`}
          title={`Tradia on ${label}`}
        >
          <Icon aria-hidden="true" className="h-4 w-4" />
          {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
        </a>
      ))}
      {showHandle ? <span className="font-bold">@tradiabusiness</span> : null}
    </div>
  );
}
