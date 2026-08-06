import type { Metadata } from "next";

import {
  LegalBody,
  LegalEmphasis,
  LegalHeader,
  LegalList,
  LegalPageShell,
  LegalSection,
  LegalSubSection,
} from "@/components/auth/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy | Layered Planning",
  description:
    "How Layered Planning collects, uses, stores, and protects personal information under the New Zealand Privacy Act 2020.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell>
      <LegalHeader title="Layered Planning — Privacy Policy" lastUpdated="05/08/2026" />
      <LegalBody>
        <LegalSection title="1. Who we are">
          <p>
            Layered (&quot;we&quot;, &quot;us&quot;, &quot;Layered&quot;) is a class planning platform
            for Pilates instructors, operated by Layered Planning, based in Auckland, New Zealand.
          </p>
          <p>
            This policy explains how we collect, use, store, and protect personal information in
            accordance with the New Zealand Privacy Act 2020.
          </p>
          <p>
            Contact for privacy queries:{" "}
            <a
              href="mailto:admin@layeredplanning.com"
              className="font-medium text-[var(--layered-navy)] underline-offset-4 hover:underline"
            >
              admin@layeredplanning.com
            </a>
          </p>
        </LegalSection>

        <LegalSection title="2. What information we collect">
          <LegalSubSection title="2.1 Information about you (the instructor/account holder)">
            <LegalList
              items={[
                "Name",
                "Email address",
                "Account login details",
                "Billing information (processed via our payment provider — we do not store full card details)",
                "Usage data (how you use the platform, e.g. class plans created, login frequency)",
              ]}
            />
          </LegalSubSection>

          <LegalSubSection title="2.2 Information about your clients (entered by you)">
            <p>
              As part of using Layered, you may enter information about your own Pilates clients,
              including:
            </p>
            <LegalList
              items={[
                "Client names",
                "Client email addresses",
                "Session notes and client progress records",
                "Any other information you choose to record for your own teaching purposes",
              ]}
            />
            <LegalEmphasis>
              Important: You are responsible for ensuring you have your clients&apos; consent to
              store their information in Layered, and for complying with your own obligations under
              the Privacy Act 2020 as the party collecting this information directly from your
              clients. Layered acts as the platform storing this data on your behalf.
            </LegalEmphasis>
          </LegalSubSection>

          <LegalSubSection title="2.3 Content you create">
            <LegalList
              items={[
                "Class plans, exercise sequences, and programming notes you build in the app",
              ]}
            />
          </LegalSubSection>
        </LegalSection>

        <LegalSection title="3. Why we collect this information">
          <p>We collect and use personal information to:</p>
          <LegalList
            items={[
              "Provide and operate the Layered platform",
              "Enable core features (class planning, exercise library, client session tracking, video storage)",
              "Process subscription payments",
              "Communicate with you about your account, updates, or support requests",
              "Improve the platform based on usage patterns",
              "Meet legal and regulatory obligations",
            ]}
          />
          <p>
            We do not sell your personal information or your clients&apos; personal information to
            third parties.
          </p>
        </LegalSection>

        <LegalSection title="4. Who we share information with">
          <p>We may share information with:</p>
          <LegalList
            items={[
              "Service providers who help us run Layered (e.g. cloud hosting, payment processing, analytics tools). These providers only access information as needed to perform their function.",
              "Legal authorities if required by law.",
            ]}
          />
          <p>
            <span className="font-medium text-foreground">Overseas storage:</span> Layered&apos;s
            hosting infrastructure is provided by Amazon Web Services (AWS), with data stored in
            AWS&apos;s US East (N. Virginia) region, United States. This means your personal
            information, and any client information you enter, is stored on servers located in the
            United States, outside New Zealand.
          </p>
          <p>
            We have chosen a provider (AWS) that maintains strong technical and organisational
            security standards. However, we note that the United States does not have a single,
            nationwide privacy law directly equivalent to the New Zealand Privacy Act 2020. By using
            Layered, you acknowledge that your information (and any client information you enter)
            will be stored overseas on this basis.
          </p>
          <p>We currently use the following third-party service providers:</p>
          <LegalList
            items={[
              "Stripe (USA/international) — for processing subscription payments",
            ]}
          />
          <p>
            We do not currently use any analytics tools. If we introduce analytics or other service
            providers in the future, we will update this section accordingly.
          </p>
        </LegalSection>

        <LegalSection title="5. How we protect your information">
          <p>
            We take reasonable steps to protect personal information from loss, misuse, and
            unauthorised access, including:
          </p>
          <LegalList
            items={[
              "Secure, authenticated access to accounts",
              "Encrypted data storage where applicable",
              "Limited internal access to personal data",
            ]}
          />
          <p>
            No system is 100% secure, and we cannot guarantee absolute security, but we are
            committed to acting quickly to address any issues.
          </p>
        </LegalSection>

        <LegalSection title="6. Data breaches">
          <p>
            If a privacy breach occurs that is likely to cause serious harm, we will notify the
            Office of the Privacy Commissioner and affected individuals in accordance with the
            Privacy Act 2020&apos;s notification requirements.
          </p>
        </LegalSection>

        <LegalSection title="7. How long we keep information">
          <p>
            We retain personal information for as long as your account is active, or as needed to
            provide the service. If you close your account, we will delete or anonymise your
            personal information within 30 days, except when we&apos;re required to retain it for
            legal or accounting purposes.
          </p>
        </LegalSection>

        <LegalSection title="8. Your rights">
          <p>Under the Privacy Act 2020, you have the right to:</p>
          <LegalList
            items={[
              "Access the personal information we hold about you",
              "Request correction of inaccurate information",
              "Ask questions about how your information is used",
            ]}
          />
          <p>
            To exercise these rights, contact us at{" "}
            <a
              href="mailto:admin@layeredplanning.com"
              className="font-medium text-[var(--layered-navy)] underline-offset-4 hover:underline"
            >
              admin@layeredplanning.com
            </a>
            . We will respond within a reasonable timeframe.
          </p>
          <p>
            <span className="font-medium text-foreground">Note on client data:</span> If your
            clients wish to access or correct information you&apos;ve entered about them in Layered,
            they should contact you directly, as you are the party who collected that information
            from them. We will assist you in fulfilling such requests where needed.
          </p>
        </LegalSection>

        <LegalSection title="9. Copyright and Intellectual Property Rights">
          <p>
            All content, features, and functionality on Layered — including but not limited to the
            platform&apos;s software, design, layout, exercise library, class plan templates, and
            branding — are owned by Layered Planning and are protected by New Zealand and
            international copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            You retain ownership of the original content you create using Layered (e.g. your own
            class plans, programming notes, and session records). By uploading or creating content
            on Layered, you grant us a limited, non-exclusive licence to store, host, and display
            that content solely for the purpose of operating the platform and providing the service
            to you.
          </p>
          <p>
            You may not copy, reproduce, distribute, modify, or create derivative works from
            Layered&apos;s platform, exercise library, or any proprietary content without our prior
            written permission. Unauthorised use may result in suspension of your account and/or
            legal action.
          </p>
        </LegalSection>

        <LegalSection title="10. Marketing Materials">
          <p>
            By subscribing to the Website, you consent to us (and our related entities) sending you
            direct commercial messages, by email or any other media, that are relevant to the goods
            or services you have purchased, or which you may be interested in purchasing.
          </p>
          <p>
            Every marketing email you receive from us will include the option to unsubscribe. Should
            you wish to unsubscribe, you can select this option in the footer of the marketing
            email. Alternatively, you can reach out to our Customer Care team at{" "}
            <a
              href="mailto:alexammckay@gmail.com"
              className="font-medium text-[var(--layered-navy)] underline-offset-4 hover:underline"
            >
              alexammckay@gmail.com
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="11. Cookies and analytics">
          <p>
            Layered uses essential cookies to keep you logged in and to enable core platform
            functionality. We do not currently use any analytics tools. If we introduce analytics or
            similar tracking technologies in the future, we will update this section accordingly.
            You can control cookies through your browser settings.
          </p>
        </LegalSection>

        <LegalSection title="12. Children's information">
          <p>
            Layered is intended for use by adult Pilates instructors. We do not knowingly collect
            personal information directly from children. Client records entered by instructors may
            occasionally relate to minors (e.g. a young client); instructors are responsible for
            ensuring appropriate consent is obtained from a parent or guardian in such cases.
          </p>
        </LegalSection>

        <LegalSection title="13. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes via email or in-app notice.
          </p>
        </LegalSection>

        <LegalSection title="14. Contact us">
          <p>
            If you have any questions or concerns about this Privacy Policy or how your information
            is handled, contact:
          </p>
          <p>
            Layered Planning{" "}
            <a
              href="mailto:admin@layeredplanning.com"
              className="font-medium text-[var(--layered-navy)] underline-offset-4 hover:underline"
            >
              admin@layeredplanning.com
            </a>
          </p>
          <p>
            You may also contact the Office of the Privacy Commissioner (
            <a
              href="https://privacy.org.nz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--layered-navy)] underline-offset-4 hover:underline"
            >
              privacy.org.nz
            </a>
            ) if you have unresolved concerns.
          </p>
        </LegalSection>
      </LegalBody>
    </LegalPageShell>
  );
}
