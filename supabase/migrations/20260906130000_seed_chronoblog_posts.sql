-- Seed the ChronoBlog posts that were previously hard-coded in
-- src/lib/chronoblog-articles.ts. The public /chronoblog surface now reads
-- from blog_posts, so these move into the database as the source of truth.
-- Idempotent: ON CONFLICT (slug) DO NOTHING so re-runs are harmless.

INSERT INTO public.blog_posts (slug, title, excerpt, body, tags, read_minutes, published, published_at)
VALUES
  (
    'client-onboarding-without-chaos',
    'Client Onboarding Without the Chaos',
    'A practical look at the information, decisions, and handovers that make a client kickoff feel professional.',
    E'A client onboarding process is not just a form and a welcome email. It is the first operational handover between a provider and a client, so every missing detail creates work later.\n\nA reliable kickoff gathers the context the delivery team actually needs, makes responsibilities explicit, and gives the client a clear view of what happens next. The goal is not to ask for every possible detail. It is to ask the right questions at the right stage.\n\nThe strongest onboarding systems connect accepted proposals, agreements, initial payments, documents, tasks, and kickoff communication. That removes the repeated copying and checking that causes delays while keeping the client experience calm.\n\nChronoSquares starts with this shared foundation: one place for the provider to run the operation and one clear view for the client to complete requests, see progress, and understand the next handover.',
    ARRAY['Onboarding', 'Client Experience', 'Operations'],
    5,
    true,
    '2026-01-12T00:00:00Z'
  ),
  (
    'service-delivery-operating-system',
    'Designing a Service-Delivery Operating System',
    'How agencies can connect people, projects, communication, files, and costs without adding more scattered tools.',
    E'Service businesses rarely lack tools. They lack a connected operating model that explains where information belongs, who owns the next action, and what the client should be able to see.\n\nA delivery system should follow the relationship rather than forcing the relationship to follow a collection of disconnected apps. The project, the people involved, the decisions, the files, and the agreed costs should remain connected throughout the work.\n\nThat does not mean exposing internal operations to a client. Good systems separate private provider work from shared client information while preserving the context between them.\n\nChronoSquares brings those responsibilities into role-based Squares. The provider can manage the detailed operation, while clients, contractors, and stakeholders receive only the information and actions relevant to them.',
    ARRAY['Service Delivery', 'Systems', 'Agencies'],
    6,
    true,
    '2026-02-03T00:00:00Z'
  ),
  (
    'approvals-scope-and-handover',
    'Approvals, Scope, and the Handover',
    'Why clear ownership and visible decisions reduce friction for both service providers and clients.',
    E'Many delivery problems begin as small ambiguities: a client thinks an item was approved, a contractor is waiting for a decision, or a request quietly expands the original scope.\n\nA dependable handover records the decision, the person responsible, the relevant files, and the next action. This makes progress visible without requiring everyone to search through old messages.\n\nThe Workflow Layer is designed to carry that information between the Squares. A completed condition can trigger a task, request an approval, notify the right party, or prevent a stage from progressing until the required work is complete.\n\nThe result is not more administration for its own sake. It is a shared record that makes delivery easier to explain, easier to operate, and easier to repeat.',
    ARRAY['Approvals', 'Scope', 'Communication'],
    7,
    true,
    '2026-03-08T00:00:00Z'
  )
ON CONFLICT (slug) DO NOTHING;
