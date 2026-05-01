import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { locales } from "@/lib/i18n";

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <LanguageSwitcher currentLocale={locale} />
      {children}
    </NextIntlClientProvider>
  );
}
