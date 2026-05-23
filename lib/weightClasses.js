export const WEIGHT_CLASSES = [
  { value: "flyweight",            label: "Flyweight",            kg: "50.8" },
  { value: "super-flyweight",      label: "Super Flyweight",      kg: "52.2" },
  { value: "bantamweight",         label: "Bantamweight",         kg: "53.5" },
  { value: "super-bantamweight",   label: "Super Bantamweight",   kg: "55.3" },
  { value: "featherweight",        label: "Featherweight",        kg: "57.2" },
  { value: "super-featherweight",  label: "Super Featherweight",  kg: "59.0" },
  { value: "lightweight",          label: "Lightweight",          kg: "61.2" },
  { value: "super-lightweight",    label: "Super Lightweight",    kg: "63.5" },
  { value: "welterweight",         label: "Welterweight",         kg: "66.7" },
  { value: "super-welterweight",   label: "Super Welterweight",   kg: "69.9" },
  { value: "middleweight",         label: "Middleweight",         kg: "72.6" },
  { value: "super-middleweight",   label: "Super Middleweight",   kg: "76.2" },
  { value: "light-heavyweight",    label: "Light Heavyweight",    kg: "79.4" },
  { value: "cruiserweight",        label: "Cruiserweight",        kg: "90.7" },
  { value: "heavyweight",          label: "Heavyweight",          kg: "91+" },
];

// Backward-compat: old stored values → class name
const LEGACY = {
  "-54": "Bantamweight",
  "-60": "Lightweight",
  "-67": "Welterweight",
  "-75": "Middleweight",
  "-81": "Light Heavyweight",
  "+91": "Heavyweight",
};

export function getWeightClassLabel(value) {
  if (!value) return null;
  if (LEGACY[value]) return LEGACY[value];
  const found = WEIGHT_CLASSES.find((w) => w.value === value);
  return found ? found.label : value;
}

export function getWeightClassDisplay(value) {
  if (!value) return null;
  if (LEGACY[value]) {
    const label = LEGACY[value];
    const found = WEIGHT_CLASSES.find((w) => w.label === label);
    return found ? `${label} · ${found.kg} kg` : label;
  }
  const found = WEIGHT_CLASSES.find((w) => w.value === value);
  return found ? `${found.label} · ${found.kg} kg` : value;
}
