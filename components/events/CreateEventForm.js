"use client";

import s from "@/components/events/eventsStyles";
import { EVENT_TYPES, TYPE_META, getTypeLabel } from "@/components/events/eventHelpers";

/**
 * Inline form for creating a new event.
 *
 * Props:
 *   locale       {string}
 *   cfTitle      {string}    setCfTitle      {Function}
 *   cfDesc       {string}    setCfDesc       {Function}
 *   cfType       {string}    setCfType       {Function}
 *   cfDate       {string}    setCfDate       {Function}
 *   cfLocation   {string}    setCfLocation   {Function}
 *   cfCity       {string}    setCfCity       {Function}
 *   cfMax        {string}    setCfMax        {Function}
 *   creating     {boolean}
 *   createError  {string}
 *   onSubmit     {Function}
 *   labels       {object}    – { formTitle, titlePh, descPh, typeLabel, maxLabel,
 *                               cityPh, locationPh, publish, publishing, errorRequired, errorGeneric }
 */
export default function CreateEventForm({
  locale,
  cfTitle, setCfTitle,
  cfDesc,  setCfDesc,
  cfType,  setCfType,
  cfDate,  setCfDate,
  cfLocation, setCfLocation,
  cfCity,  setCfCity,
  cfMax,   setCfMax,
  creating,
  createError,
  onSubmit,
  labels,
}) {
  return (
    <div style={s.createForm}>
      <p style={s.formTitle}>{labels.formTitle}</p>

      <input
        type="text"
        value={cfTitle}
        onChange={(e) => setCfTitle(e.target.value)}
        placeholder={labels.titlePh}
        style={s.input}
      />

      <textarea
        value={cfDesc}
        onChange={(e) => setCfDesc(e.target.value)}
        placeholder={labels.descPh}
        style={s.textarea}
        rows={3}
      />

      <div style={s.formRow}>
        <div style={{ flex: 1 }}>
          <label style={s.fieldLabel}>{labels.typeLabel}</label>
          <select value={cfType} onChange={(e) => setCfType(e.target.value)} style={s.select}>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_META[type].emoji} {getTypeLabel(type, locale)}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={s.fieldLabel}>{labels.maxLabel}</label>
          <input
            type="number"
            value={cfMax}
            onChange={(e) => setCfMax(e.target.value)}
            placeholder="∞"
            style={s.input}
            min={1}
          />
        </div>
      </div>

      <input
        type="datetime-local"
        value={cfDate}
        onChange={(e) => setCfDate(e.target.value)}
        style={s.input}
      />

      <div style={s.formRow}>
        <input
          type="text"
          value={cfCity}
          onChange={(e) => setCfCity(e.target.value)}
          placeholder={labels.cityPh}
          style={{ ...s.input, flex: 1 }}
        />
        <input
          type="text"
          value={cfLocation}
          onChange={(e) => setCfLocation(e.target.value)}
          placeholder={labels.locationPh}
          style={{ ...s.input, flex: 2 }}
        />
      </div>

      {createError && <p style={s.errorText}>{createError}</p>}

      <button
        type="button"
        style={creating ? s.submitBtnDisabled : s.submitBtn}
        onClick={onSubmit}
        disabled={creating}
      >
        {creating ? labels.publishing : labels.publish}
      </button>
    </div>
  );
}
