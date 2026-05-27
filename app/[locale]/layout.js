import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n";
import AppShell from "@/components/AppShell";

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  return <AppShell>{children}</AppShell>;
}
