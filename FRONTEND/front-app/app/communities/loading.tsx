export default function CommunitiesLoading() {
  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b bg-white px-5 pb-5 pt-7">
        <div className="mx-auto max-w-6xl">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />

          <div className="mt-2 h-8 w-48 animate-pulse rounded bg-slate-200" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />

        <div className="mt-4 h-12 animate-pulse rounded-2xl bg-slate-200" />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="rounded-3xl bg-white p-5 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-200" />

                <div className="flex-1">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />

                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                </div>
              </div>

              <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-200" />

              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}