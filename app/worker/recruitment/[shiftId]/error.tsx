"use client";

import Link from "next/link";

export default function WorkerRecruitmentDetailError({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <section role="alert" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h1 className="text-xl font-semibold text-slate-950">募集詳細を取得できませんでした</h1>
        <p className="mt-3 text-sm text-slate-700">時間をおいて再試行するか、募集一覧へ戻ってください。</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="min-h-11 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            再試行する
          </button>
          <Link href="/worker/recruitment" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-blue-700 underline underline-offset-2">
            募集一覧へ戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
