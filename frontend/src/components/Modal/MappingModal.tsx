import { Modal } from "./Modal";

interface MappingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MappingModal({ isOpen, onClose }: MappingModalProps) {
  return (
    <Modal isOpen={isOpen} title="🗺️ Field Mapping" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Map fields from your documents to the system schema.
        </p>
        <div className="space-y-3">
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Source Field
              </label>
              <input
                type="text"
                placeholder="e.g., Patient Name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Field
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Select Target Field</option>
                <option>Name</option>
                <option>Email</option>
                <option>Phone</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
