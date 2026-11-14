const headings = new Set([
  "Saved snapshot",
  "Initial request",
  "Existing commitments",
  "Original week",
  "Original deadline checks",
  "Chosen change",
  "Updated week",
  "Checked deadlines",
  "Required agreement",
  "Outcome recorded by you",
  "Your saved message (not verified by the calculation)",
  "Limits",
]);

// Print-only structure. Preserve the complete generated text, including manual
// paragraphs; do not regenerate, shorten or interpret the user's message.
export function PrintBrief({ parts }: { parts: string[] }) {
  const [title, ...paragraphs] = parts;
  return (
    <div className="print-brief">
      {title && (
        <>
          <h1>{title}</h1>
          {"\n\n"}
          {paragraphs.map((paragraph, index) => {
            const colon = paragraph.indexOf(":");
            const heading = paragraph.slice(0, colon);
            return (
              <section key={index} className="print-brief-section">
                {headings.has(heading) ? (
                  <>
                    <h2>{heading}:</h2>
                    <p>{paragraph.slice(colon + 1)}</p>
                  </>
                ) : (
                  <p>{paragraph}</p>
                )}
                {"\n\n"}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
