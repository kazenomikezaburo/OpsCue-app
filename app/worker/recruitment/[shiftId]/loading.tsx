export default function WorkerRecruitmentDetailLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <section role="status" aria-live="polite" aria-busy="true" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h1 className="text-xl font-semibold text-slate-950">募集詳細を読み込み中…</h1>
        <p className="mt-3 text-sm text-slate-700">勤務情報と最新の応募状況を確認しています。</p>
      </section>
    </main>
  );
}
