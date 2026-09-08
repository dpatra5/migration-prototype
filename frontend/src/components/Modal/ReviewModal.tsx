import { Modal } from "./Modal";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewModal({ isOpen, onClose }: ReviewModalProps) {
  return (
    <Modal isOpen={isOpen} title="👁️ Document Review" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Review and validate migrated documents.
        </p>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Sample Document
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>📄 Document: STUDY-A-001.pdf</p>
            <p>✅ Status: Ready for Review</p>
            <p>📝 Fields Extracted: 12/15</p>
            <p>⚠️ Issues: 2 fields require manual validation</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            ✅ Approve
          </button>
          <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            ⚠️ Review
          </button>
          <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            ❌ Reject
          </button>
        </div>
      </div>
    </Modal>
  );
}
