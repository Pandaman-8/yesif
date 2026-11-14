import { useRef, useState } from "react";
export function ArtifactText({
  label,
  text,
  onChange,
  print,
}: {
  label: string;
  text: string;
  onChange?: (value: string) => void;
  print?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null),
    [notice, setNotice] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(`${label} copied.`);
    } catch {
      setNotice(
        "Clipboard unavailable. The text is selected; copy it manually.",
      );
      ref.current?.focus();
      ref.current?.select();
    }
  }
  return (
    <div className="artifact-text">
      <label>
        {label}
        <textarea
          ref={ref}
          rows={8}
          value={text}
          readOnly={!onChange}
          maxLength={onChange ? 10000 : undefined}
          onChange={(e) => {
            onChange?.(e.target.value);
            setNotice("");
          }}
        />
      </label>
      <div className="artifact-actions">
        <button className="button outline" onClick={copy}>
          Copy {label.toLowerCase()}
        </button>
        {print && (
          <button className="text-button" onClick={print}>
            Print decision brief
          </button>
        )}
      </div>
      {notice && <p role="status">{notice}</p>}
    </div>
  );
}
