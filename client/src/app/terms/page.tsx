import type { Metadata } from "next";

import {
  LegalBody,
  LegalHeader,
  LegalList,
  LegalNote,
  LegalPageShell,
  LegalSection,
} from "@/components/auth/legal-document";

export const metadata: Metadata = {
  title: "Terms & Conditions | Layered Planning",
  description:
    "Terms and Conditions for using Layered Planning, the class planning platform for Pilates instructors.",
};

export default function TermsAndConditionsPage() {
  return (
    <LegalPageShell>
      <LegalHeader title="Layered Planning — Terms and Conditions" lastUpdated="05/08/26" />
      <LegalNote>
        This is a draft template, not legal advice. Have it reviewed by a New Zealand lawyer before
        publishing.
      </LegalNote>
      <LegalBody className="mt-6">
        <LegalSection title="1. Acceptance of these Terms">
          <p>
            By creating an account, accessing, or using Layered (the &quot;Website&quot;,
            &quot;Platform&quot;, &quot;Service&quot;), you agree to be bound by these Terms and
            Conditions (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the
            Service.
          </p>
          <p>
            These Terms apply to all users of Layered, including Pilates instructors who create
            accounts to plan and manage classes (&quot;you&quot;, &quot;your&quot;).
          </p>
        </LegalSection>

        <LegalSection title="2. Description of the Service">
          <p>
            Layered is a class planning platform for Pilates instructors, operated by Layered
            Planning, Auckland, New Zealand. The Service allows you to:
          </p>
          <LegalList
            items={[
              "Build and organise class plans and exercise sequences",
              "Access an exercise library",
              "Record client session notes and progress",
              "Upload and store video content",
              "Manage your subscription and billing",
            ]}
          />
          <p>We may add, change, or remove features from time to time.</p>
        </LegalSection>

        <LegalSection title="3. Eligibility and Account Registration">
          <LegalList
            items={[
              "You must be at least 18 years old to create a Layered account.",
              "You are responsible for maintaining the confidentiality of your login details and for all activity that occurs under your account.",
              "You must provide accurate and current information when registering, and keep it up to date.",
              <>
                You must notify us immediately at{" "}
                <a
                  href="mailto:admin@layeredplanning.com"
                  className="font-medium text-[var(--layered-navy)] underline-offset-4 hover:underline"
                >
                  admin@layeredplanning.com
                </a>{" "}
                if you suspect unauthorised use of your account.
              </>,
            ]}
          />
        </LegalSection>

        <LegalSection title="4. Subscriptions and Payment">
          <LegalList
            items={[
              "Access to Layered requires a paid subscription. Current pricing and plans are set out on the Website.",
              "Payments are processed securely via Stripe. We do not store your full payment card details.",
              "Subscriptions renew automatically at the end of each billing period unless cancelled in accordance with this section.",
              "You may cancel your subscription at any time; cancellation will take effect at the end of your current billing period, and you will retain access until then.",
              "Except where required by law, fees already paid are non-refundable.",
              "We may change our pricing from time to time. We will give you reasonable notice before any price change takes effect for your account.",
            ]}
          />
        </LegalSection>

        <LegalSection title="5. Your Content and Client Data">
          <LegalList
            items={[
              'You retain ownership of the content you create using Layered, including class plans, notes, and client session records ("Your Content").',
              "By using the Service, you grant us a limited, non-exclusive licence to store, host, and display Your Content solely for the purpose of operating the Platform and providing the Service to you.",
              "You are solely responsible for any client information you enter into Layered, including ensuring you have the appropriate consent from your clients to record and store their information, and for complying with your own obligations under the Privacy Act 2020 as the party who collected that information directly from your clients.",
              "You must not upload content that is unlawful, infringes another person's rights (including privacy or intellectual property rights), or that you do not have the right to share.",
            ]}
          />
        </LegalSection>

        <LegalSection title="6. Acceptable Use">
          <p>You agree not to:</p>
          <LegalList
            items={[
              "Use the Service for any unlawful purpose or in a way that breaches any applicable law or regulation",
              "Attempt to gain unauthorised access to any part of the Service, other accounts, or our systems",
              "Reverse engineer, decompile, or attempt to extract the source code of the Platform",
              "Use automated means (bots, scrapers, etc.) to access or interact with the Service without our permission",
              "Resell, sublicense, or provide access to the Service to any third party without our written consent",
              "Upload viruses, malware, or other harmful code",
            ]}
          />
          <p>We reserve the right to suspend or terminate accounts that breach this section.</p>
        </LegalSection>

        <LegalSection title="7. Copyright and Intellectual Property Rights">
          <p>
            All content, features, and functionality on Layered — including but not limited to the
            platform&apos;s software, design, layout, exercise library, class plan templates, and
            branding — are owned by Layered Planning and are protected by New Zealand and
            international copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            You retain ownership of the original content you create using Layered (e.g. your own
            class plans, programming notes, and session records), as set out in section 5 above.
          </p>
          <p>
            You may not copy, reproduce, distribute, modify, or create derivative works from
            Layered&apos;s platform, exercise library, or any proprietary content without our prior
            written permission. Unauthorised use may result in suspension of your account and/or
            legal action.
          </p>
        </LegalSection>

        <LegalSection title="8. Marketing Materials">
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

        <LegalSection title="9. Suspension and Termination">
          <LegalList
            items={[
              "You may close your account at any time.",
              "We may suspend or terminate your access to the Service if you breach these Terms, engage in fraudulent or unlawful activity, or if required to do so by law.",
              "On termination, your right to use the Service ends immediately. We will handle any personal information retained in accordance with our Privacy Policy.",
            ]}
          />
        </LegalSection>

        <LegalSection title="10. Disclaimers">
          <LegalList
            items={[
              'Layered is provided "as is" and "as available". We do not guarantee that the Service will be uninterrupted, error-free, or completely secure.',
              "The exercise library and any content provided by Layered is for informational and planning purposes only. We do not provide medical, health, or fitness advice, and you remain solely responsible for the safety and appropriateness of any exercise programming you deliver to your clients.",
              "We are not responsible for any injury, loss, or damage arising from the use of class plans or exercises created or accessed via the Platform.",
            ]}
          />
        </LegalSection>

        <LegalSection title="11. Limitation of Liability">
          <p>To the maximum extent permitted by law:</p>
          <LegalList
            items={[
              "Layered Planning will not be liable for any indirect, incidental, special, or consequential loss or damage arising out of or in connection with your use of the Service.",
              "Our total liability to you for any claim arising from these Terms or your use of the Service is limited to the amount you paid us in the 12 months prior to the claim arising.",
              "Nothing in these Terms limits any rights you may have under the Consumer Guarantees Act 1993 or Fair Trading Act 1986 that cannot lawfully be excluded.",
            ]}
          />
        </LegalSection>

        <LegalSection title="12. Indemnity">
          <p>
            You agree to indemnify and hold Layered Planning harmless from any claims, losses, or
            damages (including reasonable legal costs) arising from your breach of these Terms, your
            misuse of the Service, or your violation of any third party&apos;s rights (including your
            clients&apos; privacy rights).
          </p>
        </LegalSection>

        <LegalSection title="13. Changes to these Terms">
          <p>
            We may update these Terms from time to time. We will notify you of significant changes
            via email or in-app notice. Continued use of the Service after changes take effect
            constitutes acceptance of the updated Terms.
          </p>
        </LegalSection>

        <LegalSection title="14. Governing Law">
          <p>
            These Terms are governed by the laws of New Zealand. Any disputes arising from these
            Terms or your use of the Service will be subject to the exclusive jurisdiction of the
            courts of New Zealand.
          </p>
        </LegalSection>

        <LegalSection title="15. Contact Us">
          <p>If you have any questions about these Terms, contact:</p>
          <p>
            Layered Planning{" "}
            <a
              href="mailto:admin@layeredplanning.com"
              className="font-medium text-[var(--layered-navy)] underline-offset-4 hover:underline"
            >
              admin@layeredplanning.com
            </a>
          </p>
        </LegalSection>
      </LegalBody>
    </LegalPageShell>
  );
}
