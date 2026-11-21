// SSR-смок-тест: рендерит страницу на сервере и проверяет, что рантайм-ошибок
// нет. Ловит те падения, которые не видны статической проверке (tsc/lint/build),
// например обращение к полю пустой строки row: {}, с которым Element Plus
// вызывает default-слот el-table-column для детекта вложенных колонок.
import { writeFileSync } from 'node:fs'

import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'

import TrainQueuePage from '../src/pages/TrainQueuePage.vue'

const app = createSSRApp(TrainQueuePage)
app.use(createPinia())
app.use(ElementPlus)

renderToString(app)
  .then((html) => {
    writeFileSync(new URL('../.tmp-ssr/page.html', import.meta.url), html)
    console.log('RENDER OK, html length:', html.length)
  })
  .catch((err) => {
    console.error('RENDER FAILED:')
    console.error(err)
    process.exit(1)
  })
