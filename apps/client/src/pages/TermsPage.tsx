import { Link } from "react-router-dom"
import { MarketingShell } from "@/components/layout/MarketingShell"

const toc = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "service", label: "Description of Service" },
  { id: "accounts", label: "Account Registration" },
  { id: "user-content", label: "User Content" },
  { id: "acceptable-use", label: "Acceptable Use" },
  { id: "privacy", label: "Privacy" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "indemnification", label: "Indemnification" },
  { id: "governing-law", label: "Governing Law" },
  { id: "disputes", label: "Dispute Resolution" },
  { id: "changes", label: "Changes to Terms" },
  { id: "contact", label: "Contact Us" },
]

export const TermsPage = () => {
  return (
    <MarketingShell>
      {/* HEADER */}
      <section className="px-margin-mobile md:px-margin-desktop pt-20 pb-10 border-b border-outline-variant/10">
        <div className="max-w-5xl mx-auto">
          <span className="inline-block font-label-md text-label-md uppercase tracking-widest text-primary mb-4">
            Legal
          </span>
          <h1 className="font-display-lg text-display-lg text-on-background mb-4">
            Terms &amp; Conditions
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
              Please read these Terms and Conditions ("Terms") carefully before using the CamShare
              platform (the "Service") operated by CamShare, Inc. ("CamShare," "we," "our," or
              "us"). By accessing or using the Service, you agree to be bound by these Terms. If
              you do not agree, do not use the Service.
            </p>

            {/* 1 */}
            <section id="acceptance">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account, uploading content, or accessing any event album — including
                as a guest via QR code — you confirm that you are at least 13 years old, have the
                legal capacity to enter into this agreement, and accept these Terms in full. If you
                are using the Service on behalf of an organisation, you represent that you have the
                authority to bind that organisation to these Terms.
              </p>
            </section>

            {/* 2 */}
            <section id="service">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                2. Description of Service
              </h2>
              <p>
                CamShare is a cloud-based platform that enables event hosts to create shared photo
                and video albums accessible to guests via QR code. Features include real-time
                uploads, gallery management, QR-based guest access, and administrative controls.
                We reserve the right to modify, suspend, or discontinue any aspect of the Service
                at any time, with or without notice.
              </p>
            </section>

            {/* 3 */}
            <section id="accounts">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                3. Account Registration
              </h2>
              <p className="mb-4">
                To create events, you must register an account with a valid email address and
                accurate information. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
                <li>maintaining the confidentiality of your account credentials;</li>
                <li>all activity that occurs under your account;</li>
                <li>promptly notifying us of any unauthorised access at legal@camshare.io.</li>
              </ul>
              <p>
                You may not share your account or create accounts using automated methods. We
                reserve the right to suspend or terminate accounts that violate these Terms.
              </p>
            </section>

            {/* 4 */}
            <section id="user-content">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                4. User Content
              </h2>
              <h3 className="font-semibold text-on-surface mb-2">Ownership</h3>
              <p className="mb-4">
                You retain full ownership of all photos, videos, and other content you upload to
                the Service ("User Content"). These Terms do not transfer any intellectual property
                rights from you to CamShare.
              </p>
              <h3 className="font-semibold text-on-surface mb-2">License to CamShare</h3>
              <p className="mb-4">
                By uploading User Content, you grant CamShare a worldwide, non-exclusive,
                royalty-free, sublicensable licence to host, store, reproduce, transmit, display,
                and distribute your User Content solely as necessary to operate and provide the
                Service. This licence terminates when you delete your content or close your
                account, subject to our retention policy.
              </p>
              <h3 className="font-semibold text-on-surface mb-2">Your Responsibility</h3>
              <p>
                You are solely responsible for the User Content you upload. You represent and
                warrant that you own or have the necessary rights to upload such content, that it
                does not infringe any third party's intellectual property or privacy rights, and
                that it complies with applicable laws.
              </p>
            </section>

            {/* 5 */}
            <section id="acceptable-use">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                5. Acceptable Use
              </h2>
              <p className="mb-4">You agree not to use the Service to upload, share, or transmit content that:</p>
              <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
                <li>is illegal under applicable law;</li>
                <li>infringes any copyright, trademark, or other intellectual property right;</li>
                <li>
                  constitutes child sexual abuse material (CSAM) — any such content will be
                  reported to the National Center for Missing &amp; Exploited Children (NCMEC) and
                  relevant law enforcement;
                </li>
                <li>harasses, defames, or threatens any individual;</li>
                <li>contains malware, phishing, or other malicious code;</li>
                <li>
                  is used to scrape, crawl, or extract data from the Service without our written
                  permission.
                </li>
              </ul>
              <p>
                Violation of this section may result in immediate account termination and, where
                appropriate, referral to law enforcement.
              </p>
            </section>

            {/* 6 */}
            <section id="privacy">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                6. Privacy
              </h2>
              <p>
                Your use of the Service is also governed by our{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                , which is incorporated into these Terms by reference. Please review it carefully
                to understand how we collect, use, and protect your information.
              </p>
            </section>

            {/* 7 */}
            <section id="disclaimers">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                7. Disclaimers
              </h2>
              <p className="mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                We do not warrant that the Service will be uninterrupted, error-free, or free of
                viruses or other harmful components. We are not responsible for the accuracy,
                completeness, or legality of any User Content posted by other users.
              </p>
            </section>

            {/* 8 */}
            <section id="liability">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                8. Limitation of Liability
              </h2>
              <p className="mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, CAMSHARE AND ITS OFFICERS,
                DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR
                GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR THE SERVICE.
              </p>
              <p>
                IN NO EVENT SHALL CAMSHARE'S TOTAL LIABILITY EXCEED THE GREATER OF (A) THE FEES
                YOU PAID TO CAMSHARE IN THE TWELVE MONTHS PRECEDING THE CLAIM OR (B) ONE HUNDRED
                US DOLLARS (USD $100).
              </p>
            </section>

            {/* 9 */}
            <section id="indemnification">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                9. Indemnification
              </h2>
              <p>
                You agree to defend, indemnify, and hold harmless CamShare and its officers,
                directors, employees, and agents from and against any claims, liabilities, damages,
                judgements, awards, losses, costs, and expenses (including reasonable legal fees)
                arising out of or relating to your violation of these Terms, your User Content, or
                your use of the Service.
              </p>
            </section>

            {/* 10 */}
            <section id="governing-law">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                10. Governing Law
              </h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of the State
                of Delaware, United States, without regard to its conflict of law principles. If
                you are a consumer residing in the EU or UK, mandatory consumer protection laws of
                your country of residence will also apply.
              </p>
            </section>

            {/* 11 */}
            <section id="disputes">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                11. Dispute Resolution
              </h2>
              <p className="mb-4">
                We encourage you to contact us first at{" "}
                <a href="mailto:legal@camshare.io" className="text-primary hover:underline">
                  legal@camshare.io
                </a>{" "}
                to seek an informal resolution before initiating any formal proceedings.
              </p>
              <p className="mb-4">
                If informal resolution fails, any dispute arising from these Terms shall be finally
                settled by binding arbitration administered by the American Arbitration Association
                (AAA) under its Consumer Arbitration Rules. The arbitration shall take place in
                Delaware, USA. You waive the right to bring any claim as part of a class action or
                representative proceeding.
              </p>
              <p>
                This arbitration clause does not apply to claims for injunctive relief or disputes
                relating to intellectual property rights, which may be brought in the courts of
                Delaware.
              </p>
            </section>

            {/* 12 */}
            <section id="changes">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                12. Changes to Terms
              </h2>
              <p>
                We may modify these Terms at any time. For material changes, we will provide at
                least 30 days' notice to registered users via email and update the "Effective date"
                above. Your continued use of the Service after the effective date of any revision
                constitutes acceptance of the new Terms. If you do not agree to the revised Terms,
                you must stop using the Service and may close your account.
              </p>
            </section>

            {/* 13 */}
            <section id="contact">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
                13. Contact Us
              </h2>
              <p className="mb-4">
                For questions or concerns about these Terms, please contact our Legal Team:
              </p>
              <address className="not-italic space-y-1 text-on-surface">
                <p>CamShare, Inc.</p>
                <p>
                  Email:{" "}
                  <a href="mailto:legal@camshare.io" className="text-primary hover:underline">
                    legal@camshare.io
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
