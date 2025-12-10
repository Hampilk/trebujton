import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateInstanceProps,
  selectSelectedInstance,
  selectCurrentPageId,
  selectCurrentLayout,
} from "../../features/cms/pageLayoutsSlice";
import { getThemeVariantNames, getWidgetStyleVariant } from "../theme/tokens";
import { widgetRegistry } from "../registry/widgetRegistry";

/**
 * Props Editor Component
 *
 * Allows editors to:
 * - Edit selected widget props
 * - Configure widget-specific settings
 * - Manage widget variants
 *
 * Dispatches Redux actions to persist selections
 */
const PropsEditor = ({ pageId, onSave }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("props");
  const [colorPicker, setColorPicker] = useState(null);

  // Get current page and selected instance from Redux
  const currentPageId = useSelector(selectCurrentPageId);
  const selectedInstance = useSelector(selectSelectedInstance);
  const { instances } = useSelector(selectCurrentLayout);

  // Get widget definition for selected instance
  const selectedWidgetDef = selectedInstance 
    ? widgetRegistry.find(w => w.id === selectedInstance.type)
    : null;

  // Handle widget prop change
  const handlePropChange = useCallback(
    (propPath, value) => {
      if (!selectedInstance) return;
      
      const newProps = { ...selectedInstance.props };
      // Handle nested prop paths (e.g., "style.backgroundColor")
      if (propPath.includes('.')) {
        const keys = propPath.split('.');
        let current = newProps;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      } else {
        newProps[propPath] = value;
      }
      
      dispatch(updateInstanceProps({
        pageId: currentPageId,
        instanceId: selectedInstance.id,
        props: newProps
      }));
    },
    [dispatch, currentPageId, selectedInstance]
  );

  return (
    <div className="props-editor">
      <div className="props-editor__header">
        <h3>
          {selectedInstance 
            ? `Edit: ${selectedWidgetDef?.meta?.name || selectedInstance.type}`
            : 'Widget Properties'
          }
        </h3>
        {onSave && (
          <button onClick={onSave} className="props-editor__save-btn">
            Save Changes
          </button>
        )}
      </div>

      {!selectedInstance ? (
        <div className="props-editor__empty">
          <p>Select a widget to edit its properties</p>
        </div>
      ) : (
        <div className="props-editor__content">
          {/* Widget Props Tab */}
          <div className="props-editor__section">
            <div className="props-editor__widget-info">
              <h4>{selectedWidgetDef?.meta?.name || selectedInstance.type}</h4>
              <p className="text-sm text-gray-600">
                {selectedWidgetDef?.meta?.description || 'No description available'}
              </p>
            </div>

            {/* Basic props */}
            <div className="props-editor__group">
              <label>Widget ID</label>
              <input
                type="text"
                value={selectedInstance.id}
                disabled
                className="props-editor__input props-editor__input--disabled"
              />
            </div>

            <div className="props-editor__group">
              <label>Widget Type</label>
              <input
                type="text"
                value={selectedInstance.type}
                disabled
                className="props-editor__input props-editor__input--disabled"
              />
            </div>

            {/* Dynamic props based on widget definition */}
            {selectedWidgetDef?.meta?.propSchema && (
              <div className="props-editor__dynamic-props">
                <h5>Properties</h5>
                {Object.entries(selectedWidgetDef.meta.propSchema).map(([propName, schema]) => (
                  <div key={propName} className="props-editor__group">
                    <label>{schema.label || propName}</label>
                    
                    {schema.type === 'string' && (
                      <input
                        type="text"
                        value={selectedInstance.props[propName] || schema.default || ''}
                        onChange={(e) => handlePropChange(propName, e.target.value)}
                        placeholder={schema.placeholder}
                        className="props-editor__input"
                      />
                    )}
                    
                    {schema.type === 'number' && (
                      <input
                        type="number"
                        value={selectedInstance.props[propName] || schema.default || 0}
                        onChange={(e) => handlePropChange(propName, Number(e.target.value))}
                        min={schema.min}
                        max={schema.max}
                        className="props-editor__input"
                      />
                    )}
                    
                    {schema.type === 'boolean' && (
                      <label className="props-editor__checkbox">
                        <input
                          type="checkbox"
                          checked={selectedInstance.props[propName] || schema.default || false}
                          onChange={(e) => handlePropChange(propName, e.target.checked)}
                        />
                        <span>{schema.checkboxLabel || 'Enabled'}</span>
                      </label>
                    )}
                    
                    {schema.type === 'select' && (
                      <select
                        value={selectedInstance.props[propName] || schema.default || ''}
                        onChange={(e) => handlePropChange(propName, e.target.value)}
                        className="props-editor__select"
                      >
                        {schema.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {schema.description && (
                      <p className="props-editor__help-text">{schema.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Raw JSON editor for advanced users */}
            <div className="props-editor__group">
              <label>Raw Props (JSON)</label>
              <textarea
                value={JSON.stringify(selectedInstance.props, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handlePropChange('', parsed);
                  } catch (err) {
                    // Invalid JSON, don't update
                  }
                }}
                className="props-editor__textarea"
                rows={8}
                placeholder="Edit props as JSON"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropsEditor;
