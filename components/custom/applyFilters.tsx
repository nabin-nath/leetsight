"use client";
import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// import { toast } from "sonner"; // Not used, can remove
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DatePickerWithRange } from "../ui/DatePickerWithRange";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

const FormSchema = z.object({
  company: z.string(), // Company ID string
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const isInitialCompanySetRef = useRef(true);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    // Set defaultValues directly from initialFilters.
    // The `useEffect` for `initialFilters` will handle subsequent updates.
    defaultValues: {
      company: initialFilters.companyId,
      role: initialFilters.role,
      pageSize: initialFilters.pageSize,
    },
  });

  const { reset, watch, setValue, getValues } = form;

  // --- Effect to synchronize form with initialFilters prop changes ---
  useEffect(() => {
    reset({
      company: initialFilters.companyId,
      role: initialFilters.role, // This is crucial for restoring the role
      pageSize: initialFilters.pageSize,
    });
    setDateRange({ from: initialFilters.fromDate, to: initialFilters.toDate });
    // After syncing from props, mark that the company value is from initial set
    isInitialCompanySetRef.current = true;
  }, [initialFilters, reset]); // reset is stable

  const watchedCompany = watch("company"); // RHF's watch for company ID

  // --- Effect to fetch roles when company form field changes MANUALLY by user ---
  useEffect(() => {
    // This effect should primarily react to USER changes in the company dropdown.
    // console.log("ApplyFiltersCard: watchedCompany changed to:", watchedCompany, "isInitialSet:", isInitialCompanySetRef.current);

    // If isInitialCompanySetRef.current is true, it means 'watchedCompany' just got updated
    // by the 'initialFilters' useEffect. We don't want to reset the role or re-fetch roles
    // in this case, as 'initialFilters.role' should be respected.
    if (isInitialCompanySetRef.current) {
      isInitialCompanySetRef.current = false; // Reset the flag for subsequent manual changes
      // If a specific company is set from initialFilters, still ensure roles are fetched for it
      // This covers the case where the page loads with a company pre-selected via URL.
      // The parent's fetchRolesForCompany is idempotent, so this is safe.
      if (watchedCompany && watchedCompany !== "1000") {
        // console.log("ApplyFiltersCard: Initial company set to", watchedCompany, " ensuring roles are fetched via parent.");
        onCompanySelectedForRoleFetch(watchedCompany);
      }
      return; // Don't proceed to role reset logic if it was an initial set
    }

    // If we reach here, the company change was likely manual by the user in the form.
    // console.log("ApplyFiltersCard: Manual company change to:", watchedCompany);

    // When company changes manually, reset role to "All Roles" in the form.
    // The actual `availableRoles` will update via `onCompanySelectedForRoleFetch` and parent.
    setValue("role", "All Roles", {
      shouldValidate: false,
      shouldDirty: true, // Make the form dirty as user made a change
      shouldTouch: true,
    });

    // Trigger role fetch for the newly selected company.
    if (watchedCompany && watchedCompany !== "1000") {
      // console.log("ApplyFiltersCard: Manual change, triggering parent role fetch for company ID:", watchedCompany);
      onCompanySelectedForRoleFetch(watchedCompany);
    } else if (watchedCompany === "1000") {
      // console.log("ApplyFiltersCard: Manual change to 'All Companies', parent will handle role reset.");
      // Call onCompanySelectedForRoleFetch even for "1000" so parent can ensure availableRoles is ["All Roles"]
      onCompanySelectedForRoleFetch("1000");
    }
  }, [watchedCompany, setValue, onCompanySelectedForRoleFetch]); // `getValues` not needed as a dep

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    // console.log("ApplyFiltersCard: Form submitted with data:", data);
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
                              // Ensure comparison is consistent (string to string or number to number)
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
                              value={String(company.name)} // Use name for searching/filtering in Command
                              key={company.id}
                              onSelect={() => {
                                // When user selects a new company:
                                // `isInitialCompanySetRef.current` will be false here.
                                // The `useEffect` watching `watchedCompany` will handle
                                // role reset and calling `onCompanySelectedForRoleFetch`.
                                form.setValue("company", String(company.id));
                              }}
                            >
                              {company.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  // Compare selected field value with current company's ID
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
                  value={field.value} // This value should be correctly synced by initialFilters effect
                  disabled={
                    (watchedCompany === "1000" &&
                      availableRoles.length === 1 &&
                      availableRoles[0] === "All Roles") ||
                    isLoadingRoles
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      {/* Display placeholder if value is "All Roles" and it's the only option, or if loading */}
                      <SelectValue
                        placeholder={
                          (field.value === "All Roles" &&
                            availableRoles.length === 1 &&
                            availableRoles[0] === "All Roles" &&
                            watchedCompany !== "1000") ||
                          isLoadingRoles
                            ? "Select role" // More specific placeholder logic if needed
                            : field.value || "Select role" // Fallback
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingRoles ? (
                      <SelectItem value="loading" disabled>
                        Loading roles...
                      </SelectItem>
                    ) : availableRoles.length > 0 ? (
                      availableRoles
                        .filter((role) => role && role !== "N/A") // Keep this filter
                        .map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value="no-roles" disabled>
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
