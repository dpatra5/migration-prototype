import { Modal } from "./Modal";

interface UnclassifiedDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnclassifiedDocsModal({
  isOpen,
  onClose,
}: UnclassifiedDocsModalProps) {
  const unclassifiedDocs = [
    {
      id: "DOC-001",
      name: "Unknown_Document_1.pdf",
      size: "2.5 MB",
      uploaded: "2024-08-31",
    },
    {
      id: "DOC-002",
      name: "Scan_0428.pdf",
      size: "1.8 MB",
      uploaded: "2024-08-30",
    },
    {
      id: "DOC-003",
      name: "Report_Final.docx",
      size: "450 KB",
      uploaded: "2024-08-30",
    },
  ];

  return (
    <Modal isOpen={isOpen} title="📄 Unclassified Documents" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Documents that could not be automatically classified (
          {unclassifiedDocs.length} total).
        </p>
        <div className="space-y-2">
          {unclassifiedDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {doc.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {doc.size} • Uploaded: {doc.uploaded}
                </p>
              </div>
              <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
                Classify
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
