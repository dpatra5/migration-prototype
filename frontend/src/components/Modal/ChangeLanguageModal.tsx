import { Modal } from "./Modal";
import { useLanguage } from "../../i18n/LanguageContext";
import { languages } from "../../i18n/translations";

type ChangeLanguageModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ChangeLanguageModal({
  isOpen,
  onClose,
}: Readonly<ChangeLanguageModalProps>) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Modal isOpen={isOpen} title={t("changeLanguage.title")} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("changeLanguage.description")}
        </p>

        <div className="space-y-2">
          {languages.map((option) => {
            const isSelected = option.code === language;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => setLanguage(option.code)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">{option.flag}</span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                      {option.nativeLabel}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {option.label}
                    </span>
                  </span>
                </span>
                {isSelected && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                    ✓ {t("changeLanguage.applied")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
