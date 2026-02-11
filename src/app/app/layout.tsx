export default function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-3 py-4 sm:px-4 sm:py-6">
      {children}
    </div>
  );
}
