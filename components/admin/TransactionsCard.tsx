import { ReactNode, useState } from 'react';
import { CardContainer } from './CardContainer';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface Transaction {
  id: string;
  icon?: ReactNode;
  label: string;
  date: string;
  amount: string;
  status?: 'completed' | 'pending' | 'cancelled';
}

interface TransactionsCardProps {
  title: string;
  transactions: Transaction[];
  onViewAll?: () => void;
}

/**
 * TransactionsCard - Recent transactions list matching reference
 * Responsive: on mobile, date stacks under label
 */
export function TransactionsCard({ title, transactions, onViewAll }: TransactionsCardProps) {
  const [sortBy, setSortBy] = useState<string>('date');
  return (
    <CardContainer>
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="max-w-[160px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
              </SelectContent>
            </Select>
            {onViewAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAll}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                View All
              </Button>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center gap-4 rounded-xl border border-border/30 bg-gray-50/30 p-4 transition-colors hover:bg-gray-50/50"
            >
              {/* Icon */}
              {transaction.icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-foreground">
                  {transaction.icon}
                </div>
              )}

              {/* Content - Responsive layout */}
              <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{transaction.label}</p>
                  <p className="text-xs text-muted-foreground sm:hidden">{transaction.date}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{transaction.amount}</p>
                    <p className="hidden text-xs text-muted-foreground sm:block">{transaction.date}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardContainer>
  );
}
