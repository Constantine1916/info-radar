import { useRef } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { UserFeed } from '../lib/types';

interface FeedItemProps {
  feed: UserFeed;
  onEdit: (feed: UserFeed) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

export function FeedItem({ feed, onEdit, onDelete, onToggle }: FeedItemProps) {
  const controls = useDragControls();
  const scrollRaf = useRef<number | null>(null);

  const startDrag = (e: React.PointerEvent) => {
    controls.start(e);
    const EDGE = 80;
    const SPEED = 12;
    const onMove = (ev: PointerEvent) => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      const y = ev.clientY;
      const vh = window.innerHeight;
      const scroll = () => {
        if (y < EDGE) {
          window.scrollBy(0, -SPEED);
          scrollRaf.current = requestAnimationFrame(scroll);
        } else if (y > vh - EDGE) {
          window.scrollBy(0, SPEED);
          scrollRaf.current = requestAnimationFrame(scroll);
        }
      };
      scroll();
    };
    const onUp = () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <Reorder.Item
      value={feed}
      dragListener={false}
      dragControls={controls}
      className="p-3 sm:p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white list-none"
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      whileDrag={{ boxShadow: "0 8px 25px rgba(0,0,0,0.1)", zIndex: 50 }}
    >
      <div className="flex items-center justify-between w-full min-w-0">
        <div
          className="text-gray-300 hover:text-gray-500 mr-3 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={startDrag}
          title="拖拽排序"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{feed.name}</span>
            {feed.is_system && (
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">默认源</span>
            )}
          </div>
          <div className="text-xs text-gray-400 truncate mt-1">{feed.url}</div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4 flex-shrink-0">
          {/* 开关 */}
          <button
            onClick={() => onToggle(feed.id, !feed.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              feed.enabled ? 'bg-blue-500' : 'bg-gray-200'
            }`}
            title={feed.enabled ? '已启用' : '已禁用'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                feed.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          
          {/* 自定义源才显示编辑/删除按钮 */}
          {!feed.is_system && (
            <>
              <button 
                onClick={() => onEdit(feed)} 
                className="text-gray-300 hover:text-blue-500 transition-colors" 
                title="编辑"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                onClick={() => onDelete(feed.id)} 
                className="text-gray-300 hover:text-red-500 transition-colors" 
                title="删除"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </Reorder.Item>
  );
}
