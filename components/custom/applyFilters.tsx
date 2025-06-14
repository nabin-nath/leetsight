"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { DatePickerWithRange } from "../ui/DatePickerWithRange";

import { cn } from "@/lib/utils";

const FormSchema = z.object({
  company: z.string(),
  role: z.string(),
  pageSize: z.string(),
});

interface CompanyOption {
  name: string;
  id: string | number;
}

interface ApplyFiltersCardProps {
  availableCompanies: CompanyOption[];
  availableRoles: string[];
  initialFilters: {
    // This comes from the parent (Home) and reflects Redux state
    companyId: string;
    role: string;
    pageSize: string;
    fromDate?: Date;
    toDate?: Date;
  };
  isLoadingRoles: boolean;
  onFiltersChange: (filters: {
    companyId: string;
    role: string;
    pageSize: string;
    fromDate?: Date;
    toDate?: Date;
  }) => void;
  onCompanySelectedForRoleFetch: (companyId: string) => void;
}

export function ApplyFiltersCard({
  availableCompanies,
  availableRoles,
  initialFilters,
  isLoadingRoles,
  onFiltersChange,
  onCompanySelectedForRoleFetch,
}: ApplyFiltersCardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: initialFilters.fromDate,
    to: initialFilters.toDate,
  }));

  // Ref to store the previous companyId from initialFilters to detect actual changes
  const prevInitialCompanyIdRef = useRef<string | undefined>(
    initialFilters.companyId
  );
  // Ref to track if the company change was a manual user interaction
  const userChangedCompanyRef = useRef(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      // Initialize form directly
      company: initialFilters.companyId,
      role: initialFilters.role,
      pageSize: initialFilters.pageSize,
    },
  });

  const { reset, watch, setValue, getValues, formState } = form; // formState.isDirty can be useful

  // --- Effect to synchronize form with initialFilters prop changes (when parent state changes) ---
  useEffect(() => {
    // console.log("ApplyFiltersCard: initialFilters prop changed", initialFilters);
    // Only reset if initialFilters values have actually changed from what form currently holds
    // or if the form hasn't been touched by the user yet.
    // This prevents resetting user's intermediate changes if parent re-renders with same initialFilters.
    const currentFormValues = getValues();
    if (
      currentFormValues.company !== initialFilters.companyId ||
      currentFormValues.role !== initialFilters.role ||
      currentFormValues.pageSize !== initialFilters.pageSize
      // Not checking dateRange here as it's separate local state synced below
    ) {
      // console.log("ApplyFiltersCard: Resetting form due to initialFilters change.");
      reset({
        company: initialFilters.companyId,
        role: initialFilters.role,
        pageSize: initialFilters.pageSize,
      });
    }
    // Always sync dateRange if initialFilters.fromDate/toDate change
    if (
      dateRange?.from !== initialFilters.fromDate ||
      dateRange?.to !== initialFilters.toDate
    ) {
      setDateRange({
        from: initialFilters.fromDate,
        to: initialFilters.toDate,
      });
    }
    // Update ref *after* potential reset
    prevInitialCompanyIdRef.current = initialFilters.companyId;
    userChangedCompanyRef.current = false; // Reset flag when props update the form
  }, [initialFilters, reset, getValues]);

  const watchedCompany = watch("company");

  // --- Effect for when 'watchedCompany' (form's company field) changes ---
  useEffect(() => {
    // This effect is triggered by:
    // 1. `reset()` in the `initialFilters` useEffect.
    // 2. User manually changing the company in the combobox (`form.setValue("company", ...)`).

    // console.log(
    //   "ApplyFiltersCard: watchedCompany effect. Watched:", watchedCompany,
    //   "UserChanged:", userChangedCompanyRef.current
    // );

    if (userChangedCompanyRef.current) {
      // This means the user manually selected a new company.
      // console.log("ApplyFiltersCard: User manually changed company to:", watchedCompany);

      // Only reset role and fetch if the company actually changed to a different one
      // This prevents resetting role if user clicks the same company again.
      const currentFormCompany = getValues("company"); // Get current value before setValue potentially changes it
      if (currentFormCompany === watchedCompany) {
        // Ensure watchedCompany is the new value
        setValue("role", "All Roles", {
          shouldValidate: false,
          shouldDirty: true,
          shouldTouch: true,
        });
        onCompanySelectedForRoleFetch(watchedCompany || "1000");
      }
      userChangedCompanyRef.current = false; // Reset flag after handling
    }
    // If not userChangedCompanyRef.current, it means the change came from `initialFilters` (prop update).
    // In this case, the `reset` in the other useEffect has already set the correct `company` and `role`.
    // The parent (Home) component will handle fetching roles based on the updated `initialFilters.companyId`
    // (which translates to its `selectedCompanyIdForRoles`). No need to call onCompanySelectedForRoleFetch here.
  }, [watchedCompany, setValue, getValues, onCompanySelectedForRoleFetch]);

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    onFiltersChange({
      companyId: data.company,
      role: data.role,
      pageSize: data.pageSize,
      fromDate: dateRange?.from,
      toDate: dateRange?.to,
    });
  };

  const initialCalendarMonth =
    dateRange?.from || initialFilters.fromDate || new Date();

  return (
    <div className="mb-4 mt-5">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full flex items-end flex-wrap gap-4"
        >
          {/* Company */}
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Company</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-[200px] justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? availableCompanies.find(
                              (company) =>
                                String(company.id) === String(field.value)
                            )?.name
                          : "Select company"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search company..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No Company found</CommandEmpty>
                        <CommandGroup>
                          {availableCompanies.map((company) => (
                            <CommandItem
                              value={String(company.name)}
                              key={company.id}
                              onSelect={() => {
                                // User manually selected a company.
                                userChangedCompanyRef.current = true; // Set flag
                                form.setValue("company", String(company.id));
                                // The `watchedCompany` useEffect will now see userChangedCompanyRef.current as true
                                // and handle role reset & onCompanySelectedForRoleFetch.
                              }}
                            >
                              {company.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  String(company.id) === String(field.value)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={
                    (watchedCompany === "1000" && availableRoles.length <= 1) || // Simpler check for "All Companies"
                    isLoadingRoles
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingRoles ? (
                      <SelectItem value={field.value} disabled>
                        {" "}
                        {/* Show current value if loading */}
                        Loading roles...
                      </SelectItem>
                    ) : availableRoles.length > 0 ? (
                      availableRoles
                        .filter((role) => role && role !== "N/A")
                        .map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value={field.value} disabled>
                        {" "}
                        {/* Show current value if no roles */}
                        No roles available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Range */}
          <FormItem className="flex flex-col">
            <FormLabel>Date Range</FormLabel>
            <DatePickerWithRange
              value={dateRange}
              onChange={setDateRange}
              initialMonth={initialCalendarMonth}
            />
          </FormItem>

          {/* Page Size */}
          <FormField
            control={form.control}
            name="pageSize"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Page Size</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="40">40</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="md:mt-auto">
            Apply Filters
          </Button>
        </form>
      </Form>
    </div>
  );
}
