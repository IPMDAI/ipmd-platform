"use client";

import { useMemo, useState } from "react";
import { Field, inputBase } from "./FormField";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const COUNTRIES = [
  "Côte d'Ivoire", "Burkina Faso", "Mali", "Guinée", "Sénégal", "Bénin",
  "Togo", "Niger", "Ghana", "Nigéria", "Cameroun", "Liberia", "France", "Autre",
];

const CI_CITIES = [
  "Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "San-Pédro", "Korhogo",
  "Man", "Gagnoa", "Divo", "Abengourou", "Anyama", "Soubré", "Agboville",
  "Dabou", "Grand-Bassam", "Bondoukou", "Séguéla", "Odienné", "Bouaflé",
  "Sinfra", "Issia", "Adzopé", "Ferkessédougou", "Katiola", "Toumodi",
  "Tiassalé", "Aboisso", "Bingerville", "Duékoué", "Guiglo", "Sassandra",
  "Tabou", "Bouna", "Touba", "Autre",
];

const ABIDJAN_COMMUNES = [
  "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", "Marcory",
  "Plateau", "Port-Bouët", "Treichville", "Yopougon", "Bingerville",
  "Anyama", "Songon", "Brofodoumé", "Autre",
];

/**
 * Champs « Né(e) le » (3 listes Jour/Mois/Année) + « À (lieu de naissance) »
 * en cascade Pays → Ville → (Abidjan → Communes), avec « Autre » pour saisie
 * libre. Émet deux champs cachés : birthDate (AAAA-MM-JJ) et birthPlace.
 */
export function BirthFields() {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [country, setCountry] = useState("Côte d'Ivoire");
  const [countryOther, setCountryOther] = useState("");
  const [city, setCity] = useState("");
  const [cityOther, setCityOther] = useState("");
  const [commune, setCommune] = useState("");
  const [communeOther, setCommuneOther] = useState("");

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const arr: number[] = [];
    for (let y = now - 10; y >= now - 80; y--) arr.push(y);
    return arr;
  }, []);

  const isCI = country === "Côte d'Ivoire";
  const isAbidjan = isCI && city === "Abidjan";

  const birthDate = day && month && year ? `${year}-${month}-${day}` : "";

  const resolvedCountry = country === "Autre" ? countryOther.trim() : country;
  const resolvedCity = isCI
    ? city === "Autre"
      ? cityOther.trim()
      : city
    : cityOther.trim();
  const resolvedCommune = isAbidjan
    ? commune === "Autre"
      ? communeOther.trim()
      : commune
    : "";

  let birthPlace = "";
  if (resolvedCommune && resolvedCity === "Abidjan") {
    birthPlace = `${resolvedCommune} (Abidjan${resolvedCountry ? ", " + resolvedCountry : ""})`;
  } else if (resolvedCity) {
    birthPlace = resolvedCountry ? `${resolvedCity} (${resolvedCountry})` : resolvedCity;
  } else if (resolvedCountry) {
    birthPlace = resolvedCountry;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {/* Né(e) le — Jour / Mois / Année */}
      <Field label="Né(e) le" htmlFor="birth-day" required>
        <div className="grid grid-cols-3 gap-2">
          <select id="birth-day" aria-label="Jour" required value={day} onChange={(e) => setDay(e.target.value)} className={inputBase}>
            <option value="">Jour</option>
            {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select aria-label="Mois" required value={month} onChange={(e) => setMonth(e.target.value)} className={inputBase}>
            <option value="">Mois</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
            ))}
          </select>
          <select aria-label="Année" required value={year} onChange={(e) => setYear(e.target.value)} className={inputBase}>
            <option value="">Année</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </Field>

      {/* À (lieu de naissance) — Pays → Ville → Commune */}
      <Field label="À (lieu de naissance)" htmlFor="birth-country" required>
        <div className="space-y-2">
          <select
            id="birth-country"
            aria-label="Pays de naissance"
            required
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setCity("");
              setCommune("");
            }}
            className={inputBase}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {country === "Autre" && (
            <input type="text" required placeholder="Précisez le pays" value={countryOther} onChange={(e) => setCountryOther(e.target.value)} className={inputBase} />
          )}

          {isCI ? (
            <select
              aria-label="Ville ou commune"
              required
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setCommune("");
              }}
              className={inputBase}
            >
              <option value="">— Ville / commune —</option>
              {CI_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input type="text" required placeholder="Ville ou commune" value={cityOther} onChange={(e) => setCityOther(e.target.value)} className={inputBase} />
          )}

          {isCI && city === "Autre" && (
            <input type="text" required placeholder="Précisez la ville / commune" value={cityOther} onChange={(e) => setCityOther(e.target.value)} className={inputBase} />
          )}

          {isAbidjan && (
            <select aria-label="Commune d'Abidjan" value={commune} onChange={(e) => setCommune(e.target.value)} className={inputBase}>
              <option value="">— Commune (Abidjan) — facultatif</option>
              {ABIDJAN_COMMUNES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {isAbidjan && commune === "Autre" && (
            <input type="text" placeholder="Précisez la commune" value={communeOther} onChange={(e) => setCommuneOther(e.target.value)} className={inputBase} />
          )}

          {birthPlace && (
            <p className="text-xs text-black/45">
              Lieu : <span className="font-medium text-ipmd-black">{birthPlace}</span>
            </p>
          )}
        </div>
      </Field>

      {/* Valeurs transmises au serveur */}
      <input type="hidden" name="birthDate" value={birthDate} />
      <input type="hidden" name="birthPlace" value={birthPlace} />
    </div>
  );
}
