import { useTranslation } from '~/lib/i18n'
import type { Locale, LocaleOption } from '~/lib/i18n'

/**
 * Dropdown to switch the active locale. Currently
 * only English is available; the control is disabled
 * until more locales are added.
 */
const LocaleSwitcher = () => {
  const { locale, setLocale, availableLocales } = useTranslation()

  const isSingleLocale: boolean = availableLocales.length <= 1

  /** Handle locale change from select input. */
  const handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setLocale(e.target.value as Locale)
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={isSingleLocale}
      aria-label="Select language"
      className={[
        'rounded-md border border-gray-300',
        'bg-white px-2 py-1 text-sm',
        'text-gray-700',
        'focus:border-blue-500',
        'focus:outline-none focus:ring-1',
        'focus:ring-blue-500',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50',
      ].join(' ')}
    >
      {availableLocales.map((opt: LocaleOption) => (
        <option key={opt.code} value={opt.code}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export { LocaleSwitcher }
