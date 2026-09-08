import { Modal } from "./Modal";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  return (
    <Modal isOpen={isOpen} title="📤 Upload Documents" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Upload your documents for migration processing.
        </p>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Drag and drop files here or click to browse
          </p>
          <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Select Files
          </button>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Supported formats: PDF, DOC, DOCX, XLS, XLSX</p>
          <p>Maximum file size: 100MB</p>
        </div>
      </div>
    </Modal>
  );
}
