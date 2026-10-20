# OpsCue UI Preview

架空データだけで独立UIを確認するためのprivate packageです。
本番のAuth/DB/業務処理・認可を変更せず、既存Worker/AdminページやSupabaseクライアントを取り込みません。

## STEP 275の検証記録

- Node 22.23.3 / npm 10.9.9を検証済み配布物から明示使用。
- npmのuserconfig/globalconfigは別々の空ファイル、cacheは専用一時領域。
- 正規のpackage-lock.json生成、npm ci --ignore-scripts --no-audit --no-fund成功。
- 境界検査46件PASS（正常4件・拒否42件）。
- TypeScriptソース型検査、Vite静的build、出力検査を実施。
- 開発サーバー・HTTP・ブラウザ検証は未実施。起動許可はまだありません。

## 依存

React/React DOM 19.2.8、Vite 7.3.7、TypeScript 5.9.3を固定しています。
@vitejs/plugin-reactは使いません。初期TSXはVite/esbuildのautomatic JSXで処理します。
PostCSS、postcss-value-parser、parse5はソース/出力の構造解析用です。
依存のlifecycle scriptsは未実行です。ルートのpackage/lock/node_modulesは変更しません。

## 境界検査

このpackageの設定、TS/JS AST、tsconfig alias、React package exports、
CSS @import/url、HTML resource、production側からの逆importを検査します。
全preview srcを検査し、型importも本番参照なら拒否します。
未知の動的依存、computed access、環境変数、通信API、Server Actionsは拒否します。
Vite設定はレビュー済みの内容に固定し、親PostCSS自動探索・env読込み・public directoryを無効化しています。
追加設定や依存を導入する場合は、検査policyのレビューを先に行ってください。

チェック例（検証済みNodeの絶対パスを使用）:
- node scripts/check-boundary.mjs
- node --test scripts/check-boundary.test.mjs
- node node_modules/typescript/bin/tsc --noEmit
- node node_modules/vite/bin/vite.js build --config vite.config.ts
- node scripts/check-build.mjs
- node --test scripts/check-build.test.mjs

--probeは一時ソース/出力fixtureの解析だけを行うテスト用入口です。
fixtureを実行したり本番ファイルへ書いたりしません。--probe成功を実体検査として扱わないでください。
起動前の検査は引数なしの実体検査でなければなりません。

## 出力検査の範囲と限界

distのmanifest、HTML/CSSリソース、JS ASTの通信能力・環境参照・動的依存・URLを解析します。
Reactの診断URLとXML/SVG名前空間は、実リソース参照と区別します。
これは第三者依存の全制御フロー、難読化、脆弱性、将来の条件付き動作の証明ではありません。
trusted tooling（検査器/テスト、Vite等）はブラウザgraphから分離し、別途レビューが必要です。
TypeScript型検査の対象はsrcです。Vite設定は構文解析と固定内容の照合・buildで検証します。

## 起動・公開は別STEP

127.0.0.1 bind、strictPort、CSPは外向き通信遮断ではありません。
Nodeとブラウザ双方の通信遮断、HMR、空きport、子孫process回収、実表示を検証してから起動を検討します。
dev scriptは提供していません。distは静的検証用であり、本番deployへ含めたり外部公開したりしません。

## 3人での作業

各自のcloneで作業ブランチを作り、fixture・表示部品・境界変更をPRでレビューします。
実データ/個人情報/秘密情報は禁止です。境界検査を弱めて失敗を回避しないでください。
オフライン検証は実Auth/DB/本番安全性の証明ではありません。

## STEP 276: 起動前検査器（ホスト起動は拒否）

scripts/run-preview.mjsを追加しました。専用子プロセスの最小環境で使用します。
Node v22.23.3とWindows配布物SHA-256、同梱npm 10.9.9、cwd、境界・出力検査、
package/生成物と独立clone indexの前後ハッシュを確認します。
親PATH、NODE_OPTIONS、npm/proxy/DB/Auth/AWS/LINE資格情報は検査子プロセスにコピーしません。
ただしNode自身が起動する前のpreloadはJavaScriptから防げないため、最初のNode起動も環境を消去する外側の起動処理が必要です。

検査後もPREVIEW_ISOLATION_UNVERIFIED（終了コード2）で拒否します。
自己申告の環境フラグ・CLI引数・booleanは実行許可になりません。
現在の実装は起動前検査器までで、Vite/browser起動、ポート予約、native process containmentは未実装です。
固定候補はVite preview / 127.0.0.1:5178 / strictPortです。検査器はsocketを作りません。

17件のモデルテストは固定host、Node拒否、環境許可リスト、検査失敗・timeout・偽承認の拒否を検証します。
モデルPASSはIPv4/IPv6/DNS/ブラウザ遮断やJob Objectの実証ではありません。
起動前検査で使うAST子プロセスは同期実行で終了を待ちますが、将来のVite子孫回収を保証しません。
PID走査やtaskkillを保証済みの代替として追加しません。

次の候補は、事前準備済みのオフラインVMまたはWindows Sandboxです。
Sandboxは既定でnetwork/clipboardが有効なため、Networking/ClipboardRedirection等を明示Disableし、
認証情報・ホストprofile・拡張・同期を渡さず、Nodeとブラウザを同じguest内で使う必要があります。
共有は秘密のない専用入力だけをReadOnlyで渡し、guest私有領域へコピーしてから検証する方針です。
ホストworktree、ユーザーprofile、既存backupを直接共有しません。書込み共有・clipboardは使いません。
guestの127.0.0.1はホストlocalhostとは別です。ホストbrowserでguest表示するためのproxy/tunnelは追加しません。

guest内でloopback成功・外部IPv4/IPv6/DNS拒否・子孫/ブラウザにも適用・終了後の破棄を実測するまでは起動禁止です。
端末のSandbox利用可否、browser準備、プロセス回収、ポート競合と予約は未検証です。
管理者操作、Firewall/VPN/proxy/機能の変更やVM起動はこのSTEPで行いません。

参考:
- https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/windows-sandbox-configure-using-wsb-file
- https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects

## STEP 285: 前日確認バッジの独立表示

PreviewPreShiftStatusBadgeを追加し、not_open（受付前）、pending（未確認）、confirmed（確認済み）を合成fixtureだけで静的表示します。
本番components/worker/pre-shift-status-badge.tsxとlib/domain/pre-shift-confirmation.tsを参照しましたが、直接importしていません。
ローカルunion型と明示分岐を使用し、未知値は「状態不明」です。本番実装は未知値を保証していません。
境界検査の属性許可リストを維持するため、状態はchildren propで受け取ります。computed accessは使いません。
色は導入済みTailwind theme.cssのslate-100/700、amber-50/800、emerald-50/800のOKLCH値を独立CSSへ記載しています。
色だけでなく文字で識別し、例は折返し可能です。本番CSS・Tailwind設定への依存はありません。

Node 22.23.3の最小環境で、表示契約・未知値・禁止依存と既存起動拒否テスト40/40 PASS、
境界検査、TypeScript型検査、Vite静的ビルド、ビルド出力検査を確認しました。
追加テストはscripts/pre-shift-preview.test.mjsです。既存境界・出力回帰の結果はSTEP報告を参照してください。
初回state JSX属性は境界で拒否されたため、検査を緩和せずchildrenへ修正しました。
テストfixtureの書込み先は.vite-cache/test-tmpに限定します。
ブラウザ表示、実際のフォント・コントラスト・レスポンシブ描画は未検証で、本番との表示差が残る可能性があります。
本番Auth/DB・業務状態の検証ではありません。run-preview.mjsのPREVIEW_ISOLATION_UNVERIFIEDによる起動拒否を維持します。
## STEP 287: Worker「次の勤務」の独立カード

PreviewNextShiftCardは表示専用です。本番components/worker/home/worker-home.tsxの「次の勤務」を参考にしましたが、直接importしていません。
ローカルのchildren propで固定表示モデルを受け取り、案件・業務・勤務地・日付・時間と独立PreShiftStatusBadgeを表示します。
通常3状態（not_open/pending/confirmed）、空、取得失敗を模したエラー、長文の6例は全て合成データです。
実ID・実住所・URL・個人情報・資格情報、日時計算、勤務分類・実行許可の導出、リンク・操作ボタンはありません。
未知の表示状態は「表示状態不明」、未知の前日確認は「状態不明」です。

Node 22.23.3の隔離環境で境界検査、TypeScript型検査、Vite静的ビルド、出力検査を実施しました。
新規テストはscripts/worker-next-shift.test.mjsです。全回帰テストの件数と結果はSTEP完了報告を参照してください。
テストfixtureの書込みは.vite-cache/test-tmp、ビルド出力はdistに限定します。依存追加・境界検査の緩和はありません。

独立CSSに長文折返し・狭幅1列を定義しましたが、実際の折返し・色・コントラスト・ブラウザ表示は未検証です。
本番の集合案内や操作導線は含めず、表示差と将来の追従負担が残ります。
勤務状態、認可、Auth/DBの安全性を実証するものではありません。
run-preview.mjsのPREVIEW_ISOLATION_UNVERIFIEDによる起動拒否を維持します。サーバー・ブラウザ・HTTPアクセスは実施していません。
## STEP 289: 境界と表示テストの安全性強化

createRootは名前だけで許可しません。main.tsxのレビュー済みAST全体を照合し、react-dom/clientのcreateRoot export、ローカルbinding、呼出し位置と引数を固定します。
alias・再定義・shadowing・別位置/引数・別ファイルのcreateRootを拒否します。未知の呼出しは許可しません。

表示テストはnew Function、eval、vm、汎用requireを使用しません。
static-component-harness.mjsがソース文字列を固定し、同じ文字列を境界検査へ渡した後、限定したAST構造だけを解釈します。
検査FAIL・エラー・不一致は解釈前に拒否します。後のファイル変更は固定済み文字列の内容を変更しません。
許可する依存は固定snapshot内の相対TS/TSXモジュールだけです。Node標準モジュール・packageの実行時解決はありません。
呼出しAST・未知構文・不明な依存は解釈しません。環境変数、ネットワーク、ファイル/プロセス操作を対象ソースへ渡しません。
この解釈器はブラウザ描画や任意JavaScriptのセキュリティsandboxではなく、既存の限定表示仕様を検査する補助です。
検査ツール自身とTypeScript等の導入済み依存は別途レビュー対象です。出力検査は完全なデータフロー証明ではありません。

既存の表示状態・合成fixture・境界拒否・run-previewのPREVIEW_ISOLATION_UNVERIFIEDは維持します。
ブラウザ表示・通信隔離の実証は引き続き未実施です。静的検証の最終件数はSTEP完了報告を参照してください。
## STEP 291: dependency closure and build input boundary (PARTIAL)

Local imports (including type imports and re-exports) must resolve through the
existing TypeScript Bundler resolver to an enumerated, inspected source file.
Explicit/omitted extensions and index resolution follow that resolver; a
successful resolution alone is insufficient. Unknown extensions, missing files,
out-of-scope paths, redirected targets and excluded directory imports fail closed.
CSS and HTML local resources must also be present in the inspected source set.
The existing React package export contract remains unchanged.

Snapshot fixture entries not enumerated by the inspector are rejected. No source
from src/dist, src/.vite-cache, src/node_modules, src/.git or src/.next is approved
merely because it is inside src.

scripts/build-input-boundary.mjs records exact byte hashes, source membership,
canonical targets and source text, together with HTML, Vite/TypeScript config,
package metadata and the lockfile. verifyInputs detects changes at observation
points. assertLocalResolution rejects a resolved local input absent from the
snapshot or different from the expected target. Neither function runs source.
These functions are NOT yet connected to Vite's resolve/load hooks.

Vite browser/import export conditions, implicit react/jsx-runtime imports,
built-in virtual modules, HTML/CSS processing and plugin-generated inputs still
require a reviewed build adapter. The configuration has no user plugins or aliases,
but this does not prove equivalence of the actual build graph.

The build script now invokes check-build-input.mjs. It captures and inspects input,
rechecks it, and deliberately exits nonzero with PREVIEW_BUILD_INPUT_UNVERIFIED.
It does not invoke Vite. Direct invocation of Vite is not an approved workaround.
Existing dist is historical output and is not evidence of a new build.

Before/after hashes do not prevent a transient in-build replacement. Snapshot
capture itself is not an atomic filesystem snapshot. A future adapter must consume
inspected immutable content and reject unknown resolution/load paths, including
CSS, assets, HTML and package-dependent transforms, before build authorization.

The component interpreter's else/export semantics issues from STEP 290 remain
outside this dependency-closure patch. Browser rendering is unverified.
run-preview.mjs continues to reject PREVIEW_ISOLATION_UNVERIFIED; no runtime,
network-isolation or live DB/Auth safety claim is made.
STEP 291 verification: Node 22.23.3 / npm 10.9.9; 26 new regression tests plus
145 existing tests = 171 PASS, zero failure/cancelled/skip/TODO, exit code 0.
TypeScript and source boundary checks passed. Input snapshot inspection passed;
the build gate deliberately returned code 1 (PREVIEW_BUILD_INPUT_UNVERIFIED).
Existing historical dist passed output inspection; Vite build was NOT run.
## STEP 292: verified build route decision — C (build remains withheld)

A (staged snapshot build) is not adopted: staging application source alone does
not constrain installed package manifests, native/compiler tooling, package export
conditions, or direct HTML/CSS/config reads. A private directory is not an OS
isolation boundary; the same user can modify staged files. No staging build is run.

B (resolver/load plugin) is not adopted: Vite 7.3.7 includes internal reads and
generated modules outside a simple local module hook contract. The installed
implementation contains HTML/CSS/resource/config read paths and CommonJS proxy,
module, entry, helper and external module generation. These routes have not been
shown to consume only inspected immutable inputs. ReactDOM 19.2.8 declares
scheduler ^0.27.0; it is not silently added to the preview source allowlist.

scripts/verified-input-gate.mjs implements a CANDIDATE contract, not an installed
Vite plugin. It copies and freezes snapshot records, checks UTF-8 content hashes
and canonical targets, returns only stored source text, matches mocked resolver
results to unambiguous enumerated local paths, and parses transformed script
imports without executing them. Unknown imports, exports, aliases, virtual IDs,
dynamic import, require, unknown resources and divergent targets are refused.
CSS can be loaded as fixed text, but its transform route is deliberately refused;
HTML transformation is refused too. Package exports, react/jsx-runtime and Vite
CommonJS virtual modules are not automatically approved.

check-build-input.mjs now constructs the candidate gate and reads the inspected
main entry through it, then still exits nonzero PREVIEW_BUILD_INPUT_UNVERIFIED.
No Vite import, configuration evaluation or build is performed by this entry.
This is partial hardening, NOT establishment of a verified Vite build route.

Original input bytes/membership/targets are compared at observation points.
Candidate load returns the frozen text even after caller snapshot mutation.
Neither observations nor the candidate gate establish an atomic filesystem view,
prevent transient changes in uncaptured tooling, or prove actual Vite hook coverage.

Next work must audit the actual complete pipeline, freeze all relevant runtime
package inputs and metadata, specify each generated module and trusted transform,
and validate direct HTML/CSS/asset/config paths before build authorization.
Unknown plugin-added dependencies must remain fatal. Do not invoke Vite directly
as a workaround. Browser rendering remains unverified and
PREVIEW_ISOLATION_UNVERIFIED startup refusal remains unchanged.
STEP 292 verification: Node 22.23.3 / npm 10.9.9; 27 new tests + 171 existing
tests = 198 PASS, FAIL/cancelled/SKIP/TODO all 0, exit code 0. TypeScript and source
boundary passed. The candidate input gate passed its fixed-data/mock tests; the
real build entry deliberately refused with code 1 PREVIEW_BUILD_INPUT_UNVERIFIED.
Historical dist passed output inspection; no new Vite build was performed.
## STEP 294: limited-AST static HTML/CSS gallery

This generates a fixed display gallery, NOT a React/Vite build. It renders the
three PreviewPreShiftStatusBadge states and six PreviewNextShiftCard examples
from synthetic fixtures. Production code, React runtime, JSX runtime, Vite,
esbuild and browser processes are not loaded to execute the component source.

The harness snapshots canonical source/config paths and exact content hashes.
The same fixed TS/TSX text is passed to boundary inspection and AST interpretation;
CSS is supplied from that snapshot. Subsequent observation checks reject changed
contents, targets or membership. This is not an atomic filesystem snapshot or an
OS security sandbox against other processes racing filesystem operations.

Supported runtime AST: static relative named imports, explicit named variable and
plain synchronous function exports, local private bindings, literal values,
static objects, own-property access, strict equality, parentheses/as/satisfies,
JSX elements, fixed JSX string attributes, JSX children, return, block and if/else/
else-if. Unsupported statements are rejected even in untaken branches.
Async/generator functions, default exports, export lists/re-exports, unknown
conditions, calls, dynamic import, require and unknown dependencies are refused.
Private declarations are no longer published. Failed/cyclic loads do not expose
partially interpreted exports.

The HTML renderer permits main, section, article, div, h1/h2/h3, p, span, small,
dl/dt/dd; attributes are className, constrained role and constrained id.
Only the two inspected component identities can be expanded. Text and attributes
escape &, <, >, double quote and apostrophe. Script, iframe, object/embed, forms,
controls, links/images, event/style/URL attributes and unknown elements fail closed.
A fixed document wrapper adds only metadata and a local styles.css reference.

PostCSS parse and value parsing are used without plugins, process() or external
file loaders. Only reviewed CSS properties, simple selectors, max-width media
rules and repeat/minmax/oklch functions are accepted. Imports, URLs, assets,
escapes, behavior/expression, custom properties and unknown constructs are refused.
The emitted CSS is the exact inspected src/styles.css text.

Approved generation entry (use the verified Node 22.23.3 absolute executable in a
dedicated child process with cleared environment, SystemRoot/WINDIR and
preview-local TEMP/TMP only; do not use the default Node):
    scripts/generate-static-gallery.mjs

Test entry:
    --test scripts/static-gallery.test.mjs
Existing test entries, typecheck and check:boundary also remain required.
The generator CLI rejects any Node version other than v22.23.3.

Output is a new exclusive directory:
    .vite-cache/static-gallery-output/
Files: index.html, styles.css, manifest.json. The manifest records input SHA-256
and HTML/CSS output SHA-256. parse5 verifies the generated structure, labels and
three badge/six card cases. Files are validated in memory before output directory
creation and rechecked after writing. Existing output directories are refused;
there is no automatic deletion, overwrite or regeneration. Existing dist is kept.

No browser, HTTP, server or Vite build is authorized by these artifacts.
PREVIEW_BUILD_INPUT_UNVERIFIED and PREVIEW_ISOLATION_UNVERIFIED remain in force.
Layout, fonts, contrast, browser compatibility, actual React rendering and OS
network/filesystem/process isolation remain unverified.

STEP 294 final verification: Node v22.23.3 / npm 10.9.9; 68 new tests and 198
existing tests = 266 PASS, FAIL/cancelled/SKIP/TODO all 0, exit code 0.
TypeScript, source boundary, fixed snapshot, generated HTML/CSS readback and
existing historical dist inspection passed. The gallery was generated once;
the existing dist bytes were unchanged. Vite build entry still returned code 1
PREVIEW_BUILD_INPUT_UNVERIFIED. Launcher refusal tests passed.

PostCSS source-map loading is explicitly disabled with map:false in source,
emitted CSS and gallery checks; sourceMappingURL/sourceURL annotations are refused.
The current stylesheet contains no such annotations. Generation is not OS
isolation, browser rendering, actual React rendering or live environment proof.
The interpreter normalizes JSX text whitespace; exact React whitespace/layout
equivalence is not claimed.

Command example from the repository root (no global PATH/environment change):
    $previewPath = (Resolve-Path 'tools/ui-preview').Path
    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $approvedNode22 # verified absolute Node v22.23.3 path
    $start.WorkingDirectory = $previewPath
    $start.UseShellExecute = $false
    $start.Environment.Clear()
    foreach ($key in @('SystemRoot','WINDIR')) {
        $start.Environment[$key] = [Environment]::GetEnvironmentVariable($key)
    }
    $start.Environment['PATH'] = Split-Path $approvedNode22
    $start.Environment['TEMP'] = Join-Path $previewPath '.vite-cache/test-tmp'
    $start.Environment['TMP'] = $start.Environment['TEMP']
    $start.ArgumentList.Add('scripts/generate-static-gallery.mjs')
    $process = [Diagnostics.Process]::Start($start)
    $process.WaitForExit()
    $process.ExitCode

For tests, create a separate equivalent cleared-environment process and pass
--test plus the explicit existing test file paths. The generated directory now
exists: another generation attempt must refuse, not overwrite it or auto-clean it.

## STEP 296: memory-only output hardening

The STEP 294 gallery and dist remain historical artifacts; neither is rewritten.
Path/realpath checks, wx, and post-write hashes do not prevent Windows ancestor
junction/reparse-point replacement between validation and creation. Node standard
APIs used here do not establish directory-handle-relative containment. No reviewed
OS isolation backend is available. Handle-based output (A) and isolated output (B)
are therefore not authorized. Option C is adopted: memory-only generation.

writeStaticGallery always throws STATIC_GALLERY_OUTPUT_UNVERIFIED before examining
arguments or touching the filesystem. No flag, mock/backend, path or caller
assertion can authorize writing. CLI generation exits nonzero with that code.
validateOutputDirectory is a legacy diagnostic, not a write authorization.
Do not bypass the writer with direct filesystem calls. No output is regenerated.

For approved in-memory verification with the previously verified absolute Node
22.23.3 and cleared child environment, call buildStaticGallery and
validateMemoryGallery via --input-type=module. Their success is memory validation,
not file generation. New regression entry: scripts/static-gallery-hardening.test.mjs.

snapshot-import-resolver.mjs is shared by the boundary and limited interpreter:
relative TS/TSX imports only, explicit .ts/.tsx or omitted extension/index.
Multiple file/index candidates are refused. The boundary also compares the shared
target with its TypeScript resolver target. Missing, uninspected, out-of-src,
query/fragment, excluded-directory and unknown resolutions fail closed.
Type-only references and re-exports are checked by the boundary; the interpreter
still skips whole type-only imports and refuses runtime re-export syntax.
This deliberately limited language is not full TypeScript module resolution.

The in-memory manifest uses schemaVersion 2 and generation method
limited-ast-static-html-css-memory-v2. It records canonical paths and SHA-256 for
the harness, renderer, generator, boundary, input capture and shared resolver,
plus input and HTML/CSS hashes. Validation compares the evidence against current
read-only tool records. These records are provenance observations, not signatures,
tamper protection, proof of loaded dependency bytes, or an atomic filesystem view.
Installed TypeScript/parse5/PostCSS implementations remain trusted dependencies.

The HTML contract now fixes the document/head/body/main structure, synthetic
notice, case placement/count, exact labels/classes, ready/empty/error paragraphs,
confirmation children and error role=alert. Unknown children and attributes fail.
JSX whitespace normalization remains different from a React rendering guarantee.

PREVIEW_BUILD_INPUT_UNVERIFIED and PREVIEW_ISOLATION_UNVERIFIED remain unchanged.
No Vite build, server, browser, HTTP, VM or live Auth/DB operation is authorized.
Existing output manifests retain schemaVersion 1 as historical evidence; do not
label them regenerated or validated with the new tool provenance schema.
## STEP 298: complete snapshot integrity and input evidence

The public validateMemoryGallery now checks every snapshot record before treating
metadata as evidence. validateSnapshot requires plain data records, exact fields,
string UTF-8 text, lowercase 64-digit SHA-256, canonical in-root identifiers and
targets, approved extensions, unique paths (case-insensitive on Windows), and no
excluded directories. It recomputes SHA-256 from UTF-8 bytes of text. Lossy/non-
roundtripping UTF-8 records fail comparison with the original byte hash.
Added/missing/unknown inputs and noncanonical aliases are refused.
Duplicate-entry arrays are refused; a JavaScript object cannot retain duplicate
identical keys that were already collapsed before the function call.

verifyInputs validates content and compares the complete snapshot to a freshly
captured read-only filesystem observation. validateMemoryGallery additionally
accepts an explicit {baseline} for fixed-reference comparison; by default it
captures the current input set. A caller-provided baseline is not automatically
trusted: current disk is also checked. Matching metadata alone is never sufficient.
Inputs changed together with their hash do not match a previously fixed baseline.

After integrity checks, the validator performs source boundary inspection and
re-derives the complete HTML/CSS/examples from the validated snapshot using the
limited AST interpreter. Supplied output hashes/examples cannot establish their
own correspondence to input. No source JavaScript or React runtime is executed.
The derivation occurs in memory only and has no file-writing route.

Schema 3 replaces the memory schema 2 contract and adds inputEvidence for every
input: inputId, canonicalPath, sha256. Legacy inputSha256 is retained and both
lists must match the validated snapshot. Tool evidence remains six canonical
paths/hashes; HTML/CSS hashes remain required. Historical schema 1 output files
are untouched. Evidence is not a signature, proof of source authorship, atomic
filesystem snapshot, OS isolation, or assurance of loaded dependency bytes.

General boundary inspection and the gallery language are different contracts.
assertGalleryImports checks the gallery snapshot explicitly: relative TS/TSX
including type imports and re-export references use the shared resolver; ambiguous,
missing and divergent inputs fail. Gallery JS/JSX and other script extensions,
aliases and unsupported dependency forms are refused. The fixed inspected main
entry may reference React, react-dom/client and local styles.css; it is never
interpreted as a component. Runtime re-exports are still refused by the interpreter.
The general boundary's local alias support is not gallery authorization.

Two section headings were added outside the existing flex/grid containers.
The shape checker requires those headings and their position; card components
retain their existing display contract. Exact React whitespace/rendering and
browser/accessibility behavior remain unverified.

New regression entry: scripts/static-gallery-integrity.test.mjs.
Use the already verified Node 22.23.3 with npm 10.9.9 and cleared child environment.
All writing, Vite build and runtime refusals remain unchanged:
STATIC_GALLERY_OUTPUT_UNVERIFIED, PREVIEW_BUILD_INPUT_UNVERIFIED,
PREVIEW_ISOLATION_UNVERIFIED. No artifact regeneration or server is authorized.

## STEP 300: frozen memory-only contract

Static gallery generation remains memory-only. File output, Vite builds and
server startup remain refused by STATIC_GALLERY_OUTPUT_UNVERIFIED,
PREVIEW_BUILD_INPUT_UNVERIFIED and PREVIEW_ISOLATION_UNVERIFIED respectively.
Browser rendering is unverified; OS isolation is not established.

Manifest schema 3 records canonical input identities and hashes, six generator
tool observations and HTML/CSS hashes. Validation rehashes UTF-8 snapshot text,
compares an explicit baseline and current disk observations, then derives output
again from inspected inputs. These comparisons are not signatures, an atomic
filesystem snapshot or proof of loaded tool byte identity.

STEP 299 independently reported zero BLOCKER and zero HIGH findings.
STEP 300 adds six stage-specific regression cases: structurally valid modified
HTML with a recomputed manifest hash reaches the final derivation refusal;
modified safe CSS is rejected earlier by snapshot CSS equality; unchanged output
passes; a substituted consistent baseline cannot bypass disk identity; a stale
hash fails UTF-8 rehash; correct baseline and disk identity pass.

The CSS final-comparison branch cannot be independently reached with changed CSS
under the current contract: disk identity and exact snapshot CSS equality reject
it first. This remains a testability limitation, not authorization to relax a
guard. Contract freeze is partial until that review requirement is resolved.
No runtime, browser or OS-isolation guarantee follows from these tests.

STEP 300 verification: Node 22.23.3 / npm 10.9.9; 360/360 tests pass
(354 existing + 6 new), fail/skip/TODO/cancelled zero, exit 0.
TypeScript, source boundary and input snapshot checks pass. Build and file
output entrypoints return exit 1 with their expected refusal codes; runtime
authorization refusal remains covered by the existing launcher tests.
Final status: STATIC_GALLERY_FREEZE_PARTIAL because changed CSS is rejected
before, rather than at, the final rederivation comparison.
