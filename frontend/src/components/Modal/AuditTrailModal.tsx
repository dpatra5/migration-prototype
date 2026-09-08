import { Modal } from "./Modal";

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditTrailModal({ isOpen, onClose }: AuditTrailModalProps) {
  const auditEntries = [
    {
      time: "2024-08-31 14:23",
      action: "Document J-104 marked as Failed",
      user: "Sahil",
    },
    {
      time: "2024-08-31 14:15",
      action: "Document J-103 processing started",
      user: "Rakesh",
    },
    {
      time: "2024-08-31 13:45",
      action: "Document J-102 partially migrated",
      user: "Ravi",
    },
    {
      time: "2024-08-31 13:30",
      action: "Document J-101 migration completed",
      user: "Abakash",
    },
  ];

  return (
    <Modal isOpen={isOpen} title="📜 Audit Trail" onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-3">
          {auditEntries.map((entry, idx) => (
            <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {entry.action}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {entry.time} • By {entry.user}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
