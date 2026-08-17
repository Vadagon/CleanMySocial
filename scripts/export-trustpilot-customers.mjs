import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const API_KEY = process.env.CREEM_API_KEY || "";
const API_URL = (process.env.CREEM_API_URL || "https://api.creem.io/v1").replace(/\/$/, "");
const OUTPUT = resolve(
  process.cwd(),
  process.argv[2] || "exports/trustpilot-paid-customers.csv",
);

if (!API_KEY) {
  throw new Error("CREEM_API_KEY is required");
}

async function getPage(path, pageNumber) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(
    `${API_URL}${path}${separator}page_number=${pageNumber}&page_size=100`,
    { headers: { "x-api-key": API_KEY } },
  );
  if (!response.ok) {
    throw new Error(`Creem API request failed (${response.status}) for ${path}`);
  }
  return response.json();
}

async function getAll(path) {
  const records = [];
  let page = 1;
  for (;;) {
    const payload = await getPage(path, page);
    records.push(...(Array.isArray(payload.items) ? payload.items : []));
    const pagination = payload.pagination || {};
    const next = Number(pagination.next_page);
    if (!Number.isFinite(next) || next <= page) break;
    page = next;
  }
  return records;
}

function customerId(value) {
  if (typeof value === "string") return value;
  return value && typeof value.id === "string" ? value.id : "";
}

function timestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }
  const parsed = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function csv(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

const [transactions, customers] = await Promise.all([
  getAll("/transactions/search"),
  getAll("/customers/list"),
]);

const customersById = new Map(
  customers
    .filter((customer) => typeof customer?.id === "string")
    .map((customer) => [customer.id, customer]),
);

// A positive amount_paid is the durable signal that money changed hands.
// Refunds remain eligible: they are still genuine customer experiences and
// excluding them would selectively bias review invitations.
const paidTransactions = transactions.filter((transaction) => {
  const amountPaid = Number(transaction?.amount_paid);
  return Number.isFinite(amountPaid) && amountPaid > 0 && transaction?.mode !== "test";
});

// One invitation per customer. For repeat buyers, use their latest paid
// transaction as the unique Trustpilot reference number.
const inviteByEmail = new Map();
for (const transaction of paidTransactions) {
  const expanded =
    transaction?.customer && typeof transaction.customer === "object"
      ? transaction.customer
      : null;
  const customer = expanded || customersById.get(customerId(transaction?.customer));
  const email = String(customer?.email || transaction?.customer_email || "")
    .trim()
    .toLowerCase();
  const reference = String(transaction?.id || transaction?.order || "").trim();
  if (!email || !reference) continue;

  const record = {
    email,
    name: String(customer?.name || "Customer").trim() || "Customer",
    reference,
    paidAt: timestamp(transaction?.created_at),
  };
  const previous = inviteByEmail.get(email);
  if (!previous || record.paidAt >= previous.paidAt) inviteByEmail.set(email, record);
}

const invites = [...inviteByEmail.values()].sort((a, b) => b.paidAt - a.paidAt);
const lines = [
  ["customer email", "customer name", "reference number"].map(csv).join(","),
  ...invites.map((record) =>
    [record.email, record.name, record.reference].map(csv).join(","),
  ),
];

await mkdir(resolve(OUTPUT, ".."), { recursive: true });
await writeFile(OUTPUT, `${lines.join("\n")}\n`, { encoding: "utf8", mode: 0o600 });

const genericNames = invites.filter((record) => record.name === "Customer").length;
console.log(
  JSON.stringify({
    output: OUTPUT,
    transactionsFetched: transactions.length,
    paidTransactions: paidTransactions.length,
    uniqueCustomers: invites.length,
    genericNames,
  }),
);
