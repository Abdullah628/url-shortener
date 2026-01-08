'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Zap, Check } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  limit: number;
}

export default function UpgradeModal({ isOpen, onClose, currentCount, limit }: UpgradeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Upgrade Your Plan">
      <div className="space-y-6">
        {/* Alert Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Limit Reached:</strong> You've created {currentCount} out of {limit} URLs on the free plan. 
          </p>
        </div>

        {/* Current Plan */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan:  Free</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">Up to {limit} shortened URLs</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">Click tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">Basic analytics</span>
            </div>
          </div>
        </div>

        {/* Pro Plan */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upgrade to Pro</h3>
            <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded">
              Coming Soon
            </span>
          </div>
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 space-y-2 border border-primary-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-gray-700"><strong>Unlimited</strong> shortened URLs</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-gray-700">Advanced analytics & insights</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-gray-700">Custom domains</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-gray-700">QR code generation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-gray-700">Priority support</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Maybe Later
          </Button>
          <Button 
            variant="primary" 
            className="flex-1" 
            leftIcon={<Zap className="w-4 h-4" />}
            disabled
          >
            Upgrade to Pro (Coming Soon)
          </Button>
        </div>

        {/* Note */}
        <p className="text-xs text-center text-gray-500">
          Pro plan pricing will be announced soon. To remove URLs and free up space,
          delete some of your existing shortened URLs.
        </p>
      </div>
    </Modal>
  );
}