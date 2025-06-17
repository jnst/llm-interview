import { useState } from 'react';
import Button from '../common/Button';

export interface QualityRatingProps {
  onRate: (quality: number) => void;
  disabled?: boolean;
  initialValue?: number;
}

const QUALITY_LABELS = [
  { value: 0, label: '忘れた', description: '完全に忘れた', color: 'bg-red-500' },
  { value: 1, label: '見覚え', description: '間違えたが、見覚えはある', color: 'bg-red-400' },
  { value: 2, label: '近かった', description: '間違えたが、正解に近かった', color: 'bg-orange-400' },
  { value: 3, label: '時間要', description: '正解したが、思い出すのに時間がかかった', color: 'bg-yellow-400' },
  { value: 4, label: '少し迷った', description: '正解したが、少し迷った', color: 'bg-green-400' },
  { value: 5, label: '完璧', description: '即座に正解した', color: 'bg-green-500' }
] as const;

const QualityRating = ({ onRate, disabled = false, initialValue }: QualityRatingProps) => {
  const [selectedValue, setSelectedValue] = useState<number | null>(initialValue ?? null);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const handleSelect = (quality: number) => {
    if (disabled) return;
    
    setSelectedValue(quality);
    onRate(quality);
  };

  const displayValue = hoveredValue !== null ? hoveredValue : selectedValue;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-text mb-2">
          どのくらい理解できましたか？
        </h3>
        {displayValue !== null && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {QUALITY_LABELS[displayValue].description}
          </p>
        )}
      </div>

      {/* デスクトップ版 - 横並び */}
      <div className="hidden sm:flex items-center justify-center gap-2">
        {QUALITY_LABELS.map((item) => (
          <button
            key={item.value}
            onClick={() => handleSelect(item.value)}
            onMouseEnter={() => !disabled && setHoveredValue(item.value)}
            onMouseLeave={() => !disabled && setHoveredValue(null)}
            disabled={disabled}
            className={`
              flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 transition-all duration-200
              ${selectedValue === item.value
                ? `${item.color} border-gray-800 dark:border-gray-200 text-white shadow-lg`
                : 'bg-surface border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            `}
            aria-label={`品質評価 ${item.value}: ${item.description}`}
          >
            <span className="text-lg font-bold">{item.value}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>

      {/* モバイル版 - 縦並び */}
      <div className="sm:hidden space-y-2">
        {QUALITY_LABELS.map((item) => (
          <Button
            key={item.value}
            onClick={() => handleSelect(item.value)}
            disabled={disabled}
            fullWidth
            variant={selectedValue === item.value ? 'primary' : 'ghost'}
            className={`
              justify-start h-12 px-4
              ${selectedValue === item.value ? item.color : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-bold">
                {item.value}
              </span>
              <div className="text-left">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-75">{item.description}</div>
              </div>
            </div>
          </Button>
        ))}
      </div>

      {/* 評価基準の説明 */}
      <div className="text-xs text-center text-gray-500 dark:text-gray-400 border-t pt-3">
        <div className="flex justify-between items-center">
          <span>0: 忘れた</span>
          <span>5: 完璧に理解</span>
        </div>
      </div>
    </div>
  );
};

export default QualityRating;