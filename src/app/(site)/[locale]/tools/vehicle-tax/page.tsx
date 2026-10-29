import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { ToolHero } from "@/components/tools/ToolHero";
import { ToolMore } from "@/components/tools/ToolGrid";
import { VehicleTaxCalc } from "@/components/tools/VehicleTaxCalc";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "ne" ? "सवारी कर हिसाब — मोटरसाइकल र कार" : "Vehicle tax calculator — motorcycle and car",
    description: locale === "ne" ? "प्रदेशअनुसार २०८३/८४ को सवारी कर, नवीकरण दस्तुर र ढिलाइ जरिवाना हिसाब गर्नुहोस्।" : "Work out 2083/84 vehicle tax, renewal fee and late fines by province.",
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ne = locale === "ne";
  return (
    <>
      <ToolHero
        locale={locale}
        tool="/tools/vehicle-tax"
        width="max-w-4xl"
        first={ne ? "सवारी कर" : "Vehicle tax,"}
        second={ne ? "कति तिर्ने?" : "how much?"}
        text={ne ? "प्रदेश, सीसी र ढिलाइअनुसार — ब्लुबुक नवीकरणअघि हेर्नुहोस्।" : "By province, cc and delay — check before renewing your bluebook."}
      />
      <div className="container-page max-w-4xl py-6 sm:py-10">
        <VehicleTaxCalc locale={locale} />
        <ToolMore locale={locale} current="/tools/vehicle-tax" />
      </div>
    </>
  );
}
