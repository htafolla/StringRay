import type { GovernanceProposalInput } from "../../mcps/governance.server.js";

export const regulatoryProposals: GovernanceProposalInput[] = [
  {
    id: "reg-aml-kyc-001",
    type: "compliance",
    title: "Implement AML/KYC transaction monitoring for high-value transfers",
    description:
      "Add automated AML/KYC screening for transactions exceeding $10,000. " +
      "Must integrate with sanctioned entity lists (OFAC, EU, UN) and flag " +
      "suspicious patterns: rapid consecutive transfers, structuring behavior, " +
      "and geographically anomalous routing. Escalation to compliance officer " +
      "within 4 hours of detection.",
    evidence: [
      "FinCEN reporting thresholds: $10,000",
      "OFAC SDN list updates feed via API",
      "EU AML Directive 2025/1234 Article 17 requirements",
      "Pattern: 5+ rapid transfers between unrelated accounts",
    ],
    source: "compliance-review",
    confidence: 0.92,
  },
  {
    id: "reg-psd2-001",
    type: "compliance",
    title: "PSD2 Strong Customer Authentication (SCA) for payment initiation",
    description:
      "Implement PSD2-mandated Strong Customer Authentication for all " +
      "payment initiation and account access requests. Requires multi-factor " +
      "authentication with at least two independent factors: knowledge " +
      "(PIN/password), possession (phone/token), inherence (biometrics). " +
      "Dynamic linking with transaction-specific codes required.",
    evidence: [
      "PSD2 (EU) 2015/2366 Article 97 - SCA requirements",
      "RTS (EU) 2018/389 - Regulatory Technical Standards",
      "SCA exemption thresholds: <30 EUR contactless, recurring transactions",
      "EBA Guidelines on authentication and communication",
    ],
    source: "compliance-review",
    confidence: 0.95,
  },
  {
    id: "reg-gdpr-001",
    type: "compliance",
    title: "GDPR Article 17 Right to Erasure data purging pipeline",
    description:
      "Build automated data erasure pipeline for GDPR Article 17 Right to Erasure " +
      "requests. Must purge personal data across all databases, caches, backups, " +
      "and analytics pipelines within the 30-day statutory window. " +
      "Include audit trail for supervisory authority inspection. " +
      "Support verification callback for data subject confirmation.",
    evidence: [
      "GDPR Article 17 - Right to erasure ('right to be forgotten')",
      "30-day processing window per Article 12(3)",
      "Data categories: identity, financial, behavioral, communications",
      "Cross-system purge: PostgreSQL, Redis, S3, BigQuery, logs",
    ],
    source: "compliance-review",
    confidence: 0.93,
  },
  {
    id: "reg-aml-kyc-002",
    type: "compliance",
    title: "Beneficial ownership registry disclosure for corporate accounts",
    description:
      "Implement beneficial ownership disclosure workflow per AML Directive 2025. " +
      "Collect and verify Ultimate Beneficial Owner (UBO) information for all " +
      "corporate account openings: >25% ownership threshold identification, " +
      "PEP (Politically Exposed Person) screening, and ongoing monitoring " +
      "of ownership structure changes. Integration with national beneficial " +
      "ownership registers.",
    evidence: [
      "AML Directive 2025 Article 30 - Beneficial ownership transparency",
      "FATF Recommendation 24 - Transparency and BO of legal persons",
      "EU Beneficial Ownership Register interconnection system (BORIS)",
      "PEP list from World Bank/OECD consolidated database",
    ],
    source: "compliance-review",
    confidence: 0.88,
  },
  {
    id: "reg-gdpr-002",
    type: "compliance",
    title: "GDPR Article 35 Data Protection Impact Assessment (DPIA) automation",
    description:
      "Automate Data Protection Impact Assessment (DPIA) process per GDPR " +
      "Article 35 for any engineering changes that process personal data at " +
      "scale. Trigger DPIA when: new data categories introduced, processing " +
      "technology changes, sensitive data (Article 9) involved, or systematic " +
      "profiling implemented. Template-based assessment with risk scoring " +
      "and DPO review workflow.",
    evidence: [
      "GDPR Article 35 - Data Protection Impact Assessment",
      "Article 29 WP guidelines on DPIA (WP 248 rev.01)",
      "Processing 'likely to result in high risk' criteria",
      "DPO mandatory consultation Article 36 for high residual risk",
    ],
    source: "compliance-review",
    confidence: 0.90,
  },
  {
    id: "reg-psd2-002",
    type: "compliance",
    title: "Open Banking API access management per PSD2 Article 66",
    description:
      "Implement PSD2 Article 66 Account Information Service Provider (AISP) " +
      "and Payment Initiation Service Provider (PISP) access management. " +
      "Provide dedicated interface (API) for third-party providers with: " +
      "strong authentication, transaction history access (Article 67), " +
      "payment initiation (Article 66), and account information (Article 67). " +
      "Dashboard for TPP registration and consent management.",
    evidence: [
      "PSD2 Article 66 - Access to payment accounts for payment initiation",
      "PSD2 Article 67 - Access to payment accounts for account information",
      "EBA RTS on strong customer authentication and secure communication",
      "Berlin Group NextGenPSD2 implementation standards",
    ],
    source: "compliance-review",
    confidence: 0.91,
  },
];
