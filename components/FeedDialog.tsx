import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface FeedDialogProps {
  open: boolean;
  mode: 'add' | 'edit';
  initialUrl?: string;
  initialName?: string;
  onClose: () => void;
  onSubmit: (url: string, name: string) => Promise<void>;
}

export function FeedDialog({
  open,
  mode,
  initialUrl = '',
  initialName = '',
  onClose,
  onSubmit,
}: FeedDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUrl(initialUrl);
    setName(initialName);
  }, [initialUrl, initialName, open]);

  const handleSubmit = async () => {
    if (!url.trim()) {
      alert('请输入 URL');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(url.trim(), name.trim());
      setUrl('');
      setName('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setName('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? '添加自定义源' : '编辑 RSS 源'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? '支持直接粘贴 Twitter、GitHub、知乎、B站 等平台链接，自动转换为 RSS 源'
              : '修改 RSS 源的名称或 URL'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="url" className="text-sm font-medium">
              URL <span className="text-red-500">*</span>
            </label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://x.com/username 或 https://example.com/feed.xml"
              disabled={submitting}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              例如：https://x.com/elonmusk 或 https://github.com/trending
            </p>
          </div>

          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              名称 <span className="text-gray-400 font-normal">(可选，智能识别时自动填充)</span>
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：GitHub Trending"
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '处理中...' : mode === 'add' ? '添加' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
