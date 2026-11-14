import { useEffect, useRef } from "react";
export function ConfirmDialog({
  title,
  description,
  children,
  cancel,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  cancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    ref.current?.querySelector<HTMLButtonElement>("[data-cancel]")?.focus();
    return () => {
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      onCancel={(e) => {
        e.preventDefault();
        cancel();
      }}
    >
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-description">{description}</p>
      <div className="dialog-actions">
        {children}
        <button className="button outline" data-cancel onClick={cancel}>
          Cancel
        </button>
      </div>
    </dialog>
  );
}
