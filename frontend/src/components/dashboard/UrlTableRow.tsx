'use client';

import React, { useState } from 'react';
import { Url } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Copy, ExternalLink, Trash2, Check } from 'lucide-react';
import { truncateString, formatRelativeTime, copyToClipboard, formatNumber } from '@/utils/helpers';
import { useToast } from '@/context/ToastContext';

interface UrlTableRowProps {
  url:  Url;
  onDelete:  (id: string) => Promise<void>;
}

export default function UrlTableRow({ url, onDelete }: UrlTableRowProps) {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullUrl, setShowFullUrl] = useState(false);

  const handleCopy = async () => {
    const copied = await copyToClipboard(url.shortUrl);
    if (copied) {
      setCopied(true);
      success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(url.id);
      setShowDeleteModal(false);
      success('URL deleted successfully!');
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        {/* Original URL */}
        <td className="px-6 py-4">
          <button
            onClick={() => setShowFullUrl(! showFullUrl)}
            className="text-sm text-gray-900 hover:text-primary-600 text-left"
            title={url.originalUrl}
          >
            {showFullUrl ? url.originalUrl : truncateString(url.originalUrl, 50)}
          </button>
          <a
            href={url.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover: text-primary-600 mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            Visit
          </a>
        </td>

        {/* Short Code */}
        <td className="px-6 py-4">
          <code className="px-2 py-1 text-sm font-mono bg-gray-100 text-primary-600 rounded">
            {url.shortCode}
          </code>
        </td>

        {/* Short URL */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <a
              href={url.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {url.shortUrl}
            </a>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </td>

        {/* Clicks */}
        <td className="px-6 py-4">
          <span className="text-sm font-semibold text-gray-900">
            {formatNumber(url. clickCount)}
          </span>
        </td>

        {/* Created */}
        <td className="px-6 py-4 text-sm text-gray-500">
          {formatRelativeTime(url.createdAt)}
        </td>

        {/* Actions */}
        <td className="px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete
          </Button>
        </td>
      </tr>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete URL"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this shortened URL?  This action cannot be undone. 
          </p>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Short URL</p>
            <p className="text-sm font-medium text-gray-900">{url.shortUrl}</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}