export default function TOS() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="font-serif text-4xl font-bold mb-8 pb-4 border-b border-border">Terms of Service</h1>
      
      <div className="prose prose-slate dark:prose-invert prose-headings:font-serif prose-h2:text-2xl prose-h2:mt-8 max-w-none">
        <p className="text-lg text-muted-foreground font-medium mb-8">Last updated: October 2023</p>
        
        <h2>1. Agreement to Terms</h2>
        <p>By accessing or using The Provenance, you agree to be bound by these Terms of Service. This platform is provided for research and educational purposes only.</p>

        <h2>2. Age Restriction & Content Warning</h2>
        <p>You must be at least 18 years of age to use this service. The Provenance indexes historical sales and auction data for collectibles. Some historical items or associated provenance materials may contain content, imagery, or themes that are sensitive or controversial in nature.</p>

        <h2>3. Provenance Disclosure & Accuracy</h2>
        <p>While we strive for accuracy, all valuations and price estimates are derived from available public and private sales data. We do not guarantee the completeness, reliability, or accuracy of any single data point. Users are required to disclose all known provenance issues when submitting an item for review.</p>
        
        <h2>4. Valuations are Not Financial Advice</h2>
        <p>The median estimates and confidence tiers provided by The Provenance are computational reflections of historical data, not financial advice, appraisals, or guarantees of future value. You should consult a certified appraiser before making significant financial decisions.</p>

        <h2>5. Data Submission and Verification</h2>
        <p>Sales data submitted by users is placed in a pending verification queue. Our administrative team reviews all submissions against verifiable auction records, public marketplaces, and recognized private dealer reports before including them in the valuation model.</p>
      </div>
    </div>
  );
}
