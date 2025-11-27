import {
  Status,
  StatusIndicator,
  StatusLabel,
  type StatusProps,
} from '@/components/ui/shadcn-io/status';
const StatusServer = ({ label, status }: { label: string; status: StatusProps['status'] }) => (
  <Status status={status}>
    <StatusIndicator />
    <StatusLabel className="font-mono">{label}</StatusLabel>
  </Status>
);
export default StatusServer;
