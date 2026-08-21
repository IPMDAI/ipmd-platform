"use client";

import { useState, type FormEvent } from "react";
import { submitInscription } from "@/lib/actions";
import { createUploadTicket } from "@/lib/upload-actions";
import { createClient } from "@/lib/supabase/client";
import { universes } from "@/data/universes";
import { ActionButton } from "@/components/ui/Button";
import { Field, inputBase } from "./FormField";
import { PhoneField } from "./PhoneField";
import { MultiFileField } from "./MultiFileField";
import { BirthFields } from "./BirthFields";
import type { FormResult } from "@/types";

const MAX_FILE = 15 * 1024 * 1024;

type UploadReason = "ok" | "vide" | "trop-lourd" | "echec";
type UploadResult = { path: string | null; reason: UploadReason };

/**
 * Uploade un fichier vers Storage (navigateur). Renvoie le chemin ET la raison
 * (pour distinguer « trop lourd » / « échec » d'un simple champ vide, et
 * pouvoir bloquer l'envoi si une pièce OBLIGATOIRE n'a pas pu partir).
 */
async function uploadDoc(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  folder: string,
  key: string,
  file: File | undefined | null
): Promise<UploadResult> {
  if (!file || file.size === 0) return { path: null, reason: "vide" };
  if (file.size > MAX_FILE) return { path: null, reason: "trop-lourd" };
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${key}.${ext}`;
  // On demande d'abord un « ticket » d'upload signé au serveur (clé service_role,
  // contourne la RLS), puis on envoie le fichier directement au stockage avec ce
  // ticket. Le fichier ne transite jamais par le serveur (pas de limite de taille).
  const token = await createUploadTicket(path);
  if (!token) return { path: null, reason: "echec" };
  const { error } = await supabase.storage
    .from("candidature-docs")
    .uploadToSignedUrl(path, token, file, { upsert: true });
  return error ? { path: null, reason: "echec" } : { path, reason: "ok" };
}

const entryLevels = ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4", "Bac+5"];

const diplomas = [
  "Baccalauréat",
  "BTS",
  "DUT",
  "Licence",
  "Bachelor",
  "Master",
  "Doctorat",
  "Autre",
];

// Demande diplômante : uniquement les univers diplômants (les bootcamps
// certifiants ont leur propre formulaire simplifié).
const diplomaUniverses = universes.filter((u) => u.kind === "diplome");

const fileInput =
  "block w-full cursor-pointer rounded-xl border border-dashed border-black/25 bg-white px-3 py-3 text-sm text-black/55 shadow-sm transition-colors hover:border-ipmd-red/50 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ipmd-red file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white";

export type OfferOption = { filiereId: string; filiereName: string; level: string };
export type OpenIntake = {
  id: string;
  label: string;
  academicYear: string;
  startDate: string | null;
  offerings: OfferOption[];
};

const offerValue = (o: OfferOption) => `${o.filiereId}::${o.level}`;

export function InscriptionForm({ openIntakes = [] }: { openIntakes?: OpenIntake[] }) {
  const [state, setState] = useState<FormResult | null>(null);
  const [pending, setPending] = useState(false);
  const [universe, setUniverse] = useState("");

  // Rentrée : aucune ouverte → dépôt impossible ; une seule → auto ; plusieurs → choix.
  const noOpenIntake = openIntakes.length === 0;
  const singleIntake = openIntakes.length === 1 ? openIntakes[0] : null;
  const [intakeId, setIntakeId] = useState(singleIntake ? singleIntake.id : "");
  const currentIntake = openIntakes.find((i) => i.id === intakeId) ?? null;
  const offerings = currentIntake?.offerings ?? [];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState(null);
    setPending(true);
    try {
      const fd = new FormData(form);

      // Formation choisie = une OFFRE de la rentrée (filière + niveau réels).
      // On dérive filiere_id + niveau + libellé lisible (program_interest).
      const offering = String(fd.get("offering") || "");
      const [fid, lvl] = offering.split("::");
      const off = offerings.find((o) => o.filiereId === fid && o.level === lvl);
      if (fid && lvl) {
        fd.set("filiereId", fid);
        fd.set("offeredLevel", lvl);
        if (off) fd.set("programInterest", off.filiereName);
      }
      fd.set("intakeId", intakeId);

      // Ne pas envoyer les fichiers via l'action (limite de taille) :
      // on les uploade d'abord vers Storage, puis on transmet leurs chemins.
      fd.delete("docDiploma");
      fd.delete("docBulletins");
      fd.delete("docId");
      fd.delete("docAttestation");

      const supabase = createClient();
      if (supabase) {
        const folder = crypto.randomUUID();
        const q = (sel: string) =>
          (form.querySelector(sel) as HTMLInputElement | null)?.files?.[0] ?? null;
        const [dip, idf, att] = await Promise.all([
          uploadDoc(supabase, folder, "diplome", q("#docDiploma")),
          uploadDoc(supabase, folder, "piece-identite", q("#docId")),
          uploadDoc(supabase, folder, "attestation", q("#docAttestation")),
        ]);

        // Le diplôme et la pièce d'identité sont OBLIGATOIRES : si l'un n'a pas
        // pu être envoyé (trop lourd, format, échec réseau), on BLOQUE l'envoi
        // avec un message clair — au lieu de laisser partir une demande vide.
        const problems: string[] = [];
        const check = (label: string, r: UploadResult) => {
          if (r.reason === "trop-lourd") problems.push(`${label} dépasse 15 Mo`);
          else if (r.reason === "vide") problems.push(`${label} est manquant`);
          else if (r.reason === "echec") problems.push(`${label} n'a pas pu être envoyé`);
        };
        check("le dernier diplôme", dip);
        check("la pièce d'identité", idf);
        if (problems.length > 0) {
          setState({
            ok: false,
            message: `Impossible d'envoyer votre demande : ${problems.join(
              ", "
            )}. Vérifiez le format (PDF, JPG ou PNG) et la taille (15 Mo max par fichier), puis réessayez.`,
          });
          setPending(false);
          return;
        }

        if (dip.path) fd.set("docDiplomaPath", dip.path);
        if (idf.path) fd.set("docIdPath", idf.path);
        if (att.path) fd.set("docAttestationPath", att.path);

        const bulletinInputs = form.querySelectorAll<HTMLInputElement>(
          'input[name="docBulletins"]'
        );
        const bulletinPaths: string[] = [];
        let i = 0;
        for (const inp of Array.from(bulletinInputs)) {
          const f = inp.files?.[0];
          if (f && f.size > 0) {
            i += 1;
            const r = await uploadDoc(supabase, folder, `bulletins-${i}`, f);
            if (r.path) bulletinPaths.push(r.path);
          }
        }
        if (bulletinPaths.length > 0) fd.set("docBulletinsPaths", bulletinPaths.join(","));
      }

      const res = await submitInscription(null, fd);
      setState(res);
      if (res.ok) form.reset();
    } catch {
      setState({
        ok: false,
        message: "Erreur lors de l'envoi des pièces. Vérifie leur taille (15 Mo max) et réessaie.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nom" htmlFor="lastName" required>
            <input id="lastName" name="lastName" type="text" required autoComplete="family-name" placeholder="Votre nom" className={inputBase} />
          </Field>
          <Field label="Prénoms" htmlFor="firstName" required>
            <input id="firstName" name="firstName" type="text" required autoComplete="given-name" placeholder="Vos prénoms" className={inputBase} />
          </Field>
        </div>

        <BirthFields />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" required>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="vous@email.com" className={inputBase} />
          </Field>
          <Field label="Profil souhaité" htmlFor="profile" required>
            <select id="profile" name="profile" required defaultValue="" className={inputBase}>
              <option value="">— Sélectionner —</option>
              <option value="etudiant">Étudiant</option>
              <option value="professionnel">Professionnel</option>
              <option value="parent">Parent</option>
              <option value="dirigeant">Dirigeant</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Téléphone" htmlFor="phone" required>
            <PhoneField id="phone" name="phone" required />
          </Field>
          <Field label="WhatsApp (facultatif)" htmlFor="whatsapp">
            <PhoneField id="whatsapp" name="whatsapp" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Univers visé" htmlFor="universe" required>
            <select
              id="universe"
              name="universe"
              required
              value={universe}
              onChange={(e) => setUniverse(e.target.value)}
              className={inputBase}
            >
              <option value="">— Sélectionner —</option>
              {diplomaUniverses.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.target}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Niveau d'entrée" htmlFor="entryLevel">
            <select id="entryLevel" name="entryLevel" defaultValue="" className={inputBase}>
              <option value="">— Sélectionner —</option>
              {entryLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Rentrée (Lot 2) — pilotée par les rentrées ouvertes au recrutement. */}
        {noOpenIntake ? (
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
            ⚠️ Les inscriptions ne sont <strong>pas ouvertes</strong> pour le moment. Revenez
            bientôt : une rentrée sera prochainement ouverte aux candidatures.
          </div>
        ) : singleIntake ? (
          <Field label="Rentrée" htmlFor="intakeInfo">
            <input type="hidden" name="intakeId" value={singleIntake.id} />
            <div
              id="intakeInfo"
              className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200"
            >
              📅 {singleIntake.label} · {singleIntake.academicYear}
              <span className="ml-auto text-[11px] font-normal text-emerald-700/80">
                Rentrée ouverte
              </span>
            </div>
          </Field>
        ) : (
          <Field label="Rentrée souhaitée" htmlFor="intakeId" required>
            <select
              id="intakeId"
              name="intakeId"
              required
              value={intakeId}
              onChange={(e) => setIntakeId(e.target.value)}
              className={inputBase}
            >
              <option value="">— Choisir une rentrée —</option>
              {openIntakes.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label} · {i.academicYear}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Formation souhaitée (filière · niveau)" htmlFor="offering" required>
            <select
              key={intakeId}
              id="offering"
              name="offering"
              required
              defaultValue=""
              disabled={noOpenIntake || !intakeId}
              className={inputBase}
            >
              <option value="" disabled>
                {noOpenIntake
                  ? "Aucune formation ouverte"
                  : !intakeId
                  ? "Choisissez d'abord une rentrée"
                  : "— Sélectionner —"}
              </option>
              {offerings.map((o) => (
                <option key={offerValue(o)} value={offerValue(o)}>
                  {o.filiereName} · {o.level}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Dernier diplôme obtenu" htmlFor="lastDiploma" required>
            <select id="lastDiploma" name="lastDiploma" required defaultValue="" className={inputBase}>
              <option value="">— Sélectionner —</option>
              {diplomas.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Dernière formation suivie (facultatif)" htmlFor="lastEducation">
          <input id="lastEducation" name="lastEducation" type="text" placeholder="Ex. Licence 2 informatique" className={inputBase} />
        </Field>

        <fieldset className="rounded-2xl border border-black/10 p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-wider text-ipmd-red">
            Pièces à joindre
          </legend>
          <p className="mb-3 text-xs text-black/50">
            Le <strong>dernier diplôme</strong> et la <strong>pièce d&apos;identité</strong> sont
            requis. Pour les bulletins ou relevés de notes, cliquez sur « + Ajouter » pour en joindre plusieurs.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dernier diplôme" htmlFor="docDiploma" required>
              <input id="docDiploma" name="docDiploma" type="file" required accept=".pdf,.jpg,.jpeg,.png" className={fileInput} />
            </Field>
            <Field label="Bulletins / relevés de notes" htmlFor="docBulletins">
              <MultiFileField
                name="docBulletins"
                accept=".pdf,.jpg,.jpeg,.png"
                className={fileInput}
                addLabel="+ Ajouter un bulletin"
              />
            </Field>
            <Field label="Pièce d'identité / passeport / titre de séjour" htmlFor="docId" required>
              <input id="docId" name="docId" type="file" required accept=".pdf,.jpg,.jpeg,.png" className={fileInput} />
            </Field>
            <Field label="Attestation de scolarité (si nécessaire)" htmlFor="docAttestation">
              <input id="docAttestation" name="docAttestation" type="file" accept=".pdf,.jpg,.jpeg,.png" className={fileInput} />
            </Field>
          </div>
          <p className="mt-2 text-xs text-black/45">Formats acceptés : PDF, JPG, PNG · 15 Mo max par fichier.</p>
        </fieldset>

        <Field label="Message (optionnel)" htmlFor="message">
          <textarea id="message" name="message" rows={4} placeholder="Parlez-nous de votre projet…" className={inputBase} />
        </Field>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ActionButton type="submit" size="lg" disabled={pending || noOpenIntake}>
            {pending
              ? "Envoi en cours…"
              : noOpenIntake
              ? "Inscriptions fermées"
              : "Envoyer ma demande d'admission"}
          </ActionButton>
          {state && !state.ok && (
            <p
              role="status"
              className={`text-sm font-medium ${
                state.code === "duplicate" ? "text-amber-600" : "text-ipmd-red"
              }`}
            >
              {state.message}
            </p>
          )}
        </div>
      </form>

      {state?.ok && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl">
            <div className="text-4xl">🎉</div>
            <h3 className="mt-3 text-xl font-extrabold text-ipmd-black">
              Demande reçue !
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-black/70">
              {state.message}
            </p>
            <a
              href="/"
              className="mt-6 inline-block rounded-full bg-ipmd-red px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Retour à l&apos;accueil
            </a>
          </div>
        </div>
      )}
    </>
  );
}
