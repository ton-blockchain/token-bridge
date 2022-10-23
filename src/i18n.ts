import { createI18n } from "vue-i18n";

import en from "./locales/en.json";
import ru from "./locales/ru.json";

export default createI18n({
  legacy: false,
  locale:
    navigator?.language?.split("-")?.[0] ||
    process.env.VUE_APP_I18N_LOCALE ||
    "en",
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || "en",
  messages: { en, ru },
});
