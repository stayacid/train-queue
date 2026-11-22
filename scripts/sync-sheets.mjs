// Синхронизация public/data.json из Google Sheets (для GitHub Actions и локально)
//
// Скачивает CSV трёх вкладок публичной таблицы, разбирает их и записывает
// снапшот в public/data.json. При ошибке разбора — выход с кодом 1 БЕЗ
// записи файла (коммит не создаётся).
//
// Использование: node scripts/sync-sheets.mjs [--sheet-id=<ID>]
import { mkdirSync, writeFileSync } from 'node:fs'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url, {
  alias: { '@/': new URL('../src/', import.meta.url).pathname },
})

const { fetchTabCsv, parseSheets, TAB_JOURNAL, TAB_ROSTER, TAB_TOP3 } = await jiti.import(
  '../src/utils/sheets.ts',
)

const sheetIdArg = process.argv.find((arg) => arg.startsWith('--sheet-id='))
const sheetId = sheetIdArg === undefined ? undefined : sheetIdArg.split('=')[1]

let result
try {
  const [journalCsv, rosterCsv, top3Csv] = await Promise.all([
    fetchTabCsv(TAB_JOURNAL, sheetId),
    fetchTabCsv(TAB_ROSTER, sheetId),
    fetchTabCsv(TAB_TOP3, sheetId),
  ])
  // parseSheets проверяет заголовки каждой вкладки: если вкладка не найдена,
  // gviz отдаст первую вкладку с кодом 200, и мы упадём по форме заголовков
  result = parseSheets({ journal: journalCsv, roster: rosterCsv, top3: top3Csv })
} catch (error) {
  console.error(`Ошибка синхронизации: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

for (const warning of result.warnings) {
  console.warn(`Предупреждение: ${warning}`)
}

const snapshot = {
  journal: result.journal,
  r4r5: result.roster,
  weeklyTop: result.weeklyTop,
  fetchedAt: new Date().toISOString(),
}

const publicDir = new URL('../public/', import.meta.url)
mkdirSync(publicDir, { recursive: true })
writeFileSync(new URL('data.json', publicDir), JSON.stringify(snapshot, null, 2) + '\n', 'utf8')

console.log(
  `Готово: журнал ${result.journal.length} записей, ` +
    `список R4/R5 ${result.roster.length} игроков, ` +
    `недель с топ-3: ${Object.keys(result.weeklyTop).length}; ` +
    `data.json обновлён (${snapshot.fetchedAt})`,
)
