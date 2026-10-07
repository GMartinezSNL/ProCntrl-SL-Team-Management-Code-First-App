// Onboard status pill (spec section 8, U4): Badge with an icon and text, never color alone (F11).
import type { ReactElement } from 'react';
import { Badge, type BadgeProps } from '@fluentui/react-components';
import {
  ArrowExitRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  PersonAddRegular,
} from '@fluentui/react-icons';
import type { OnboardStatus } from '../../data/types';

interface StatusLook {
  label: string;
  color: BadgeProps['color'];
  icon: ReactElement;
}

const STATUS_LOOK: Record<OnboardStatus, StatusLook> = {
  onboard: { label: 'Onboarded', color: 'success', icon: <CheckmarkCircleRegular /> },
  inProgress: { label: 'In-Progress', color: 'warning', icon: <ClockRegular /> },
  offboard: { label: 'Offboarded', color: 'subtle', icon: <ArrowExitRegular /> },
  none: { label: 'Not onboarded', color: 'informative', icon: <PersonAddRegular /> },
};

interface PersonStatusBadgeProps {
  status: OnboardStatus;
}

export function PersonStatusBadge({ status }: PersonStatusBadgeProps) {
  const { label, color, icon } = STATUS_LOOK[status];
  return (
    <Badge appearance="tint" color={color} icon={icon} shape="rounded">
      {label}
    </Badge>
  );
}
