import { Link } from "react-router-dom";
import { ArrowRight, FileEdit, PanelsTopLeft, UserRound } from "lucide-react";
import { useI18n } from "./I18nContext.jsx";

const TOOLS = [
  {
    to: "/editor",
    icon: FileEdit,
    name: "Edit PDF",
    subtitle: "ZenPDF",
    description: "Fill application forms, add dates and a visual signature, then export privately in your browser.",
  },
  {
    to: "/resume",
    icon: UserRound,
    name: "Build Resume",
    subtitle: "Resume Builder",
    description: "Turn a short form into a clean, professional resume.",
  },
  {
    to: "/portfolio",
    icon: PanelsTopLeft,
    name: "Build Portfolio",
    subtitle: "Portfolio Builder",
    description: "Reuse your professional profile and shape a responsive portfolio locally with explicit privacy controls.",
  },
];

export default function Dashboard() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-stone-100">
      <div className="mb-14 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          {t("Welcome to ZenID")}
        </h1>
        <p className="mt-3 text-base text-stone-300">{t("Your local identity workspace.")}</p>
        <p className="mt-2 text-sm text-stone-500">{t("Pick a tool to get started.")}</p>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map(({ to, icon: Icon, name, subtitle, description }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col justify-between rounded-2xl border border-stone-800/50 bg-stone-900/60 p-7 shadow-2xl shadow-black/40 backdrop-blur-sm transition-all duration-300 hover:border-stone-700 hover:bg-stone-900/80 hover:shadow-lg"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-600/10 text-amber-500 transition-colors group-hover:bg-amber-600/20">
                <Icon size={20} />
              </div>
              <p className="mt-5 text-xs font-medium uppercase tracking-wider text-stone-500 group-hover:text-stone-400">
                {t(subtitle)}
              </p>
              <h2 className="mt-1 text-xl font-medium tracking-tight text-stone-100 group-hover:text-white">
                {t(name)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">
                {t(description)}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-1.5 text-sm font-medium text-amber-500 transition-all group-hover:translate-x-1">
              {t("Open")} <ArrowRight size={15} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
