import { periods, PeriodType } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PeriodFilterProps = {
  currentPeriod: PeriodType;
  onChange: (period: PeriodType) => void;
};

export default function PeriodFilter({ currentPeriod, onChange }: PeriodFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={currentPeriod === period.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(period.value as PeriodType)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}