import { MarketingShell } from "@/components/layout/MarketingShell"

const toc = [
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use", label: "How We Use Your Information" },
  { id: "sharing", label: "Sharing Your Information" },
  { id: "retention", label: "Data Retention" },
  { id: "your-rights", label: "Your Rights" },
  { id: "cookies", label: "Cookies & Tracking" },
  { id: "childrens-privacy", label: "Children's Privacy" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact Us" },
]

export const PrivacyPage = () => {
  return (
    <MarketingShell>
      {/* HEADER */}
      <section className="px-margin-mobile md:px-margin-desktop pt-20 pb-10 border-b border-outline-variant/10">
        <div className="max-w-5xl mx-auto">
          <span className="inline-block font-label-md text-label-md uppercase tracking-widest text-primary mb-4">
            Legal
          </span>
          <h1 className="font-display-lg text-display-lg text-on-background mb-4">
            Privacy Policy
          </h1>
          <p className="text-on-surface-variant">
            Effective date: <strong>May 20, 2026</strong> · Last updated: May 20, 2026
          </p>
        </div>
      </section>

      {/* BODY */}
      <section className="px-margin-mobile md:px-margin-desktop py-16">
        <div className="max-w-5xl mx-auto flex gap-16 items-start">
          {/* Sticky TOC — desktop only */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <nav className="sticky top-28">
              <p className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant mb-5">
                Contents
              </p>
              <ul className="space-y-3">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Prose */}
          <article className="flex-1 space-y-12 text-on-surface-variant leading-relaxed">
            <p>
              CamShare, Inc. ("CamShare," "we," "our," or "us") operates the CamShare platform —
              a service that lets event hosts create shared photo and video albums accessible via QR
              code. This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our website and mobile application (collectively, the
              "Service"). Please read it carefully. By using the Service, you agree to the
              practices described in this policy.
            </p>

            {/* 1 */}
            <section id="information-we-collect">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                1. Information We Collect
              </h2>
              <h3 className="font-semibold text-on-surface mb-2">Account Data</h3>
              <p className="mb-4">
                When you register, we collect your full name, email address, and a securely hashed
                version of your password. We never store your password in plain text.
              </p>
              <h3 className="font-semibold text-on-surface mb-2">Event Data</h3>
              <p className="mb-4">
                As an event host, we collect the event name, date, description, and configuration
                settings you provide (such as upload caps and privacy preferences).
              </p>
              <h3 className="font-semibold text-on-surface mb-2">User Content</h3>
              <p className="mb-4">
                Photos, videos, and thumbnails uploaded to any event album are stored on our
                servers. Guest uploads made via QR code are associated with the event but may not
                be tied to a named user account.
              </p>
              <h3 className="font-semibold text-on-surface mb-2">Technical &amp; Usage Data</h3>
              <p>
                We automatically collect IP addresses, browser type and version, operating system,
                device identifiers, pages visited, features used, and timestamps of interactions.
                This data helps us operate, secure, and improve the Service.
              </p>
            </section>

            {/* 2 */}
            <section id="how-we-use">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                2. How We Use Your Information
              </h2>
              <p className="mb-4">We process your data for the following purposes and legal bases:</p>
              <ul className="list-disc list-inside space-y-3 ml-2">
                <li>
                  <strong className="text-on-surface">Service delivery</strong> — to create and manage your account, process event
                  uploads, and deliver the features you request (legal basis: contract performance).
                </li>
                <li>
                  <strong className="text-on-surface">Security &amp; fraud prevention</strong> — to detect and prevent abuse,
                  unauthorised access, and illegal activity (legal basis: legitimate interests).
                </li>
                <li>
                  <strong className="text-on-surface">Service improvement</strong> — to analyse aggregate usage patterns, fix bugs,
                  and develop new features (legal basis: legitimate interests).
                </li>
                <li>
                  <strong className="text-on-surface">Communications</strong> — to send transactional emails (account confirmation,
                  password reset, event notifications) and, with your consent, occasional product
                  updates. You may opt out of marketing emails at any time via the unsubscribe link
                  (legal basis: contract / consent).
                </li>
                <li>
                  <strong className="text-on-surface">Legal compliance</strong> — to meet applicable laws, regulations, and
                  enforceable government requests (legal basis: legal obligation).
                </li>
              </ul>
            </section>

            {/* 3 */}
            <section id="sharing">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                3. Sharing Your Information
              </h2>
              <p className="mb-4">We do not sell your personal data. We share it only in these circumstances:</p>
              <ul className="list-disc list-inside space-y-3 ml-2">
                <li>
                  <strong className="text-on-surface">Service providers</strong> — cloud hosting, object storage, content delivery,
                  and email delivery partners who process data on our behalf under strict data
                  processing agreements.
                </li>
                <li>
                  <strong className="text-on-surface">Event participants</strong> — photos and videos within an album are visible to
                  other participants who have access to that event's QR code or link. Hosts control
                  who may access their event.
                </li>
                <li>
                  <strong className="text-on-surface">Legal requirements</strong> — if required by law, court order, or to protect
                  the safety of our users or the public, we may disclose information to appropriate
                  authorities.
                </li>
                <li>
                  <strong className="text-on-surface">Business transfers</strong> — in the event of a merger, acquisition, or sale
                  of assets, your data may be transferred. We will notify you before your personal
                  data becomes subject to a different privacy policy.
                </li>
              </ul>
            </section>

            {/* 4 */}
            <section id="retention">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                4. Data Retention
              </h2>
              <p className="mb-4">We retain your data only as long as necessary to provide the Service and fulfil legal obligations:</p>
              <ul className="list-disc list-inside space-y-3 ml-2">
                <li>
                  <strong className="text-on-surface">Account data</strong> is retained while your account is active and deleted
                  within 30 days of a confirmed account closure request.
                </li>
                <li>
                  <strong className="text-on-surface">Event content</strong> (photos and videos) is retained for 12 months after
                  the event date, or until the host manually deletes the event — whichever comes
                  first.
                </li>
                <li>
                  <strong className="text-on-surface">Backup copies</strong> are purged within 90 days following deletion.
                </li>
                <li>
                  <strong className="text-on-surface">Technical logs</strong> are retained for up to 90 days for security purposes.
                </li>
              </ul>
            </section>

            {/* 5 */}
            <section id="your-rights">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                5. Your Rights
              </h2>
              <h3 className="font-semibold text-on-surface mb-2">For users in the European Economic Area and United Kingdom (GDPR)</h3>
              <p className="mb-4">
                You have the right to access, rectify, or erase your personal data; restrict or
                object to processing; request data portability; and withdraw consent at any time
                without affecting the lawfulness of prior processing. To exercise these rights,
                email us at{" "}
                <a href="mailto:privacy@camshare.io" className="text-primary hover:underline">
                  privacy@camshare.io
                </a>
                . You also have the right to lodge a complaint with your local supervisory authority.
              </p>
              <h3 className="font-semibold text-on-surface mb-2">For California residents (CCPA / CPRA)</h3>
              <p>
                You have the right to know what personal information we collect and how it is used,
                to request deletion of your personal information, to correct inaccurate information,
                and to opt out of the sale or sharing of personal information (we do not sell or
                share personal information for cross-context behavioural advertising). We will not
                discriminate against you for exercising these rights. To submit a verifiable
                consumer request, contact{" "}
                <a href="mailto:privacy@camshare.io" className="text-primary hover:underline">
                  privacy@camshare.io
                </a>
                .
              </p>
            </section>

            {/* 6 */}
            <section id="cookies">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                6. Cookies &amp; Tracking
              </h2>
              <p className="mb-4">We use the following categories of cookies:</p>
              <ul className="list-disc list-inside space-y-3 ml-2">
                <li>
                  <strong className="text-on-surface">Essential cookies</strong> — required for authentication (JWT session tokens)
                  and core platform functionality. These cannot be disabled.
                </li>
                <li>
                  <strong className="text-on-surface">Analytics cookies</strong> — we use privacy-respecting analytics with IP
                  address anonymisation to understand aggregate usage patterns. You may opt out via
                  your browser's Do Not Track setting or by contacting us.
                </li>
              </ul>
              <p className="mt-4">
                We do not use advertising or tracking cookies and do not participate in any
                cross-site advertising networks.
              </p>
            </section>

            {/* 7 */}
            <section id="childrens-privacy">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                7. Children's Privacy
              </h2>
              <p>
                The Service is not directed to children under 13 years of age. We do not knowingly
                collect personal information from children under 13. If you believe a child under 13
                has provided us with personal information, please contact us immediately at{" "}
                <a href="mailto:privacy@camshare.io" className="text-primary hover:underline">
                  privacy@camshare.io
                </a>{" "}
                and we will take steps to delete the information.
              </p>
            </section>

            {/* 8 */}
            <section id="changes">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                8. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. For material changes, we will
                notify registered users by email at least 30 days before the change takes effect
                and update the "Effective date" at the top of this page. Your continued use of the
                Service after the effective date of any change constitutes your acceptance of the
                revised policy.
              </p>
            </section>

            {/* 9 */}
            <section id="contact">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                9. Contact Us
              </h2>
              <p className="mb-4">
                For privacy-related questions, data subject requests, or to report a concern,
                please contact our Privacy Team:
              </p>
              <address className="not-italic space-y-1 text-on-surface">
                <p>CamShare, Inc.</p>
                <p>
                  Email:{" "}
                  <a href="mailto:privacy@camshare.io" className="text-primary hover:underline">
                    privacy@camshare.io
                  </a>
                </p>
                <p>Registered in the State of Delaware, USA</p>
              </address>
            </section>
          </article>
        </div>
      </section>
    </MarketingShell>
  )
}
