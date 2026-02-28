import { useState, useEffect } from 'react';
import { Modal, Input, Form, message } from 'antd';

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
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        url: initialUrl,
        name: initialName,
      });
    }
  }, [open, initialUrl, initialName, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSubmit(values.url.trim(), values.name?.trim() || '');
      form.resetFields();
    } catch (error: any) {
      // 表单验证失败或提交失败
      console.error('Form error:', error);
      if (error?.message) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={mode === 'add' ? '添加自定义源' : '编辑 RSS 源'}
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={submitting}
        okText={mode === 'add' ? '添加' : '保存'}
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-1">
            💡 <strong>智能识别：</strong>
            {mode === 'add'
              ? '支持直接粘贴 Twitter、GitHub、知乎、B站 等平台链接，自动转换为 RSS 源'
              : '修改 RSS 源的名称或 URL'}
          </p>
          {mode === 'add' && (
            <p className="text-xs text-blue-600">
              例如：https://x.com/elonmusk 或 https://github.com/trending
            </p>
          )}
          {mode === 'add' && (
            <p className="text-xs text-orange-600 mt-2">
              🚨 <strong>反爬严格平台：</strong>
              知乎、微博等平台有严重的反爬策略，RSS 源可能随时失效，稳定性无法保证
            </p>
          )}
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{ url: initialUrl, name: initialName }}
        >
          <Form.Item
            label={<span className="font-medium">URL <span className="text-red-500">*</span></span>}
            name="url"
            rules={[{ required: true, message: '请输入 URL' }]}
            extra="例如：https://x.com/elonmusk 或 https://github.com/trending"
          >
            <Input
              placeholder="https://x.com/username 或 https://example.com/feed.xml"
              disabled={submitting}
              className="font-mono"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium">
                名称 <span className="text-gray-400 font-normal">(可选，智能识别时自动填充)</span>
              </span>
            }
            name="name"
          >
            <Input
              placeholder="例如：GitHub Trending"
              disabled={submitting}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
