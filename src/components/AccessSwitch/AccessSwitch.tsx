// A Switch in a Field whose label text follows its state (spec section 8, e.g. "Core"/"Support").
import { Field, Switch } from '@fluentui/react-components';

interface AccessSwitchProps {
  checked: boolean;
  onLabel: string;
  offLabel: string;
  onChange: (checked: boolean) => void;
}

export function AccessSwitch({ checked, onLabel, offLabel, onChange }: AccessSwitchProps) {
  return (
    <Field>
      <Switch checked={checked} label={checked ? onLabel : offLabel} onChange={(_event, data) => onChange(data.checked)} />
    </Field>
  );
}
