import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Archive,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  DatabaseZap,
  FileCheck2,
  FileLock2,
  FileSearch,
  FolderClock,
  HeartPulse,
  Hospital,
  KeyRound,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Phone,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Upload,
  UserCheck,
  X
} from "lucide-react";
import "./styles.css";

const navItems = [
  { label: "Home", path: "home" },
  { label: "Services", path: "services" },
  { label: "How It Works", path: "how-it-works" },
  { label: "Who We Help", path: "who-we-help" },
  { label: "Use Cases", path: "use-cases" },
  { label: "Compliance & Security", path: "security" },
  { label: "FAQ", path: "faq" },
  { label: "Request Records", path: "request-records" },
  { label: "Contact", path: "contact" },
];

const routeItems = [...navItems, { label: "Privacy Notice", path: "privacy-notice" }];

const serviceCategories = [
  {
    title: "Healthcare Data Management",
    icon: DatabaseZap,
    text: "Organize legacy exports, structured patient data, and migration-ready datasets for provider teams.",
    services: [
      { title: "EMR/EHR migration support", icon: DatabaseZap, text: "Prepare records, documents, and structured data for movement into new EMR and EHR systems." },
      { title: "Legacy system data extraction", icon: FolderClock, text: "Extract patient demographics, documents, indexes, and chart metadata from older healthcare systems." },
      { title: "Data cleaning and normalization", icon: FileCheck2, text: "Standardize names, dates, document types, and export fields before migration or archival use." },
      { title: "Database export organization", icon: Archive, text: "Structure exports from clinical systems into usable folders, reports, and review-ready datasets." },
      { title: "Structured patient data mapping", icon: ClipboardCheck, text: "Map patient records, identifiers, documents, and metadata into consistent migration references." },
    ],
  },
  {
    title: "Medical Records Digitization",
    icon: ScanLine,
    text: "Convert paper records and chart archives into searchable, organized digital record collections.",
    services: [
      { title: "Paper record scanning", icon: ScanLine, text: "Digitize paper charts with organized intake, batching, and quality review workflows." },
      { title: "OCR and searchable PDFs", icon: FileSearch, text: "Create searchable PDFs so teams can locate clinical record content more efficiently." },
      { title: "Patient chart indexing", icon: ClipboardCheck, text: "Index charts by patient, provider, date, document type, and operational category." },
      { title: "Digital archive creation", icon: FileLock2, text: "Build organized digital archives for long-term access, retention tracking, and handoff." },
      { title: "Metadata tagging", icon: FileCheck2, text: "Tag documents and datasets with practical metadata for retrieval and migration support." },
    ],
  },
  {
    title: "Practice Transition Support",
    icon: Stethoscope,
    text: "Support healthcare organizations during retirement, closure, provider changes, and system transitions.",
    services: [
      { title: "Physician retirement support", icon: Stethoscope, text: "Help retiring physicians organize active, inactive, and retained patient record obligations." },
      { title: "Practice closure record organization", icon: Building2, text: "Prepare closed-practice records for preservation, requests, legal review, and secure disposition planning." },
      { title: "Provider transition support", icon: UserCheck, text: "Support handoff planning when providers, ownership, or record responsibilities change." },
      { title: "Records handoff planning", icon: Landmark, text: "Document what exists, where it belongs, and how it should be accessed or transferred." },
      { title: "Long-term preservation workflows", icon: FolderClock, text: "Create practical retention and preservation workflows for legacy paper and digital records." },
    ],
  },
  {
    title: "Records Request Handling",
    icon: UserCheck,
    text: "Manage request intake, authorization collection, verification, and controlled record delivery.",
    services: [
      { title: "Patient record request intake", icon: UserCheck, text: "Collect request details needed for authorized medical record release workflows." },
      { title: "Authorization document collection", icon: Upload, text: "Collect authorization documents for review before any third-party release." },
      { title: "Identity and consent verification", icon: KeyRound, text: "Support verification steps before records are released through approved channels." },
      { title: "Secure delivery through approved methods", icon: FileLock2, text: "Coordinate delivery through secure digital transfer, mail, pickup, or approved courier workflows." },
      { title: "Request tracking and documentation", icon: ClipboardCheck, text: "Keep request status, supporting documents, and delivery notes organized for operational review." },
    ],
  },
  {
    title: "Secure Storage & Preservation",
    icon: ShieldCheck,
    text: "Preserve paper and digital records with retention-aware, audit-ready organization.",
    services: [
      { title: "Physical records storage coordination", icon: Archive, text: "Coordinate physical chart storage with inventory, indexing, and retrieval planning." },
      { title: "Digital records preservation", icon: FileLock2, text: "Preserve digital records, exports, and scanned archives in structured record collections." },
      { title: "Retention tracking", icon: FolderClock, text: "Track retention requirements with healthcare providers and legal advisors." },
      { title: "Secure destruction when legally permitted", icon: Trash2, text: "Coordinate documented destruction only when policy and legal review allow it." },
      { title: "Audit-ready record organization", icon: ClipboardCheck, text: "Maintain organized record inventories and metadata for review, handoff, and retrieval." },
    ],
  },
];

const services = serviceCategories.flatMap((category) => category.services);

const processSteps = [
  "Consultation and lifecycle planning",
  "Records pickup or secure data transfer",
  "Inventory, export review, and data assessment",
  "Scanning, OCR, extraction, and indexing",
  "Data cleaning, mapping, and archive organization",
  "Secure storage, preservation, and migration support",
  "Request handling, retention tracking, and destruction when allowed",
];

const audiences = [
  { title: "Clinics", icon: HeartPulse },
  { title: "Specialty practices", icon: ClipboardCheck },
  { title: "Dental clinics", icon: FileCheck2 },
  { title: "Diagnostic centers", icon: ScanLine },
  { title: "Small hospitals", icon: Hospital },
  { title: "Healthcare administrators", icon: Building2 },
  { title: "Retiring physicians", icon: Stethoscope },
  { title: "Practices changing EMR systems", icon: DatabaseZap },
  { title: "Practices with legacy healthcare data", icon: FolderClock },
];

const securityItems = [
  "Privacy-first workflows",
  "Compliance-focused processes",
  "Privacy-aware records handling",
  "Secure access controls",
  "Authorization-based release",
  "Identity and consent verification",
  "Encrypted digital transfer options",
  "Audit-ready organization",
  "Retention and privacy requirement planning",
];

const emrMigrationPoints = [
  "Legacy EMR export review",
  "Patient and document mapping",
  "Data cleaning and normalization",
  "Folder and database organization",
  "Migration handoff support",
];

const digitizationWorkflow = [
  "Pickup or secure transfer",
  "Inventory",
  "Scanning",
  "OCR",
  "Indexing",
  "Archive creation",
  "Quality review",
];

const useCases = [
  { title: "Doctor retiring", icon: Stethoscope, text: "Organize active, inactive, and retained records before a physician exits practice." },
  { title: "Clinic changing EMR", icon: DatabaseZap, text: "Prepare exports, documents, indexes, and patient mappings for transition to a new system." },
  { title: "Old paper charts need scanning", icon: ScanLine, text: "Convert paper files into indexed, searchable digital archives with review checkpoints." },
  { title: "Practice closing", icon: Building2, text: "Plan record organization, request handling, retention tracking, and approved handoff workflows." },
  { title: "Hospital has legacy data exports", icon: Archive, text: "Structure older export folders, databases, documents, and metadata into usable record sets." },
  { title: "Patient request handling backlog", icon: UserCheck, text: "Organize intake, authorization collection, verification, tracking, and approved delivery." },
];

const faqItems = [
  {
    question: "Do you handle both paper and digital records?",
    answer: "Yes. CareVault can support paper chart organization, scanning, OCR, digital archive creation, EMR export organization, and legacy healthcare data review.",
  },
  {
    question: "Can you help retiring doctors?",
    answer: "Yes. We support physician retirement workflows including record inventory, digitization planning, preservation, request handling, and handoff planning with the provider and advisors.",
  },
  {
    question: "Can you migrate records from old EMR systems?",
    answer: "We support EMR and EHR migration preparation by reviewing legacy exports, mapping patients and documents, cleaning data, and organizing folders or databases for migration handoff.",
  },
  {
    question: "Do you release records directly to patients?",
    answer: "Records release depends on provider approval, identity review, consent, authorization, and applicable requirements. Submitting a request does not guarantee release.",
  },
  {
    question: "How do you verify authorization?",
    answer: "Requests should include required requester details and authorization documents. Release workflows are reviewed for identity, consent, authorization, and provider approval before delivery.",
  },
  {
    question: "Do you store records long term?",
    answer: "CareVault supports long-term preservation workflows for paper and digital records, including organized archives, retention tracking, and secure destruction planning when legally permitted.",
  },
];

const trustItems = [
  "Restricted access",
  "Audit-ready documentation",
  "Secure transfer options",
  "Authorization required",
  "No public access to records",
  "Records handled only through approved workflows",
];

function getInitialRoute() {
  const hash = window.location.hash.replace("#/", "").replace("#", "");
  return routeItems.some((item) => item.path === hash) ? hash : "home";
}

function App() {
  const [route, setRoute] = useState(getInitialRoute);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => setRoute(getInitialRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const title = routeItems.find((item) => item.path === route)?.label || "Home";
    document.title = `${title} | CareVault`;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMenuOpen(false);
  }, [route]);

  const Page = useMemo(() => {
    return {
      home: HomePage,
      services: ServicesPage,
      "how-it-works": HowItWorksPage,
      "who-we-help": WhoWeHelpPage,
      "use-cases": UseCasesPage,
      security: SecurityPage,
      faq: FAQPage,
      "privacy-notice": PrivacyNoticePage,
      "request-records": RequestRecordsPage,
      contact: ContactPage,
    }[route] || HomePage;
  }, [route]);

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <Header route={route} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main>
        <Page />
      </main>
      <Footer />
    </div>
  );
}

function Header({ route, menuOpen, setMenuOpen }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#/home" className="flex items-center gap-3" aria-label="CareVault home">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-700 text-white">
            <ShieldCheck size={22} />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-tight">CareVault</span>
            <span className="block text-xs font-medium uppercase text-slate-500">Protecting Patient Records, Preserving Trust.</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} active={route === item.path} />
          ))}
        </nav>

        <a href="#/request-records" className="hidden rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-900 2xl:inline-flex">
          Submit Request
        </a>

        <button
          className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle navigation menu"
          type="button"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto grid max-w-7xl gap-1">
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} active={route === item.path} mobile />
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

function NavLink({ item, active, mobile = false }) {
  return (
    <a
      href={`#/${item.path}`}
      className={[
        "rounded-lg px-3 py-2 text-sm font-medium transition",
        mobile ? "block" : "",
        active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      ].join(" ")}
    >
      {item.label}
    </a>
  );
}

function HomePage() {
  return (
    <>
      <Hero />
      <ServicesOverview />
      <WhyChooseUs />
      <EMRMigrationSection />
      <DigitizationWorkflowSection />
      <UseCasesSection compact />
      <ProcessPreview />
      <TrustSection />
      <FAQSection compact />
      <ContactBand />
    </>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-74px)] overflow-hidden bg-brand-900">
      <img
        src="/hero-records-management.png"
        alt="Secure medical records storage and digitization workspace"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/76 to-brand-700/28" />
      <div className="relative mx-auto flex min-h-[calc(100vh-74px)] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl text-white">
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/12 px-3 py-2 text-sm font-medium backdrop-blur">
            <LockKeyhole size={16} />
            Protecting Patient Records, Preserving Trust.
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Healthcare Data Management & Medical Records Preservation
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50">
            CareVault helps healthcare providers organize, digitize, migrate, preserve, and manage patient records securely throughout the entire records lifecycle.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-900 shadow-soft transition hover:bg-blue-50">
              Request a Consultation <ArrowRight size={18} />
            </a>
            <a href="#/services" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/35 bg-white/12 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
              Explore Services <FileCheck2 size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesOverview() {
  return (
    <Section
      eyebrow="Services overview"
      title="Healthcare data services across the full records lifecycle"
      text="CareVault is a healthcare data management platform focused on EMR migration, medical records digitization, OCR indexing, data extraction, practice transition support, and long-term records preservation for healthcare providers."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {serviceCategories.slice(0, 3).map((category) => (
          <ServiceCategoryCard key={category.title} category={category} />
        ))}
      </div>
      <div className="mt-8">
        <a href="#/services" className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900">
          View all services <ArrowRight size={18} />
        </a>
      </div>
    </Section>
  );
}

function WhyChooseUs() {
  const items = [
    { title: "Healthcare records management", text: "Organizing paper charts, scanned files, digital archives, patient folders, indexes, and retention-ready record collections.", icon: HeartPulse },
    { title: "Medical records organization", text: "Structuring records by patient, provider, date, document type, source system, and operational workflow so teams can retrieve what they need.", icon: ClipboardCheck },
    { title: "EMR migration support", text: "Preparing legacy records, exports, documents, and metadata for handoff during EMR changes, practice transitions, and system migrations.", icon: DatabaseZap },
    { title: "Data extraction and conversion", text: "Working with healthcare exports, document sets, OCR output, and structured patient data to make legacy information usable again.", icon: FileCheck2 },
    { title: "Legacy healthcare systems", text: "Supporting providers with older EMR exports, inactive systems, retired practice data, and mixed paper-digital record environments.", icon: FolderClock },
    { title: "Secure request handling", text: "Supporting authorization-based release, identity checks, request documentation, and approved delivery methods.", icon: ShieldCheck },
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Why CareVault</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Practical experience with healthcare records, data, and legacy systems
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            CareVault's value comes from practical work across medical records organization, EMR migration support, data extraction and conversion, and long-term preservation of legacy healthcare information.
          </p>
          <p className="mt-4 text-base leading-7 text-slate-600">
            CareVault is not just a records custodian. It is built to help healthcare providers turn scattered paper files, digital exports, and old system data into organized, searchable, migration-ready records.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <FeatureRow key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessPreview() {
  return (
    <section className="bg-slate-100 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">How the process works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            A controlled path from legacy records to usable, preserved healthcare data
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            We start by understanding the records lifecycle, then organize paper files, digital exports, indexes, and request workflows around the provider's operational and retention needs.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {processSteps.slice(0, 4).map((step, index) => (
            <StepCard key={step} index={index + 1} title={step} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactBand() {
  return (
    <Section eyebrow="Start a conversation" title="Tell us what healthcare records or data you need to manage" text="Use the form below for EMR migration planning, digitization, OCR indexing, legacy data extraction, practice transition support, storage, preservation, or request handling.">
      <ContactForm compact />
    </Section>
  );
}

function ServicesPage() {
  return (
    <PageShell eyebrow="Services" title="Healthcare data management, digitization, migration, and preservation" text="CareVault supports the complete records lifecycle, including legacy system data extraction, EMR/EHR migration support, OCR indexing, digital archive creation, request handling, and long-term preservation.">
      <div className="mb-12 grid gap-8 lg:grid-cols-2">
        <EMRMigrationPanel />
        <DigitizationWorkflowPanel />
      </div>
      <div className="grid gap-8">
        {serviceCategories.map((category) => (
          <ServiceCategorySection key={category.title} category={category} />
        ))}
      </div>
      <CTAStrip />
    </PageShell>
  );
}

function HowItWorksPage() {
  return (
    <PageShell eyebrow="How it works" title="A lifecycle workflow for healthcare records and legacy data" text="Each engagement starts with scope, system context, record formats, authorization needs, and retention requirements, then moves through inventory, digitization, data extraction, mapping, preservation, migration support, and request handling.">
      <div className="grid gap-4 md:grid-cols-2">
        {processSteps.map((step, index) => (
          <StepCard key={step} index={index + 1} title={step} wide />
        ))}
      </div>
    </PageShell>
  );
}

function WhoWeHelpPage() {
  return (
    <PageShell eyebrow="Who we help" title="Support for healthcare teams with records, data, and transition needs" text="CareVault helps clinics, specialty practices, diagnostic centers, hospitals, administrators, retiring physicians, and practices changing EMR systems organize and preserve medical records and legacy healthcare data.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {audiences.map((audience) => {
          const Icon = audience.icon;
          return (
            <div key={audience.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-950">{audience.title}</h3>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}

function UseCasesPage() {
  return (
    <PageShell eyebrow="Use Cases" title="Practical support for real healthcare records problems" text="CareVault is designed for providers facing operational records issues: practice transitions, EMR changes, legacy exports, paper archives, preservation needs, and request handling backlogs.">
      <UseCasesGrid />
      <CTAStrip />
    </PageShell>
  );
}

function SecurityPage() {
  return (
    <PageShell eyebrow="Compliance & Security" title="Privacy-first workflows for healthcare records and data" text="CareVault uses careful, compliance-focused processes for confidential records, data exports, request handling, and preservation workflows. We do not claim legal certification or privacy-law certification.">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-700 text-white">
              <ShieldCheck size={24} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Security and privacy controls</h2>
              <p className="text-sm text-slate-600">Designed for healthcare records, legacy data, and authorization-based release workflows.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {securityItems.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg bg-slate-50 p-4">
                <CheckCircle2 className="mt-0.5 shrink-0 text-teal-600" size={18} />
                <span className="text-sm font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-brand-900 p-6 text-white shadow-soft">
          <KeyRound size={30} />
          <h2 className="mt-5 text-2xl font-semibold">Retention and privacy note</h2>
          <p className="mt-4 leading-7 text-blue-50">
            We work with healthcare providers and legal advisors to follow applicable record retention and privacy requirements.
          </p>
          <p className="mt-4 leading-7 text-blue-100">
            Records release workflows should be authorization-based, with identity and consent verification before records are delivered through approved methods.
          </p>
          <p className="mt-4 leading-7 text-blue-100">
            Production deployments should use HTTPS, secure access controls, encrypted transfer options, protected storage, and reviewed operating policies before real patient data is collected.
          </p>
          <a href="#/privacy-notice" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-brand-900">
            Read Privacy Notice <ArrowRight size={18} />
          </a>
        </div>
      </div>
      <TrustSection embedded />
    </PageShell>
  );
}

function RequestRecordsPage() {
  return (
    <PageShell eyebrow="Request Records" title="Submit a records request" text="Use this form to submit the information needed for authorized medical record release workflows. Patient details are stored by the request system, while email notifications avoid including patient details.">
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h2 className="text-base font-semibold">Request review notice</h2>
        <p className="mt-2 text-sm leading-6">
          Submitting this form does not guarantee release of records. Requests are reviewed for authorization, identity, consent, and provider approval before any records are delivered.
        </p>
      </div>
      <RecordsRequestForm />
    </PageShell>
  );
}

function FAQPage() {
  return (
    <PageShell eyebrow="FAQ" title="Common questions about records, migration, and request handling" text="These answers explain how CareVault supports healthcare providers with paper records, digital archives, legacy EMR data, preservation workflows, and authorized records requests.">
      <FAQSection />
      <CTAStrip />
    </PageShell>
  );
}

function PrivacyNoticePage() {
  return (
    <PageShell eyebrow="Privacy Notice" title="Privacy-first handling for healthcare records and data" text="This notice summarizes CareVault's intended handling approach for public website requests and healthcare records support. It is not a legal certification or legal advice.">
      <div className="grid gap-6 lg:grid-cols-2">
        <InfoPanel
          title="Privacy-first workflows"
          icon={ShieldCheck}
          items={[
            "Requests are handled through controlled intake workflows.",
            "Records are not intended for public access.",
            "Access should be limited to approved personnel and approved operational needs.",
          ]}
        />
        <InfoPanel
          title="Authorization-based release"
          icon={UserCheck}
          items={[
            "Record release should require valid authorization and identity review.",
            "Third-party requests should include written authorization where required.",
            "Provider approval and applicable requirements guide release decisions.",
          ]}
        />
        <InfoPanel
          title="Applicable Indian privacy and retention requirements"
          icon={Landmark}
          items={[
            "CareVault does not claim legal certification or privacy-law certification.",
            "We work with healthcare providers and legal advisors to follow applicable Indian privacy and record-retention requirements.",
            "Production workflows should be reviewed before collecting real patient data.",
          ]}
        />
        <InfoPanel
          title="Secure operating expectations"
          icon={KeyRound}
          items={[
            "Production use should include HTTPS, secure hosting, and restricted access.",
            "Uploads and submitted records should be stored in protected systems.",
            "Approved workflows should define retention, delivery, audit notes, and secure destruction when legally permitted.",
          ]}
        />
      </div>
    </PageShell>
  );
}

function ContactPage() {
  return (
    <PageShell eyebrow="Contact" title="Talk with CareVault" text="Send a consultation request for healthcare data management, EMR migration support, digitization, OCR indexing, data extraction, practice transition support, preservation, or records request handling.">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg bg-brand-900 p-6 text-white shadow-soft">
          <h2 className="text-2xl font-semibold">Contact details</h2>
          <div className="mt-6 grid gap-4 text-sm text-blue-50">
            <ContactLine icon={Mail} text="kulkarni.preethi99@gmail.com" />
            <ContactLine icon={Phone} text="8008065545" />
            <ContactLine icon={MapPin} text="India-based healthcare data and records support" />
          </div>
        </div>
        <ContactForm />
      </div>
    </PageShell>
  );
}

function EMRMigrationSection() {
  return (
    <section className="bg-slate-100 py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">EMR migration</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Prepare legacy healthcare records for system change
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            CareVault helps providers organize the messy middle of EMR migration: old exports, patient folders, document sets, metadata, scanned charts, and handoff-ready records.
          </p>
        </div>
        <EMRMigrationPanel />
      </div>
    </section>
  );
}

function EMRMigrationPanel() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-700 text-white">
          <DatabaseZap size={24} />
        </span>
        <div>
          <h3 className="text-xl font-semibold text-slate-950">EMR/EHR migration support</h3>
          <p className="text-sm text-slate-600">Practical preparation for legacy records and healthcare data exports.</p>
        </div>
      </div>
      <Checklist items={emrMigrationPoints} />
    </div>
  );
}

function DigitizationWorkflowSection() {
  return (
    <Section
      eyebrow="Digitization workflow"
      title="From paper records to searchable digital archives"
      text="A clear digitization workflow helps providers move from physical charts to usable digital records without losing operational context."
    >
      <DigitizationWorkflowPanel />
    </Section>
  );
}

function DigitizationWorkflowPanel() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-700 text-white">
          <ScanLine size={24} />
        </span>
        <div>
          <h3 className="text-xl font-semibold text-slate-950">Medical records digitization workflow</h3>
          <p className="text-sm text-slate-600">Controlled steps for paper records, OCR, indexing, and archive creation.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {digitizationWorkflow.map((step, index) => (
          <StepCard key={step} index={index + 1} title={step} />
        ))}
      </div>
    </div>
  );
}

function UseCasesSection({ compact = false }) {
  if (compact) {
    return (
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Use cases</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Built for real healthcare transition scenarios
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              CareVault supports providers when records are scattered across paper charts, digital archives, old EMR exports, and request backlogs.
            </p>
          </div>
          <UseCasesGrid limit={3} />
          <div className="mt-8">
            <a href="#/use-cases" className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900">
              View use cases <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>
    );
  }

  return <UseCasesGrid />;
}

function UseCasesGrid({ limit }) {
  const items = typeof limit === "number" ? useCases.slice(0, limit) : useCases;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <Icon size={22} />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
          </article>
        );
      })}
    </div>
  );
}

function TrustSection({ embedded = false }) {
  const content = (
    <>
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Operational trust</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Stronger trust language without fake certifications
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600">
          CareVault should earn confidence through controlled workflows, clear documentation, secure transfer options, and authorization-based handling.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {trustItems.map((item) => (
          <div key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <CheckCircle2 className="mt-0.5 shrink-0 text-teal-600" size={18} />
            <span className="text-sm font-semibold text-slate-700">{item}</span>
          </div>
        ))}
      </div>
    </>
  );

  if (embedded) {
    return <div className="mt-12">{content}</div>;
  }

  return (
    <section className="bg-slate-100 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{content}</div>
    </section>
  );
}

function FAQSection({ compact = false }) {
  const items = compact ? faqItems.slice(0, 4) : faqItems;
  const body = (
    <>
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">FAQ</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Common records and migration questions
        </h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article key={item.question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">{item.question}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
          </article>
        ))}
      </div>
      {compact && (
        <div className="mt-8">
          <a href="#/faq" className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900">
            Read all FAQs <ArrowRight size={18} />
          </a>
        </div>
      )}
    </>
  );

  if (compact) {
    return (
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{body}</div>
      </section>
    );
  }

  return body;
}

function InfoPanel({ title, icon: Icon, items }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-50 text-brand-700">
        <Icon size={24} />
      </span>
      <h2 className="mt-4 text-xl font-semibold text-slate-950">{title}</h2>
      <Checklist items={items} />
    </section>
  );
}

function Checklist({ items }) {
  return (
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
          <CheckCircle2 className="mt-0.5 shrink-0 text-teal-600" size={18} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PageShell({ eyebrow, title, text, children }) {
  return (
    <>
      <section className="bg-brand-900 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">{eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-50">{text}</p>
        </div>
      </section>
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </section>
    </>
  );
}

function Section({ eyebrow, title, text, children }) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{text}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function ServiceCard({ service }) {
  const Icon = service.icon;
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700">
        <Icon size={22} />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{service.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{service.text}</p>
    </article>
  );
}

function ServiceCategoryCard({ category }) {
  const Icon = category.icon;
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700">
        <Icon size={22} />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{category.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{category.text}</p>
      <ul className="mt-4 space-y-2 text-sm font-medium text-slate-700">
        {category.services.slice(0, 3).map((service) => (
          <li key={service.title} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 shrink-0 text-teal-600" size={16} />
            <span>{service.title}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ServiceCategorySection({ category }) {
  const Icon = category.icon;
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-700 text-white">
          <Icon size={24} />
        </span>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{category.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{category.text}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {category.services.map((service) => (
          <ServiceCard key={service.title} service={service} />
        ))}
      </div>
    </section>
  );
}

function FeatureRow({ item }) {
  const Icon = item.icon;
  return (
    <div className="flex gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-brand-700 shadow-sm">
        <Icon size={22} />
      </span>
      <div>
        <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
      </div>
    </div>
  );
}

function StepCard({ index, title, wide = false }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${wide ? "min-h-32" : "min-h-40"}`}>
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-700 text-sm font-bold text-white">
        {String(index).padStart(2, "0")}
      </span>
      <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Controlled documentation, clear ownership, and secure handling at every stage of the records lifecycle.
      </p>
    </div>
  );
}

function CTAStrip() {
  return (
    <div className="mt-12 rounded-lg bg-brand-900 p-6 text-white shadow-soft sm:flex sm:items-center sm:justify-between sm:gap-8">
      <div>
        <h2 className="text-2xl font-semibold">Need a records lifecycle or migration plan?</h2>
        <p className="mt-2 text-blue-50">Start with a consultation for digitization, EMR migration support, preservation, or request handling.</p>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:mt-0 sm:flex-row">
        <a href="#/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-brand-900">
          Request a Consultation
        </a>
        <a href="#/request-records" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-4 py-3 text-sm font-semibold text-white">
          Submit Records Request
        </a>
      </div>
    </div>
  );
}

function ContactLine({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={18} />
      <span>{text}</span>
    </div>
  );
}

function getApiBaseUrl() {
  const localHosts = new Set(["localhost", "127.0.0.1", ""]);
  return localHosts.has(window.location.hostname) && window.location.port === "5173" ? "http://127.0.0.1:5174" : "";
}

async function submitJson(path, payload) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Submission failed. Please try again.");
  }
  return data;
}

async function submitFormData(path, formData) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Submission failed. Please try again.");
  }
  return data;
}

function StatusLine({ label, active }) {
  return (
    <span className={active ? "text-teal-900" : "text-amber-800"}>
      {label}: {active ? "Yes" : "No"}
    </span>
  );
}

function FormShell({ children, success, successTitle, receipt }) {
  if (success) {
    return (
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-6 text-teal-900">
        <CheckCircle2 size={28} />
        <h2 className="mt-4 text-xl font-semibold">{successTitle}</h2>
        <p className="mt-2 text-sm leading-6">
          Your submission was received{receipt?.id ? ` under ID ${receipt.id}` : ""}. Keep this ID for future reference.
        </p>
        <div className="mt-4 grid gap-2 rounded-lg bg-white/70 p-4 text-sm font-medium sm:grid-cols-2">
          <StatusLine label="Local backup saved" active={receipt?.savedLocal} />
          <StatusLine label="Database saved" active={receipt?.savedDatabase ?? receipt?.databaseSaved} />
          <StatusLine label="Email sent" active={receipt?.emailSent} />
          <StatusLine label="Upload saved" active={receipt?.uploadSaved} />
        </div>
        {!receipt?.emailSent && (
          <p className="mt-3 text-sm leading-6 text-amber-800">
            Email was not sent. The request was still saved, and CareVault can resend notifications after SMTP is configured with a Gmail App Password.
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

function ContactForm({ compact = false }) {
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  return (
    <FormShell success={success} successTitle="Thank you. Your consultation request was submitted." receipt={receipt}>
      <form
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          setError("");
          const formData = new FormData(event.currentTarget);
          const payload = Object.fromEntries(formData.entries());
          try {
            const data = await submitJson("/api/contact", payload);
            setReceipt(data);
            setSuccess(true);
          } catch (submitError) {
            setError(submitError.message);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className={`grid gap-5 ${compact ? "md:grid-cols-2" : "sm:grid-cols-2"}`}>
          <TextField label="Name" name="name" required />
          <TextField label="Organization" name="organization" />
          <TextField label="Role" name="role" />
          <TextField label="Email" name="email" type="email" required />
          <TextField label="Phone" name="phone" type="tel" />
          <SelectField label="Service interested in" name="service" options={["Healthcare data management", "EMR/EHR migration support", "Medical records digitization", "OCR indexing", "Legacy system data extraction", "Practice transition support", "Records request handling", "Secure storage and preservation"]} />
          <div className="sm:col-span-2">
            <TextArea label="Message" name="message" rows={compact ? 4 : 6} required />
          </div>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
        <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send Message"} <ArrowRight size={18} />
        </button>
      </form>
    </FormShell>
  );
}

function RecordsRequestForm() {
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  return (
    <FormShell success={success} successTitle="Your records request was submitted." receipt={receipt}>
      <form
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          setError("");
          const formData = new FormData(event.currentTarget);
          try {
            const data = await submitFormData("/api/records-request", formData);
            setReceipt(data);
            setSuccess(true);
          } catch (submitError) {
            setError(submitError.message);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Patient name" name="patientName" required />
          <TextField label="Date of birth" name="dateOfBirth" type="date" required />
          <TextField label="Requester email" name="requesterEmail" type="email" required />
          <TextField label="Phone" name="phone" type="tel" />
          <TextField label="Provider/clinic name" name="provider" required />
          <TextField label="Type of records requested" name="recordType" required />
          <TextField label="Purpose of request" name="purpose" required />
          <div>
            <label className="block text-sm font-semibold text-slate-800" htmlFor="authorization">
              Upload authorization document
            </label>
            <div className="mt-2 flex min-h-12 items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600">
              <Upload size={18} className="text-brand-700" />
              <input id="authorization" name="authorization" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="w-full text-sm" />
            </div>
          </div>
          <SelectField label="Delivery preference" name="delivery" options={["Secure digital transfer", "Mail", "Pickup"]} required />
          <label className="flex gap-3 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700 md:col-span-2">
            <input type="checkbox" name="consent" value="yes" required className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-700" />
            <span>I confirm that I am authorized to request these records and consent to identity verification before release.</span>
          </label>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
        <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Records Request"} <ArrowRight size={18} />
        </button>
      </form>
    </FormShell>
  );
}

function TextField({ label, name, type = "text", required = false }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}

function TextArea({ label, name, rows = 5, required = false }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800" htmlFor={name}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}

function SelectField({ label, name, options, required = false }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
        className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
      >
        <option value="" disabled>Select an option</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-5 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-700 text-white">
              <ShieldCheck size={22} />
            </span>
            <span className="text-lg font-semibold">CareVault</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            Protecting Patient Records, Preserving Trust. Healthcare data management, EMR migration support, medical records digitization, OCR indexing, data extraction, practice transition support, and long-term records preservation.
          </p>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Privacy notice: use HTTPS, authenticated internal access, approved policies, and secure hosting before collecting production patient information.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Services</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>Records storage</li>
            <li>EMR migration support</li>
            <li>Scanning, OCR, and indexing</li>
            <li>Legacy data extraction</li>
            <li>Request handling</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Resources</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li><a className="hover:text-brand-700" href="#/use-cases">Use cases</a></li>
            <li><a className="hover:text-brand-700" href="#/faq">FAQ</a></li>
            <li><a className="hover:text-brand-700" href="#/privacy-notice">Privacy notice</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Contact</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>kulkarni.preethi99@gmail.com</li>
            <li>8008065545</li>
            <li>India</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

createRoot(document.getElementById("root")).render(<App />);
