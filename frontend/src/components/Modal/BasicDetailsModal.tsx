import { Modal } from "./Modal";
import { useLanguage } from "../../i18n/LanguageContext";

type BasicDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  role: string;
};

function toEmail(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .join(".");
  return `${slug || "user"}@migrationutility.com`;
}

export function BasicDetailsModal({
  isOpen,
  onClose,
  name,
  role,
}: Readonly<BasicDetailsModalProps>) {
  const { t } = useLanguage();

  const fields: { label: string; value: string }[] = [
    { label: t("basicDetails.name"), value: name },
    { label: t("basicDetails.role"), value: role },
    { label: t("basicDetails.email"), value: toEmail(name) },
    { label: t("basicDetails.department"), value: "Clinical Operations" },
  ];

  return (
    <Modal isOpen={isOpen} title={t("basicDetails.title")} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-semibold text-white shadow-md">
            {name
              .split(" ")
              .filter(Boolean)
              .map((part) => part[0]?.toUpperCase())
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {name}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t("basicDetails.active")}
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex items-center justify-between gap-4"
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {field.label}
              </dt>
              <dd className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  );
}
