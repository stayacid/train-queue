export type TableColumn = {
  /** Имя поля в строке (совпадает с именем слота для кастомного рендера) */
  prop: string
  label: string
  width?: number | string
}
