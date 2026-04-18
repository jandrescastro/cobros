import { CURRENT_MONTH, CURRENT_YEAR } from "@/lib/mock-data";
import { MonthPicker } from "@/modules/meses/components/month-picker";

type MonthSummaryStripProps = {
  year?: number;
  month?: number;
};

export function MonthSummaryStrip({
  year = CURRENT_YEAR,
  month = CURRENT_MONTH
}: MonthSummaryStripProps) {
  return <MonthPicker year={year} month={month} />;
}
