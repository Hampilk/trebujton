import React from 'react';
import WidgetGroup from '@components/WidgetGroup';

const FormBadge = ({ 
  form = ['W', 'D', 'L', 'W', 'W'],
  size = 'sm',
  showLabel = false,
  label = "Recent Form"
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4 text-xs',
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base'
  };

  const getFormBadgeColor = (result) => {
    switch (result) {
      case 'W': return 'bg-green-500 text-white';
      case 'D': return 'bg-yellow-500 text-white';
      case 'L': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <WidgetGroup>
      <div className="flex items-center gap-3">
        {showLabel && (
          <span className="text-sm font-medium text-muted-foreground">{label}:</span>
        )}
        <div className="flex gap-1">
          {form.map((result, i) => (
            <span
              key={i}
              className={`${sizeClasses[size]} rounded-sm flex items-center justify-center font-semibold ${getFormBadgeColor(result)}`}
              title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
            >
              {result}
            </span>
          ))}
        </div>
      </div>
    </WidgetGroup>
  );
};

export default FormBadge;

// Widget metadata
FormBadge.meta = {
  id: 'form_badge',
  name: 'Team Form Badge',
  category: 'teams',
  defaultSize: { w: 1, h: 1 },
  preview: 'Small badge showing recent team form (W/D/L)',
  props: {
    form: {
      type: 'array',
      default: ['W', 'D', 'L', 'W', 'W'],
      description: 'Array of recent match results (W/D/L)'
    },
    size: {
      type: 'string',
      default: 'sm',
      description: 'Size of badges (xs/sm/md/lg)'
    },
    showLabel: {
      type: 'boolean',
      default: false,
      description: 'Whether to show label text'
    },
    label: {
      type: 'string',
      default: 'Recent Form',
      description: 'Label text to display'
    }
  }
};