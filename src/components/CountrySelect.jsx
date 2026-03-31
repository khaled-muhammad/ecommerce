import { COUNTRIES } from "../lib/countries.js";

const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));

/**
 * @param {{
 *   id?: string;
 *   name?: string;
 *   value: string;
 *   onChange: (code: string) => void;
 *   className?: string;
 *   required?: boolean;
 *   disabled?: boolean;
 *   autoComplete?: string;
 * }} props
 */
export default function CountrySelect({ id, name, value, onChange, className, required, disabled, autoComplete = "country" }) {
  const inList = COUNTRY_CODES.has(value);
  return (
    <select
      id={id}
      name={name}
      className={className}
      value={inList ? value : value || ""}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
    >
      {!inList && value ? (
        <option value={value}>{value}</option>
      ) : null}
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
