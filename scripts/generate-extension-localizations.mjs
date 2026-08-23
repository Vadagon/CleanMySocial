import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(websiteRoot, "..");
const output = path.join(websiteRoot, "lib", "generated", "extension-localizations.json");

const locales = ["de", "ja", "fr", "ko", "nl", "it", "es", "pl", "zh_TW", "zh_CN", "sv", "da", "no", "fi", "he", "cs", "pt_PT", "pt_BR", "es_419", "ar", "ro", "hu"];
const sources = [
  { slug: "facebook-instagram-cleaner", folder: "FB+IG_messages_cleaner/_locales", keys: ["extName", "extShortName", "extDescription"] },
  { slug: "facebook-messenger-cleaner", folder: "facebook-messenger-cleaner/_locales", keys: ["extensionName", "extensionShortName", "extensionDescription"] },
  { slug: "mass-unfriender", folder: "mass-friends-remover-facebook/_locales", keys: ["extName", "extShortName", "extDescription"] },
  { slug: "instagram-dm-cleaner", folder: "instagram_DM-cleaner/_locales", keys: ["extName", "extShortName", "extDescription"] },
  { slug: "instagram-followers-tracker", folder: "ig-followers-tracker/_locales", keys: ["appName", null, null] },
  { slug: "reddit-cleaner", folder: "reddit-cleaner/_locales", keys: ["extensionName", "extensionShortName", "extensionDescription"] },
  { slug: "cleanerx", folder: "cleanerX/_locales", keys: ["extName", null, null] },
  { slug: "facebook-activity-cleaner", folder: "fb-activity-cleaner/_locales", keys: ["extName", null, null] },
  { slug: "cleanfeed", folder: "cleanFeed/static/_locales", keys: ["extName", "extShortName", "extDescription"] },
];

const result = {};
for (const locale of locales) {
  const translated = {};
  for (const source of sources) {
    const filename = path.join(workspaceRoot, source.folder, locale, "messages.json");
    if (!fs.existsSync(filename)) continue;
    const messages = JSON.parse(fs.readFileSync(filename, "utf8"));
    const [nameKey, shortNameKey, descriptionKey] = source.keys;
    const record = {};
    if (nameKey && messages[nameKey]?.message) record.name = messages[nameKey].message;
    if (shortNameKey && messages[shortNameKey]?.message) record.shortName = messages[shortNameKey].message;
    if (descriptionKey && messages[descriptionKey]?.message) {
      record.description = messages[descriptionKey].message;
      record.tagline = messages[descriptionKey].message;
    }
    if (Object.keys(record).length) translated[source.slug] = record;
  }
  result[locale] = translated;
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Wrote ${output}`);
