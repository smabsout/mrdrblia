export default function TOS() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-sm">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using PriceGuide, you accept and agree to be bound by the terms and provision of this agreement.
      </p>

      <h2>2. Informational Purposes Only</h2>
      <p>
        The valuations and historical pricing data provided on PriceGuide are for informational purposes only. We do not guarantee the accuracy of any pricing data, and you should not rely on this information for making financial decisions or investments. Market conditions fluctuate, and actual sale prices may differ significantly from our estimates.
      </p>

      <h2>3. User Accounts</h2>
      <p>
        If you create an account on the website, you are responsible for maintaining the security of your account and you are fully responsible for all activities that occur under the account. You must immediately notify us of any unauthorized uses of your account.
      </p>

      <h2>4. Data Accuracy</h2>
      <p>
        While we strive to keep the information up to date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability or availability with respect to the website or the information, products, services, or related graphics contained on the website for any purpose.
      </p>

      <h2>5. Modifications</h2>
      <p>
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
      </p>
    </div>
  );
}