"use client";

import { useState } from "react";
import { Building2, ChevronRight, ExternalLink, LocateFixed, MapPin, Navigation } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { findDistrict, type District } from "@/lib/content/districts";
import { digits } from "@/lib/i18n";
import { DistrictPicker } from "./DistrictPicker";

/** Which office a service is done at. Every district has one District Administration Office. */
export type OfficeKind = "dao" | "transport";

const KIND: Record<OfficeKind, { ne: string; en: string; queries: string[]; match: RegExp }> = {
  dao: { ne: "जिल्ला प्रशासन कार्यालय", en: "District Administration Office", queries: ["Administration Office", "प्रशासन कार्यालय"], match: /administration|प्रशासन/i },
  transport: { ne: "यातायात व्यवस्था कार्यालय", en: "Transport Management Office", queries: ["Transport Management", "यातायात व्यवस्था"], match: /transport|यातायात/i },
};

interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  /** An Area Administration Office (इलाका प्रशासन): some services only. */
  area: boolean;
  km?: number;
}

type Box = [number, number, number, number]; // south, north, west, east

// OpenStreetMap's place search. Its rules ask for light use (about one request a second),
// so lookups only happen when someone asks, run one after another, and are kept for the visit.
const NOMINATIM = "https://nominatim.openstreetmap.org";
const pause = () => new Promise((r) => setTimeout(r, 1100));
async function osm<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(NOMINATIM + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("format", "jsonv2");
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<T>;
}

/** Distance in km between two points on the earth. */
function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/**
 * "Where do I go?": from the person's location (or a district they pick), names the exact office
 * for this service in their district and shows where it is, with directions. Offices come from
 * OpenStreetMap; where one isn't mapped yet, a map search for that named office is offered instead.
 */
export function OfficeFinder({ locale, kind }: { locale: Locale; kind: OfficeKind }) {
  const ne = locale === "ne";
  const k = KIND[kind];
  const [district, setDistrict] = useState<District | null>(null);
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "searching" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const search = async (d: District, box: Box | null, from: { lat: number; lon: number } | null) => {
    setStatus("searching");
    const cacheKey = `kg-office-${kind}-${d.en}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const list = (JSON.parse(cached) as Place[]).map((p) => ({ ...p, km: from ? km(from, p) : undefined }));
        setPlaces(sortPlaces(list));
        setStatus("done");
        return;
      }
    } catch {}
    try {
      let b = box;
      if (!b) {
        const hit = await osm<{ boundingbox: string[] }[]>("/search", { q: `${d.en} District, Nepal`, countrycodes: "np", limit: "1" });
        if (hit[0]) b = hit[0].boundingbox.map(Number) as Box;
        await pause();
      }
      const found = new Map<string, Place>();
      for (const q of k.queries) {
        const params: Record<string, string> = { q, countrycodes: "np", limit: "10" };
        if (b) Object.assign(params, { bounded: "1", viewbox: `${b[2]},${b[1]},${b[3]},${b[0]}` });
        else params.q = `${q} ${d.en}`;
        const hits = await osm<{ osm_type: string; osm_id: number; name: string; display_name: string; lat: string; lon: string }[]>("/search", params);
        for (const h of hits) {
          if (!k.match.test(h.name || h.display_name)) continue;
          found.set(`${h.osm_type}${h.osm_id}`, {
            id: `${h.osm_type}${h.osm_id}`,
            name: h.name || h.display_name.split(",")[0],
            address: h.display_name.split(", ").slice(1, 4).join(", "),
            lat: Number(h.lat),
            lon: Number(h.lon),
            area: /area|इलाका/i.test(h.name || ""),
          });
        }
        await pause();
      }
      const list = [...found.values()];
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(list));
      } catch {}
      setPlaces(sortPlaces(list.map((p) => ({ ...p, km: from ? km(from, p) : undefined }))));
      setStatus("done");
    } catch {
      // The map service didn't answer: still name the office and offer a map search for it.
      setPlaces([]);
      setStatus("done");
    }
  };

  /** The district's own office first, then Area Administration Offices; nearest first within each. */
  const sortPlaces = (list: Place[]) => list.sort((a, b) => Number(a.area) - Number(b.area) || (a.km ?? 0) - (b.km ?? 0)).slice(0, 4);

  const locate = () => {
    if (!("geolocation" in navigator)) return setError(ne ? "यो फोनले स्थान दिन सक्दैन। जिल्ला छान्नुहोस्।" : "This device can't share its location. Pick your district.");
    setError(null);
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const me = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setHere(me);
        try {
          const r = await osm<{ name?: string; address?: Record<string, string>; boundingbox?: string[] }>("/reverse", {
            lat: String(me.lat),
            lon: String(me.lon),
            zoom: "8",
            "accept-language": "en",
          });
          const d = findDistrict(r.address?.county ?? r.address?.state_district ?? r.name ?? "");
          if (!d) throw new Error("no district");
          setDistrict(d);
          await pause();
          await search(d, r.boundingbox ? (r.boundingbox.map(Number) as Box) : null, me);
        } catch {
          setStatus("error");
          setError(ne ? "तपाईंको जिल्ला पत्ता लागेन। तल जिल्ला छान्नुहोस्।" : "Couldn't work out your district. Pick it below.");
        }
      },
      () => {
        setStatus("error");
        setError(ne ? "स्थान पाउन सकिएन। तल जिल्ला छान्नुहोस्।" : "Couldn't get your location. Pick your district below.");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
    );
  };

  const pick = (d: District) => {
    setPicking(false);
    setError(null);
    setDistrict(d);
    void search(d, null, here);
  };

  const reset = () => {
    setDistrict(null);
    setPlaces(null);
    setStatus("idle");
  };

  const busy = status === "locating" || status === "searching";
  const n = (v: number) => digits(v < 10 ? v.toFixed(1) : String(Math.round(v)), locale);

  return (
    <div className="rounded-2xl border border-paper-line p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-tint text-sky">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold leading-snug text-ink">{ne ? "तपाईं जाने कार्यालय" : "Your office"}</p>
          <p className="text-sm text-ink-faint">{ne ? k.ne : k.en}</p>
        </div>
      </div>

      {!district && (
        <div className="mt-4 space-y-2.5">
          <button type="button" onClick={locate} disabled={busy} className="btn-secondary w-full disabled:opacity-70">
            <LocateFixed className={`h-4 w-4 text-sky ${status === "locating" ? "animate-pulse" : ""}`} aria-hidden="true" />
            {status === "locating" ? (ne ? "स्थान खोज्दै…" : "Finding you…") : ne ? "मेरो स्थान प्रयोग गर्नुहोस्" : "Use my location"}
          </button>
          <button type="button" onClick={() => setPicking(true)} className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border border-paper-line bg-white px-4 text-left transition-colors hover:border-ink-faint/40">
            <span className="text-ink-soft">{ne ? "वा जिल्ला छान्नुहोस्" : "Or pick your district"}</span>
            <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden="true" />
          </button>
          {error && <p role="alert" className="text-sm text-warn">{error}</p>}
        </div>
      )}

      {district && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-semibold text-ink">
              {ne ? `${k.ne}, ${district.ne}` : `${k.en}, ${district.en}`}
            </p>
            <button type="button" onClick={reset} className="shrink-0 text-sm font-semibold text-sky hover:underline">{ne ? "बदल्नुहोस्" : "Change"}</button>
          </div>

          {busy && (
            <ul className="mt-3 space-y-2" aria-live="polite" aria-label={ne ? "खोज्दै" : "Searching"}>
              {[0, 1].map((i) => (
                <li key={i} className="h-[72px] animate-pulse rounded-xl bg-paper-warm" />
              ))}
            </ul>
          )}

          {status === "done" && places && (
            <ul className="mt-3 space-y-2">
              {places.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl bg-paper-warm/70 p-3">
                  <Building2 className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug text-ink">{p.name}</p>
                    <p className="truncate text-sm text-ink-faint">
                      {p.km !== undefined && <span className="font-semibold text-ink-soft">{n(p.km)} {ne ? "कि.मि." : "km"} · </span>}
                      {p.address}
                    </p>
                    {p.area && (
                      <p className="mt-0.5 text-xs text-warn">{ne ? "इलाका प्रशासन: केही सेवा मात्र पाइन्छ, जानुअघि सोध्नुहोस्।" : "Area office: some services only, ask before going."}</p>
                    )}
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    <Navigation className="h-4 w-4" aria-hidden="true" />
                    {ne ? "बाटो" : "Directions"}
                  </a>
                </li>
              ))}
              {places.length === 0 && (
                <li className="flex items-center gap-3 rounded-xl bg-paper-warm/70 p-3">
                  <Building2 className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden="true" />
                  <p className="min-w-0 flex-1 text-sm text-ink-soft">{ne ? "यो कार्यालय नक्सामा अझै राखिएको छैन। नामबाट खोज्नुहोस्:" : "This office isn't on the open map yet. Search it by name:"}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${k.en} ${district.en}, Nepal`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    {ne ? "नक्सा" : "Map"} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              )}
            </ul>
          )}

          <p className="mt-3 text-xs text-ink-faint">
            {ne ? "स्थान जानकारी:" : "Locations:"}{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">© OpenStreetMap</a>
          </p>
        </div>
      )}
      {picking && <DistrictPicker locale={locale} onPick={pick} onClose={() => setPicking(false)} />}
    </div>
  );
}
