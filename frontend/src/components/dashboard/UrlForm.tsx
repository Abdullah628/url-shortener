'use client';

import React, { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Link2, Copy, Check } from 'lucide-react';
import { CreateUrlFormData, Url } from '@/types';
import { isValidUrl, copyToClipboard, getErrorMessage } from '@/utils/helpers';

interface UrlFormProps {
  onSubmit: (data: CreateUrlFormData) => Promise<Url>;
  isLimitReached:  boolean;
}

export default function UrlForm({ onSubmit, isLimitReached }: UrlFormProps) {
  const { success, error:  showError } = useToast();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Url | null>(null);
  const [copied, setCopied] = useState(false);

  const validate = (): boolean => {
    if (!url) {
      setError('URL is required');
      return false;
    }
    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e:  React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsLoading(true);
    setError('');

    try {
      const newUrl = await onSubmit({ originalUrl: url });
      setResult(newUrl);
      setUrl('');
      success('Short URL created successfully!');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      const copied = await copyToClipboard(result. shortUrl);
      if (copied) {
        setCopied(true);
        success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Shorten a URL</h2>
      
      {isLimitReached && (
        <Alert variant="warning" className="mb-4">
          <strong>Limit Reached: </strong> You've reached the maximum of 100 URLs.  
          Please delete some URLs or upgrade your plan to create more.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Enter your long URL"
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError('');
          }}
          placeholder="https://example.com/very-long-url"
          error={error}
          leftIcon={<Link2 className="w-5 h-5" />}
          disabled={isLoading || isLimitReached}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          disabled={isLimitReached}
        >
          Shorten URL
        </Button>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-900 mb-2">Your shortened URL:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={result.shortUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-white border border-green-300 rounded-lg"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              size="md"
              leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}