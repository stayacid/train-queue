// SSR-смок-тест: рендерит страницу на сервере и ловит рантайм-ошибки,
// которых не видят статические проверки (tsc / lint / build).
//
// Главное, что проверяется: el-table-column (Element Plus) вызывает
// default-слот не только с настоящими строками, но и с пустой row: {}
// для детекта вложенных колонок. Код в слотах обязан это выдерживать.
//
// Ограничение: в SSR el-table не рендерит строки тела (данные подгружаются
// в watcher'ах, которые не исполняются на сервере), поэтому смок-тест
// проверяет дерево страницы и «детект-рендер» колонок, но не сами ячейки.
//
// Запуск: node scripts/ssr-smoke.mjs
import { execFileSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname

execFileSync(
  'yarn',
  ['vite', 'build', '--ssr', 'scripts/ssr-entry.ts', '--outDir', '.tmp-ssr', '--emptyOutDir'],
  { stdio: 'inherit', cwd: root },
)
execFileSync('node', ['.tmp-ssr/ssr-entry.js'], { stdio: 'inherit', cwd: root })
