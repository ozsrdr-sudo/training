'use client';

export function TutorBox({ message }: { message: string }) {
  return (
    <div
      className="bg-bg-info text-fg-info rounded-md px-3.5 py-3 text-[13px] leading-snug mb-4"
      dangerouslySetInnerHTML={{ __html: message }}
    />
  );
}
