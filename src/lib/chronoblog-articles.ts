export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  tags: string[];
  readMinutes: number;
  publishedAt: string;
};

export const ARTICLES: Article[] = [
  {
    slug: "client-onboarding-without-chaos",
    title: "Client Onboarding Without the Chaos",
    excerpt:
      "A practical look at the information, decisions, and handovers that make a client kickoff feel professional.",
    tags: ["Onboarding", "Client Experience", "Operations"],
    readMinutes: 5,
    publishedAt: "2026-01-12",
    body: [
      "A client onboarding process is not just a form and a welcome email. It is the first operational handover between a provider and a client, so every missing detail creates work later.",
      "A reliable kickoff gathers the context the delivery team actually needs, makes responsibilities explicit, and gives the client a clear view of what happens next. The goal is not to ask for every possible detail. It is to ask the right questions at the right stage.",
      "The strongest onboarding systems connect accepted proposals, agreements, initial payments, documents, tasks, and kickoff communication. That removes the repeated copying and checking that causes delays while keeping the client experience calm.",
      "ChronoSquares starts with this shared foundation: one place for the provider to run the operation and one clear view for the client to complete requests, see progress, and understand the next handover.",
    ],
  },
  {
    slug: "service-delivery-operating-system",
    title: "Designing a Service-Delivery Operating System",
    excerpt:
      "How agencies can connect people, projects, communication, files, and costs without adding more scattered tools.",
    tags: ["Service Delivery", "Systems", "Agencies"],
    readMinutes: 6,
    publishedAt: "2026-02-03",
    body: [
      "Service businesses rarely lack tools. They lack a connected operating model that explains where information belongs, who owns the next action, and what the client should be able to see.",
      "A delivery system should follow the relationship rather than forcing the relationship to follow a collection of disconnected apps. The project, the people involved, the decisions, the files, and the agreed costs should remain connected throughout the work.",
      "That does not mean exposing internal operations to a client. Good systems separate private provider work from shared client information while preserving the context between them.",
      "ChronoSquares brings those responsibilities into role-based Squares. The provider can manage the detailed operation, while clients, contractors, and stakeholders receive only the information and actions relevant to them.",
    ],
  },
  {
    slug: "approvals-scope-and-handover",
    title: "Approvals, Scope, and the Handover",
    excerpt:
      "Why clear ownership and visible decisions reduce friction for both service providers and clients.",
    tags: ["Approvals", "Scope", "Communication"],
    readMinutes: 7,
    publishedAt: "2026-03-08",
    body: [
      "Many delivery problems begin as small ambiguities: a client thinks an item was approved, a contractor is waiting for a decision, or a request quietly expands the original scope.",
      "A dependable handover records the decision, the person responsible, the relevant files, and the next action. This makes progress visible without requiring everyone to search through old messages.",
      "The Workflow Layer is designed to carry that information between the Squares. A completed condition can trigger a task, request an approval, notify the right party, or prevent a stage from progressing until the required work is complete.",
      "The result is not more administration for its own sake. It is a shared record that makes delivery easier to explain, easier to operate, and easier to repeat.",
    ],
  },
];

export const ARTICLES_BY_SLUG: Record<string, Article> = Object.fromEntries(
  ARTICLES.map((a) => [a.slug, a]),
);

export const ALL_TAGS = Array.from(new Set(ARTICLES.flatMap((a) => a.tags))).sort();